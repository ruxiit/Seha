// PrescriptionModal.tsx
import React, { useState, useEffect } from 'react';
import { type PrescriptionData, buildQRUrl } from '@/lib/crypto';
import { callGemini, processAI } from '../utils';
import QRCode from 'qrcode';
import { X, Sparkles, CheckCircle2, Pill } from 'lucide-react';

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
      QRCode.toDataURL(url, { width: 160, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    } else {
      setQrCodeUrl(null);
    }
    setRxExplanation(null);
  }, [selectedRx]);

  const explainRx = async () => {
    if (!selectedRx) return;
    const medList = selectedRx.medications.map(m => `${m.name} - ${m.dosage}`).join(', ');
    setIsAiLoading(true);
    setRxExplanation(null);
    const res = await callGemini(
      `اشرح هذه الأدوية: ${medList}`,
      'أنت مساعد طبي. اشرح الأدوية بعربية مبسطة للمريض. أضف تنبيهاً طبياً.'
    );
    setRxExplanation(res);
    setIsAiLoading(false);
  };

  const close = () => { setRxModalOpen(false); setRxExplanation(null); };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-md transition-all duration-300 ${rxModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sheet */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto
          bg-white rounded-t-[32px] flex flex-col
          transition-all duration-300 ease-out
          ${rxModalOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
        style={{ maxHeight: '88dvh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-[16px] font-semibold text-slate-900">تفاصيل الوصفة</h3>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {selectedRx && (
            <>
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-[14px] p-3.5">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">الطبيب</p>
                  <p className="text-[14px] font-semibold text-slate-800">{selectedRx.doctorName}</p>
                </div>
                <div className="bg-slate-50 rounded-[14px] p-3.5">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">التاريخ</p>
                  <p className="text-[14px] font-semibold text-slate-800">{selectedRx.date}</p>
                </div>
                {selectedRx.diagnosis && (
                  <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-[14px] p-3.5">
                    <p className="text-[11px] font-medium text-amber-600 mb-1">التشخيص</p>
                    <p className="text-[14px] text-slate-800">{selectedRx.diagnosis}</p>
                  </div>
                )}
              </div>

              {/* QR / dispensed state */}
              {selectedRx.status === 'pending' && qrCodeUrl ? (
                <div className="flex flex-col items-center bg-slate-50 rounded-[20px] border border-slate-100 py-6 px-4">
                  <p className="text-[12px] font-medium text-slate-500 mb-3">رمز صرف الصيدلية</p>
                  <div className="bg-white p-3 rounded-[14px] border border-slate-200">
                    <img src={qrCodeUrl} alt="QR Code" className="w-[150px] h-[150px]" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3 text-center leading-relaxed max-w-[220px]">
                    قدّم هذا الرمز للصيدلي لصرف الأدوية بأمان
                  </p>
                </div>
              ) : selectedRx.status === 'dispensed' && (
                <div className="flex items-center gap-3 bg-slate-50 rounded-[20px] border border-slate-100 p-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-700">تم صرف الوصفة</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">لا يمكن إعادة استخدام هذا الرمز</p>
                  </div>
                </div>
              )}

              {/* Medications */}
              <div>
                <p className="text-[12px] font-medium text-slate-400 mb-3 tracking-wide">الأدوية الموصوفة</p>
                <div className="space-y-2.5">
                  {selectedRx.medications.map((med, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-slate-100 rounded-[14px] p-4">
                      <div className="w-9 h-9 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Pill size={16} />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-slate-800">{med.name}</p>
                        <p className="text-[13px] text-slate-500 mt-0.5">
                          {med.dosage}{med.duration ? ` · ${med.duration}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI explanation */}
              {!rxExplanation ? (
                <button
                  onClick={explainRx}
                  disabled={isAiLoading}
                  className="
                    w-full flex items-center justify-center gap-2
                    border border-violet-200 bg-violet-50 hover:bg-violet-100
                    text-violet-700 text-[14px] font-medium
                    py-3.5 rounded-[14px] transition-colors disabled:opacity-50
                  "
                >
                  {isAiLoading
                    ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83" strokeLinecap="round"/></svg>
                    : <Sparkles size={15} />
                  }
                  اشرح لي هذه الأدوية
                </button>
              ) : (
                <div className="bg-violet-50 border border-violet-100 rounded-[16px] p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-violet-100">
                    <Sparkles size={14} className="text-violet-600" />
                    <p className="text-[13px] font-semibold text-violet-800">شرح الوصفة</p>
                  </div>
                  <div
                    className="text-[13px] text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processAI(rxExplanation) }}
                  />
                </div>
              )}

              <button
                onClick={close}
                className="w-full py-[14px] bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-[15px] font-medium rounded-[14px] transition-all"
              >
                إغلاق
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}