import React from 'react';

export default function ScheduleTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">إدارة المواعيد</h2>
        <p className="text-slate-500 text-sm">تحكم في الفترات المتاحة للحجز.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { time: '09:00 ص', booked: true, name: 'محمد رضا' },
            { time: '09:30 ص', available: true },
            { time: '10:00 ص', available: true },
            { time: '10:30 ص', closed: true },
            { time: '11:00 ص', booked: true, name: 'سارة بن علي' },
            { time: '11:30 ص', available: true },
          ].map((slot, i) => (
            <div key={i} className={`rounded-xl p-4 text-center border ${
              slot.booked ? 'bg-amber-50 border-amber-200' :
              slot.closed ? 'bg-slate-50 border-slate-200 opacity-60' :
              'bg-teal-50 border-teal-200'
            }`}>
              <p className={`font-bold text-lg mb-1 ${slot.booked?'text-amber-800':slot.closed?'text-slate-400':'text-teal-700'}`}>{slot.time}</p>
              <p className={`text-xs font-semibold ${slot.booked?'text-amber-600':slot.closed?'text-slate-400':'text-teal-600'}`}>
                {slot.booked ? slot.name : slot.closed ? 'مغلق' : 'متاح'}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-left">
          <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-teal-500/30 text-sm">
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}
