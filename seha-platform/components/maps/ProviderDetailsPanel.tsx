"use client";

import React, { useEffect } from "react";
import type { ProviderPoint } from "@/data/providerDirectory";

interface ProviderDetailsPanelProps {
  open: boolean;
  provider: ProviderPoint | null;
  isOpenNow: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onBookAppointment: () => void;
  onGetDirections: () => void;
}

export default function ProviderDetailsPanel({
  open,
  provider,
  isOpenNow,
  onClose,
  onViewDetails,
  onBookAppointment,
  onGetDirections,
}: ProviderDetailsPanelProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!provider) return null;

  const badge =
    provider.type === "doctor"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const status =
    isOpenNow
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} dir="rtl">
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="إغلاق التفاصيل"
        tabIndex={open ? 0 : -1}
      />

      <aside
        className={`absolute bottom-0 left-0 right-0 z-50 max-h-[86vh] rounded-t-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-350 ease-out md:bottom-4 md:left-auto md:right-4 md:top-4 md:max-h-none md:w-[420px] md:rounded-3xl ${
          open ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-0 md:translate-x-[120%] opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل المزود"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 md:rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badge}`}
              >
                {provider.type === "doctor" ? "طبيب" : "صيدلية"}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${status}`}
              >
                {isOpenNow ? "مفتوح" : "مغلق"}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-black text-slate-900">{provider.name}</h3>
            {provider.type === "doctor" && provider.specialty && (
              <p className="mt-1 text-sm font-bold text-slate-600">{provider.specialty}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="إغلاق"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">العنوان</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{provider.address}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">ساعات العمل</p>
                <p className="mt-1 text-xs font-bold text-slate-700" dir="ltr">
                  {provider.openFrom} - {provider.openTo}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">الهاتف</p>
                <p className="mt-1 text-xs font-bold text-slate-700" dir="ltr">
                  {provider.phone}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {provider.type === "doctor" ? (
              <>
                <button
                  type="button"
                  onClick={onViewDetails}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-black text-white transition-colors hover:bg-slate-800"
                >
                  عرض تفاصيل خارجية
                </button>
                <button
                  type="button"
                  onClick={onBookAppointment}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white transition-colors hover:bg-blue-700"
                >
                  حجز موعد
                </button>
                <button
                  type="button"
                  onClick={onGetDirections}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white transition-colors hover:bg-emerald-700"
                >
                  الاتجاهات
                </button>
                <p className="mt-1 text-center text-xs font-semibold text-slate-500">
                  حجز المواعيد قادم لاحقاً (نسخة هاكاثون).
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={onGetDirections}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-black text-white transition-colors hover:bg-emerald-700"
              >
                الاتجاهات
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
