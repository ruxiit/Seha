import React from 'react';
import medicinesData from '@/data/medicines.json';

export default function PharmacyDirectoryTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">دليل الأدوية</h2>
      <p className="text-slate-500 text-sm mb-6">مرجع الأدوية المتاحة في المنصة.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {medicinesData.map(med => (
          <div key={med.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-teal-300 transition-colors">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-3">
              <i className="fa-solid fa-pills" />
            </div>
            <p className="font-bold text-slate-800 text-sm">{med.name}</p>
            <p className="text-xs text-slate-400 mt-1 bg-slate-50 px-2 py-1 rounded-full w-fit">{med.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
