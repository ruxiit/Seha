// HistoryTab.tsx
import React from 'react';
import { FileText, ChevronLeft, History, Pill, AlertCircle } from 'lucide-react';
import { Medicine, Diagnosis, Treatment } from '@/lib/api';

interface RawPrescription {
  id: string;
  encrypted_blob: string;
  status: 'pending' | 'dispensed';
  created_at: string;
  doctor_id: string;
}

type Tab = 'home' | 'rx' | 'history';

interface HistoryTabProps {
  rawPrescriptions: RawPrescription[];
  medicines: Medicine[];
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  setActiveTab: (tab: Tab) => void;
  decryptRx: (rx: RawPrescription) => void;
}

export default function HistoryTab({ 
  rawPrescriptions, 
  medicines, 
  diagnoses, 
  treatments, 
  setActiveTab, 
  decryptRx 
}: HistoryTabProps) {
  // Group medicines by prescription
  const medicinesByPrescription = medicines.reduce((acc, medicine) => {
    if (!acc[medicine.prescription_id]) {
      acc[medicine.prescription_id] = [];
    }
    acc[medicine.prescription_id].push(medicine);
    return acc;
  }, {} as Record<string, Medicine[]>);

  if (rawPrescriptions.length === 0 && medicines.length === 0) {
    return (
      <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-slate-100 flex items-center justify-center mb-4">
          <History size={28} className="text-slate-300" />
        </div>
        <p className="text-[15px] font-medium text-slate-500">لا توجد سجلات بعد</p>
        <p className="text-[13px] text-slate-300 mt-1">سيظهر تاريخك الطبي هنا</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">السجل الطبي</h2>
        <p className="text-[13px] text-slate-400 mt-1">
          {rawPrescriptions.length} وصفة مسجلة • {medicines.length} أدوية موصوفة
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute right-[19px] top-5 bottom-5 w-px bg-slate-100" />

        <div className="space-y-6">
          {/* Diagnoses Section */}
          {diagnoses.length > 0 && (
            <div className="space-y-3">
              {diagnoses.map((diagnosis) => (
                <div key={diagnosis.id} className="flex gap-4 items-start">
                  {/* Timeline dot */}
                  <div className="relative shrink-0 w-10 flex justify-center pt-[18px]">
                    <div className="w-3 h-3 rounded-full border-2 border-white bg-amber-500 z-10" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white rounded-[16px] border border-amber-100 p-4 transition-all hover:border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        تشخيص
                      </span>
                      <span className="text-[12px] text-slate-400">
                        {new Date(diagnosis.created_at).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-semibold text-slate-900 mb-1">{diagnosis.diagnosis_name}</h3>
                    {diagnosis.icd_code && (
                      <p className="text-[11px] text-slate-400 mb-2">ICD Code: {diagnosis.icd_code}</p>
                    )}
                    {diagnosis.notes && (
                      <p className="text-[12px] text-slate-600 italic">{diagnosis.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medicines Section */}
          {medicines.length > 0 && (
            <div className="space-y-3">
              {medicines.map((medicine) => (
                <div key={medicine.id} className="flex gap-4 items-start">
                  {/* Timeline dot */}
                  <div className="relative shrink-0 w-10 flex justify-center pt-[18px]">
                    <div className="w-3 h-3 rounded-full border-2 border-white bg-emerald-500 z-10" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white rounded-[16px] border border-emerald-100 p-4 transition-all hover:border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill size={16} className="text-emerald-600" />
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        علاج
                      </span>
                      <span className="text-[12px] text-slate-400">
                        {new Date(medicine.created_at).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-semibold text-slate-900 mb-2">{medicine.medicine_name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-[12px] mb-2">
                      {medicine.dosage && <p className="text-slate-600"><span className="font-semibold">الجرعة:</span> {medicine.dosage}</p>}
                      {medicine.frequency && <p className="text-slate-600"><span className="font-semibold">التكرار:</span> {medicine.frequency}</p>}
                      {medicine.duration && <p className="text-slate-600"><span className="font-semibold">المدة:</span> {medicine.duration}</p>}
                    </div>
                    {medicine.instructions && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">💡 {medicine.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Treatments Section */}
          {treatments.length > 0 && (
            <div className="space-y-3">
              {treatments.map((treatment) => (
                <div key={treatment.id} className="flex gap-4 items-start">
                  {/* Timeline dot */}
                  <div className="relative shrink-0 w-10 flex justify-center pt-[18px]">
                    <div className="w-3 h-3 rounded-full border-2 border-white bg-blue-500 z-10" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white rounded-[16px] border border-blue-100 p-4 transition-all hover:border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {treatment.treatment_type}
                      </span>
                      <span className="text-[12px] text-slate-400">
                        {new Date(treatment.created_at).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                    {treatment.description && (
                      <p className="text-[13px] text-slate-700 mb-2">{treatment.description}</p>
                    )}
                    {treatment.instructions && (
                      <p className="text-[11px] text-slate-600 italic">📋 {treatment.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Original Prescriptions List */}
          {rawPrescriptions.map((rx, idx) => {
            const isPending = rx.status === 'pending';
            const dateStr = new Date(rx.created_at).toLocaleDateString('ar-DZ', {
              day: 'numeric', month: 'long', year: 'numeric',
            });
            const rxMedicines = medicinesByPrescription[rx.id] || [];

            return (
              <div key={rx.id} className="flex gap-4 items-start">
                {/* Timeline dot */}
                <div className="relative shrink-0 w-10 flex justify-center pt-[18px]">
                  <div className={`
                    w-3 h-3 rounded-full border-2 border-white z-10
                    ${isPending ? 'bg-blue-500' : 'bg-slate-300'}
                  `} />
                </div>

                {/* Card */}
                <div className={`
                  flex-1 bg-white rounded-[16px] border p-4 transition-all
                  ${isPending ? 'border-slate-100' : 'border-slate-100 opacity-70'}
                `}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`
                      text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                      ${isPending ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {isPending ? 'وصفة نشطة' : 'مصروفة'}
                    </span>
                    <span className="text-[12px] text-slate-400">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    <FileText size={12} className="text-slate-300" />
                    <p className="font-mono text-[11px] text-slate-400 truncate">{rx.id}</p>
                  </div>

                  {rxMedicines.length > 0 && (
                    <div className="mb-3 p-2 bg-slate-50 rounded text-[11px]">
                      <p className="font-semibold text-slate-700 mb-1">الأدوية:</p>
                      {rxMedicines.map(med => (
                        <p key={med.id} className="text-slate-600">• {med.medicine_name} - {med.dosage || 'بدون جرعة'}</p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => { setActiveTab('rx'); decryptRx(rx); }}
                    className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    عرض الوصفة كاملة
                    <ChevronLeft size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}