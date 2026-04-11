"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import medicinesData from '@/data/medicines.json';

const SmartMap = dynamic(() => import('@/components/maps/SmartMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200" />
  ),
});

export default function PharmacyDirectoryTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="mb-2 text-3xl font-bold text-slate-800">دليل الأدوية</h2>
        <p className="text-sm text-slate-500">مرجع الأدوية المتاحة + خريطة ذكية لمقدمي الخدمة القريبين.</p>
      </div>

      <SmartMap
        title="الخريطة الذكية - مزودو الخدمة القريبون"
        subtitle="اعثر على الأطباء والصيدليات القريبة، راجع حالة الفتح فوراً، وافتح الاتجاهات بنقرة واحدة."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Medicine Directory</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {medicinesData.length} items
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {medicinesData.map((med) => (
            <div
              key={med.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <i className="fa-solid fa-pills" />
              </div>
              <p className="text-sm font-bold text-slate-800">{med.name}</p>
              <p className="mt-1 w-fit rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-400">{med.category}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
