import React from 'react';

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
  setActiveTab: (tab: Tab) => void;
  decryptRx: (rx: RawPrescription) => void;
}

export default function HistoryTab({ rawPrescriptions, setActiveTab, decryptRx }: HistoryTabProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">السجل الطبي</h2>
      <div className="relative border-r-2 border-slate-200 mr-4 pr-6 space-y-8">
        {rawPrescriptions.map((rx) => (
          <div key={rx.id} className="relative">
            <span className={`absolute -right-[33px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${rx.status==='pending'?'bg-blue-500':'bg-slate-300'}`} />
            <div className={`p-4 rounded-2xl border ${rx.status==='pending'?'bg-white border-slate-100 shadow-sm':'bg-slate-50/80 border-slate-200 opacity-75'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs px-2 py-1 rounded font-bold ${rx.status==='pending'?'bg-amber-100 text-amber-700':'bg-slate-200 text-slate-600'}`}>
                  {rx.status==='pending'?'وصفة نشطة':'مصروفة'}
                </span>
                <p className="text-xs font-bold text-slate-400">{new Date(rx.created_at).toLocaleDateString('ar-DZ')}</p>
              </div>
              <p className="font-mono text-xs text-slate-500">{rx.id}</p>
              <button onClick={() => { setActiveTab('rx'); decryptRx(rx); }}
                className="mt-2 text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                عرض الوصفة المشفرة <i className="fa-solid fa-arrow-left text-[10px]" />
              </button>
            </div>
          </div>
        ))}
        {rawPrescriptions.length === 0 && (
          <p className="text-slate-400 text-sm">لا توجد سجلات بعد.</p>
        )}
      </div>
    </div>
  );
}
