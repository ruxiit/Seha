import React, { useState, useEffect } from 'react';
import { type PrescriptionData, buildQRUrl } from '@/lib/crypto';
import { callGemini, processAI } from '../utils';
import QRCode from 'qrcode';

interface PrescriptionModalProps {
  rxModalOpen: boolean;
  setRxModalOpen: (open: boolean) => void;
  selectedRx: PrescriptionData | null;
}

export default function PrescriptionModal({ rxModalOpen, setRxModalOpen, selectedRx }: PrescriptionModalProps) {
  const [rxExplanation, setRxExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading]     = useState(false);
  const [qrCodeUrl, setQrCodeUrl]         = useState<string | null>(null);

  useEffect(() => {
    if (selectedRx?.prescriptionId && selectedRx?.pharmacyKey) {
      const url = buildQRUrl(selectedRx.prescriptionId, selectedRx.pharmacyKey);
      QRCode.toDataURL(url, { width: 140, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    } else {
      setQrCodeUrl(null);
    }
  }, [selectedRx]);

  const explainRx = async () => {
    if (!selectedRx) return;
    const medList = selectedRx.medications.map(m => `${m.name} - ${m.dosage}`).join(', ');
    setIsAiLoading(true); setRxExplanation(null);
    const res = await callGemini(
      `اشرح هذه الأدوية: ${medList}`,
      'أنت مساعد طبي. اشرح الأدوية بعربية مبسطة للمريض. أضف تنبيهاً طبياً.'
    );
    setRxExplanation(res); setIsAiLoading(false);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-white transform transition-transform duration-300 flex flex-col mx-auto max-w-md md:max-w-xl ${rxModalOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="font-bold text-slate-800 text-lg">تفاصيل الوصفة (مفكوكة التشفير)</h3>
        <button onClick={() => { setRxModalOpen(false); setRxExplanation(null); }}
          className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {selectedRx && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-xs text-slate-400 font-bold mb-1">الطبيب</p>
                <p className="font-bold text-slate-800 text-sm">{selectedRx.doctorName}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-xs text-slate-400 font-bold mb-1">التاريخ</p>
                <p className="font-bold text-slate-800 text-sm">{selectedRx.date}</p>
              </div>
              {selectedRx.diagnosis && (
                <div className="col-span-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-600 font-bold mb-1">التشخيص</p>
                  <p className="text-sm text-slate-800">{selectedRx.diagnosis}</p>
                </div>
              )}
            </div>

            {selectedRx.status === 'pending' && qrCodeUrl ? (
              <div className="bg-white flex flex-col items-center justify-center py-4 border border-slate-200 rounded-2xl mb-6 shadow-sm">
                <h4 className="font-bold text-slate-700 text-sm mb-2">رمز صرف الصيدلية (QR)</h4>
                <img src={qrCodeUrl} alt="Pharmacy QR Code" className="w-40 h-40" />
                <p className="text-xs text-slate-500 mt-2 text-center px-4">قدم هذا الرمز للصيدلي ليتمكن من استخراج قائمة الأدوية بأمان.</p>
              </div>
            ) : selectedRx.status === 'dispensed' && (
              <div className="bg-slate-100 flex items-center justify-center gap-3 py-6 rounded-2xl mb-6 border border-slate-200">
                <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-lg">
                  <i className="fa-solid fa-check" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-sm">تم صرف الوصفة</h4>
                  <p className="text-xs text-slate-500 mt-1">لا يمكن استخدام رمز الاستجابة السريعة (QR) مرة أخرى.</p>
                </div>
              </div>
            )}

            <h4 className="font-bold text-slate-700 mb-3 text-sm">الأدوية</h4>
            <div className="space-y-3 mb-6">
              {selectedRx.medications.map((med, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-capsules text-xs" />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                    {med.dosage}{med.duration ? ` — ${med.duration}` : ''}
                  </p>
                </div>
              ))}
            </div>

            {!rxExplanation ? (
              <button onClick={explainRx} disabled={isAiLoading}
                className="w-full mt-2 bg-violet-50 border border-violet-200 text-violet-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-violet-100 transition-colors">
                {isAiLoading ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-sparkles" />}
                اشرح لي هذه الأدوية بالذكاء الاصطناعي ✨
              </button>
            ) : (
              <div className="mt-4 p-5 bg-violet-50 rounded-2xl text-sm text-slate-700 border border-violet-200">
                <div className="flex items-center gap-2 mb-3 border-b border-violet-200 pb-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-violet-600" />
                  <h4 className="font-bold text-violet-800">شرح الوصفة</h4>
                </div>
                <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: processAI(rxExplanation) }} />
              </div>
            )}

            <button onClick={() => { setRxModalOpen(false); setRxExplanation(null); }}
              className="w-full mt-6 bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-md">
              إغلاق
            </button>
          </>
        )}
      </div>
    </div>
  );
}
