import React from 'react';

// You might want to define this in a shared types file later
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">وصفاتي الرقمية</h2>
      <p className="text-slate-500 text-sm mb-6">اضغط على وصفة لفك التشفير ورؤية تفاصيلها.</p>

      {rawPrescriptions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <i className="fa-solid fa-file-medical text-5xl mb-4 block" />
          <p className="font-semibold">لا توجد وصفات بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rawPrescriptions.map(rx => (
            <button key={rx.id} onClick={() => decryptRx(rx)} disabled={decryptingId === rx.id}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-right hover:border-blue-300 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${rx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {rx.status === 'pending' ? 'نشطة' : 'مصروفة'}
                  </span>
                  <p className="font-mono text-xs text-slate-400 mt-2">{rx.id}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  {decryptingId === rx.id
                    ? <i className="fa-solid fa-circle-notch fa-spin" />
                    : <i className="fa-solid fa-lock-open" />
                  }
                </div>
              </div>
              <p className="text-xs text-slate-500">{new Date(rx.created_at).toLocaleDateString('ar-DZ')}</p>
              <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
                <i className="fa-solid fa-fingerprint text-xs" /> اضغط لفك التشفير بمفتاحك الخاص
              </p>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
