import React from 'react';

interface DashboardTabProps {
  onStartScan: () => void;
}

export default function DashboardTab({ onStartScan }: DashboardTabProps) {
  return (
    <div className="animate-in fade-in max-w-7xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">مرحباً، الصيدلي المسؤول</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'وصفات صُرفت اليوم', value: '124', icon: 'fa-check-double', color: 'emerald' },
          { label: 'مرضى موجودون', value: '18', icon: 'fa-users', color: 'blue' },
          { label: 'محاولات مزورة محظورة', value: '3', icon: 'fa-ban', color: 'red' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">{label}</p>
              <h3 className={`text-3xl font-black ${color==='red'?'text-red-600':color==='blue'?'text-blue-600':'text-slate-800'}`}>{value}</h3>
            </div>
            <div className={`w-14 h-14 bg-${color}-50 text-${color}-500 rounded-2xl flex items-center justify-center text-2xl`}>
              <i className={`fa-solid ${icon}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">مريض جديد؟</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              امسح رمز QR من الورقة المطبوعة أو أدخل معرّف الوصفة يدوياً.
              أنت ترى الأدوية فقط — التشفير يحمي خصوصية المريض.
            </p>
          </div>
          <button onClick={onStartScan}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg flex items-center gap-3 shrink-0 pulse-border">
            <i className="fa-solid fa-camera" /> تشغيل المسح
          </button>
        </div>
      </div>
    </div>
  );
}
