import React, { useState, useEffect } from 'react';
import medicinesData from '@/data/medicines.json';
import {
  encryptPrescriptionForPatient,
  encryptPharmacyLayer,
  buildQRUrl,
  importPublicKey,
  exportPublicKey,
  generatePatientKeyPair,
  saveEncryptedPrivateKey,
  protectPrivateKey,
  hashNIN,
  type PrescriptionData,
} from '@/lib/crypto';
import api from '@/lib/api';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';

interface Medicine { id: string; name: string; category: string; }
interface PrescriptionItem { medicine: Medicine; dosage: string; duration: string; }

interface DoctorInfo {
  name: string;
  licenseNo: string;
  id: string;
  specialty?: string;
}

interface PrescriptionTabProps {
  doctorInfo: DoctorInfo;
}

export default function PrescriptionTab({ doctorInfo }: PrescriptionTabProps) {
  // Prescription builder state
  const [patientNin, setPatientNin]   = useState('');
  const [patientName, setPatientName] = useState('أمين منصوري');
  const [patientAge, setPatientAge]   = useState('45');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [selectedDrug, setSelectedDrug]   = useState('Paracetamol 1000mg');
  const [customDosage, setCustomDosage]   = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingPatient, setIsFetchingPatient] = useState(false);
  const [statusMsg, setStatusMsg]       = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Medicine search
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setSearchResults(
        medicinesData.filter(m =>
          m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
        ).slice(0, 6)
      );
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const addMedication = () => {
    if (!selectedDrug) return;
    if (prescriptionItems.find(i => i.medicine.name === selectedDrug)) {
      setDuplicateError(true);
      setTimeout(() => setDuplicateError(false), 3000);
      return;
    }
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicine: { id: Date.now().toString(), name: selectedDrug, category: 'General' },
        dosage: customDosage || 'حسب التوجيهات الطبية',
        duration: customDuration || '',
      },
    ]);
    setCustomDosage('');
    setCustomDuration('');
  };

  const removeMedication = (name: string) =>
    setPrescriptionItems(prescriptionItems.filter(i => i.medicine.name !== name));

  // ── Fetch Patient Details ────────────────────────────────
  const fetchPatientDetails = async () => {
    if (!patientNin) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال الرقم الوطني أولاً.' });
      return;
    }
    
    setIsFetchingPatient(true);
    setStatusMsg(null);
    try {
      const res = await api.get(`/patients/profile?nin=${encodeURIComponent(patientNin)}`);
      if (res.data && res.data.name) {
        setPatientName(res.data.name);
        setPatientAge(res.data.age || '');
        setStatusMsg({ type: 'success', text: `✅ تم استرجاع بيانات المريض بنجاح.` });
      } else {
        setStatusMsg({ type: 'error', text: 'لم يتم العثور على بيانات المريض بهذا الرقم.' });
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setStatusMsg({ type: 'error', text: 'لم يتم العثور على مريض مسجل بهذا الرقم الوطني.' });
      } else {
        setStatusMsg({ type: 'error', text: 'خطأ في جلب بيانات المريض. يرجى المحاولة لاحقاً.' });
      }
      console.error(err);
    } finally {
      setIsFetchingPatient(false);
    }
  };

  // ── Main prescription generation ──────────────────────────
  const generatePrescription = async () => {
    if (!patientNin || prescriptionItems.length === 0) {
      setStatusMsg({ type: 'error', text: 'يرجى إدخال رقم المريض وإضافة دواء واحد على الأقل.' });
      return;
    }

    setIsGenerating(true);
    setStatusMsg(null);

    try {
      const nin_hash = await hashNIN(patientNin);

      const prescriptionData: PrescriptionData = {
        patientName,
        patientNin: nin_hash,
        doctorName: doctorInfo.name,
        doctorLicenseNo: doctorInfo.licenseNo,
        date: new Date().toISOString().split('T')[0],
        medications: prescriptionItems.map(i => ({
          name: i.medicine.name,
          dosage: i.dosage,
          duration: i.duration,
        })),
      };

      // ── STEP 1: Get or create patient public key ──────────
      let patientPublicKey: CryptoKey;
      try {
        const res = await api.get(`/patients/public-key?nin=${encodeURIComponent(patientNin)}`);
        patientPublicKey = await importPublicKey(res.data.public_key);
      } catch {
        const keyPair = await generatePatientKeyPair();
        const pubKeyB64 = await exportPublicKey(keyPair.publicKey);

        await api.post('/patients/public-key', { nin: patientNin, public_key: pubKeyB64 });
        patientPublicKey = keyPair.publicKey;

        const encryptedPK = await protectPrivateKey(keyPair.privateKey, patientNin);
        saveEncryptedPrivateKey(nin_hash, encryptedPK);
      }

      // ── STEP 2: Generate a temporary prescription ID ───────
      const tempId = `RX-${Date.now()}`;

      // ── STEP 3: Encrypt LAYER 2 (pharmacy-only view) ──────
      const { pharmacyBlob, pharmacyKey } = await encryptPharmacyLayer(tempId, prescriptionData);

      // Attach pharmacyKey to patient's data before encrypting LAYER 1 so patient app can show QR
      const fullPatientData = { ...prescriptionData, pharmacyKey };

      // ── STEP 4: Encrypt LAYER 1 (full, for patient only) ──
      const encrypted_blob = await encryptPrescriptionForPatient(fullPatientData, patientPublicKey);

      // ── STEP 5: Send both blobs to server ─────────────────
      let prescriptionId = tempId;
      try {
        const res = await api.post('/prescriptions', {
          encrypted_blob,
          pharmacy_encrypted_blob: pharmacyBlob,
          patient_nin: patientNin,
          doctor_id: doctorInfo.id,
        });
        if (res.data?.prescription?.id) {
          prescriptionId = res.data.prescription.id;
        }
      } catch (err: any) {
        console.error('Failed to create prescription on server:', err);
        throw new Error(err.response?.data?.message || 'تعذر سيرفر قاعدة البيانات، لا يمكن إصدار وصفة حقيقية.');
      }

      // ── STEP 6: Build QR URL (pharmacy key in fragment) ───
      const qrUrl = buildQRUrl(prescriptionId, pharmacyKey);
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 180, margin: 1 });

      // ── STEP 7: Generate printable PDF ────────────────────
      const doc = new jsPDF({ unit: 'mm', format: 'a5' });

      // Header
      doc.setFillColor(13, 148, 136);
      doc.rect(0, 0, 148, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('Seha Platform', 74, 10, { align: 'center' });
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Digital Medical Prescription — منصة صحة', 74, 17, { align: 'center' });

      // Patient info
      doc.setTextColor(30, 30, 30); doc.setFontSize(10);
      doc.setFont('helvetica', 'bold'); doc.text('Patient / المريض', 12, 32);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${patientName}`, 12, 39);
      doc.text(`Age: ${patientAge}`, 12, 45);
      doc.text(`Date: ${prescriptionData.date}`, 85, 39);
      doc.text(`Doctor: ${doctorInfo.name}`, 85, 45);
      doc.text(`License: ${doctorInfo.licenseNo}`, 85, 51);

      doc.setDrawColor(200, 200, 200); doc.line(12, 56, 136, 56);

      // Medications
      doc.setFont('helvetica', 'bold'); doc.text('Rx — Medications', 12, 63);
      let y = 71;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      prescriptionItems.forEach((item, i) => {
        doc.setFont('helvetica', 'bold'); doc.text(`${i + 1}. ${item.medicine.name}`, 14, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
        doc.text(`Dosage: ${item.dosage}${item.duration ? ` | Duration: ${item.duration}` : ''}`, 18, y + 5);
        doc.setTextColor(30, 30, 30);
        y += 14;
      });

      doc.line(12, y, 136, y); y += 8;

      // QR Section
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text('Pharmacy Verification QR — رمز التحقق للصيدلي', 74, y, { align: 'center' });
      y += 4;
      doc.addImage(qrDataUrl, 'PNG', 54, y, 40, 40);
      y += 42;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
      doc.text(`ID: ${prescriptionId}`, 74, y, { align: 'center' });

      // Security notice
      y += 7;
      doc.setFontSize(7); doc.setTextColor(150, 150, 150);
      doc.text('The QR shows medications only. Full records remain private (E2EE).', 74, y, { align: 'center' });
      doc.text('هذا الرمز يكشف الأدوية فقط. السجل الكامل مشفر ولا يراه الصيدلي.', 74, y + 4, { align: 'center' });

      doc.save(`seha_rx_${patientName.replace(/\s/g,'_')}_${prescriptionData.date}.pdf`);

      setStatusMsg({ type: 'success', text: `✅ تم إصدار الوصفة ${prescriptionId} وتحميل PDF بنجاح.` });
      setPrescriptionItems([]);
      setPatientNin('');

    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'فشل إنشاء الوصفة. يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-5xl mx-auto space-y-6">

      {/* Status message */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl font-semibold text-sm flex items-start gap-3 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          statusMsg.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <i className={`fa-solid ${statusMsg.type==='success'?'fa-check-circle':statusMsg.type==='info'?'fa-circle-info':'fa-triangle-exclamation'} mt-0.5`} />
          {statusMsg.text}
        </div>
      )}

      {/* E2EE info banner */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
          <i className="fa-solid fa-shield-halved text-sm" />
        </div>
        <div>
          <p className="text-sm font-bold text-teal-800">نظام التشفير الثنائي (E2EE)</p>
          <p className="text-xs text-teal-700 mt-1 leading-relaxed">
            الوصفة تُشفَّر بطبقتين: <strong>طبقة المريض</strong> (RSA كاملة) + <strong>طبقة الصيدلي</strong> (فقط الأدوية، مضمّنة في QR الورقي).
            المريض لا يحتاج هاتفاً — يكفي تقديم الورقة المطبوعة.
          </p>
        </div>
      </div>

      {/* Patient info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-user-injured text-teal-500" /> بيانات المريض
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الرقم الوطني (NIN) *</label>
            <div className="flex gap-2">
              <input
                type="text" value={patientNin} onChange={e => setPatientNin(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchPatientDetails()}
                placeholder="أدخل رقم هوية المريض"
                className="w-full border border-slate-300 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                dir="ltr"
              />
              <button 
                onClick={fetchPatientDetails}
                disabled={isFetchingPatient || !patientNin}
                className="bg-teal-100 text-teal-700 hover:bg-teal-200 disabled:opacity-50 px-3 rounded-xl transition-colors shrink-0 font-bold text-sm"
                title="جلب بيانات المريض"
              >
                {isFetchingPatient ? <Loader2 size={16} className="animate-spin" /> : <i className="fa-solid fa-search" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الاسم</label>
            <input
              type="text" value={patientName} readOnly
              placeholder="يتم جلبه تلقائياً"
              className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded-xl py-2.5 px-4 text-sm outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">العمر</label>
            <input
              type="number" value={patientAge} readOnly
              placeholder="يتم جلبه تلقائياً"
              className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded-xl py-2.5 px-4 text-sm outline-none cursor-not-allowed"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Medicine adder */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-pills text-teal-500" /> إضافة أدوية
        </h3>

        {/* Search */}
        <div className="relative mb-4">
          <i className="fa-solid fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if(e.target.value) setSelectedDrug(e.target.value); }}
            placeholder="ابحث عن دواء..."
            className="w-full border border-slate-300 rounded-xl py-2.5 pr-10 pl-4 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
              {searchResults.map(med => (
                <button key={med.id} onClick={() => { setSelectedDrug(med.name); setSearchQuery(med.name); setSearchResults([]); }}
                  className="w-full px-4 py-3 text-right text-sm hover:bg-teal-50 flex justify-between items-center border-b border-slate-100 last:border-0">
                  <span className="font-semibold text-slate-800">{med.name}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{med.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الجرعة</label>
            <input type="text" value={customDosage} onChange={e => setCustomDosage(e.target.value)}
              placeholder="مثال: حبة صباحاً ومساءً"
              className="w-full border border-slate-300 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">المدة</label>
            <input type="text" value={customDuration} onChange={e => setCustomDuration(e.target.value)}
              placeholder="مثال: 7 أيام"
              className="w-full border border-slate-300 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
        </div>

        {duplicateError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-pulse">
            <i className="fa-solid fa-triangle-exclamation" />
            <span className="font-semibold">تحذير: الدواء مضاف بالفعل أو توجد وصفة نشطة لنفس الدواء.</span>
          </div>
        )}

        <button onClick={addMedication}
          className="w-full border-2 border-dashed border-teal-300 text-teal-600 font-bold py-3 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
          <i className="fa-solid fa-plus" /> إضافة إلى قائمة الأدوية
        </button>
      </div>

      {/* Prescription items */}
      {prescriptionItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h4 className="text-sm font-bold text-slate-500 mb-4">الأدوية المضافة ({prescriptionItems.length})</h4>
          <div className="space-y-3">
            {prescriptionItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-capsules text-sm" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.medicine.name}</p>
                    <p className="text-xs text-slate-500">{item.dosage}{item.duration ? ` | ${item.duration}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => removeMedication(item.medicine.name)}
                  className="text-red-400 hover:text-red-600 transition-colors p-2">
                  <i className="fa-regular fa-trash-can" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issue button */}
      <div className="flex justify-end">
        <button
          onClick={generatePrescription}
          disabled={isGenerating || prescriptionItems.length === 0 || !patientNin}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-teal-500/30 flex items-center gap-3"
        >
          {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <i className="fa-solid fa-file-signature" />}
          {isGenerating ? 'جاري التشفير والإصدار...' : 'إصدار الوصفة وطباعة QR'}
        </button>
      </div>
    </div>
  );
}
