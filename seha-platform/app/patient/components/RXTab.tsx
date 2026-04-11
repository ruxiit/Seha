// RXTab.tsx
import React from 'react';
import { LockOpen, Loader2, FileX, Fingerprint, AlertCircle } from 'lucide-react';

interface RawPrescription {
  id: string;
  encrypted_blob: string;
  status: 'pending' | 'dispensed';
  created_at: string;
  doctor_id: string;
}

interface RXTabProps {
  rawPrescriptions: RawPrescription[];
  decryptingId: string | null;
  error: string | null;
  decryptRx: (rx: RawPrescription) => void;
}

export default function RXTab({ rawPrescriptions, decryptingId, error, decryptRx }: RXTabProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">وصفاتي</h2>
        <p className="text-[13px] text-slate-400 mt-1">اضغط على وصفة لفك التشفير برقمك الوطني</p>
      </div>

      {/* Empty state */}
      {rawPrescriptions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-[20px] bg-slate-100 flex items-center justify-center mb-4">
            <FileX size={28} className="text-slate-300" />
          </div>
          <p className="text-[15px] font-medium text-slate-500">لا توجد وصفات بعد</p>
          <p className="text-[13px] text-slate-300 mt-1">ستظهر وصفاتك هنا بعد زيارة طبيبك</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {rawPrescriptions.map(rx => {
          const isPending = rx.status === 'pending';
          const isDecrypting = decryptingId === rx.id;
          const dateStr = new Date(rx.created_at).toLocaleDateString('ar-DZ', {
            day: 'numeric', month: 'long', year: 'numeric',
          });

          return (
            <button
              key={rx.id}
              onClick={() => decryptRx(rx)}
              disabled={isDecrypting}
              className={`
                w-full text-right bg-white rounded-[18px] p-4
                border transition-all duration-150 active:scale-[0.98]
                ${isPending
                  ? 'border-slate-100 hover:border-blue-200 hover:shadow-[0_0_0_4px_rgba(37,99,235,0.06)]'
                  : 'border-slate-100 opacity-70'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={`
                    w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0
                    ${isPending ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'}
                  `}>
                    {isDecrypting
                      ? <Loader2 size={18} className="animate-spin" />
                      : <LockOpen size={18} />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        text-[11px] font-semibold px-2.5 py-0.5 rounded-full
                        ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {isPending ? 'نشطة' : 'مصروفة'}
                      </span>
                      <span className="text-[12px] text-slate-400">{dateStr}</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 truncate">{rx.id}</p>
                  </div>
                </div>

                {/* Decrypt hint */}
                {isPending && !isDecrypting && (
                  <div className="flex items-center gap-1 text-blue-500 shrink-0 ml-2">
                    <Fingerprint size={14} />
                    <span className="text-[11px] font-medium">فك التشفير</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-[14px] px-4 py-3">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}