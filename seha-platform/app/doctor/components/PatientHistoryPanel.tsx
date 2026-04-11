import React, { useEffect, useMemo, useState } from "react";

type HistoryEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  diagnosis: string;
  medications: string[];
};

type HistoryPayload = {
  entries: HistoryEntry[];
};

const STORAGE_PREFIX = "seha_patient_history:";

const chronicKeywords = ["hypertension", "diabetes", "asthma", "heart", "ckd"];

const safeParseJson = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const buildMockHistory = (nin: string): HistoryPayload | null => {
  const digits = nin.replace(/\D/g, "");
  if (digits.length < 6) return null;

  // Simple deterministic mock:
  // - If last digit is 1/3 => no history
  // - If last digit is even => includes Hypertension
  const lastDigit = Number(digits[digits.length - 1] ?? "0");
  if (lastDigit === 1 || lastDigit === 3) return { entries: [] };

  const hasHypertension = lastDigit % 2 === 0;
  const baseDate = new Date();
  const date1 = new Date(baseDate);
  date1.setMonth(baseDate.getMonth() - 8);
  const date2 = new Date(baseDate);
  date2.setMonth(baseDate.getMonth() - 3);

  const format = (d: Date) => d.toISOString().slice(0, 10);

  const entries: HistoryEntry[] = [
    {
      id: `hx-${digits}-1`,
      date: format(date1),
      diagnosis: hasHypertension ? "Hypertension" : "Acute Bronchitis",
      medications: hasHypertension ? ["Amlodipine", "Lifestyle advice"] : ["Amoxicillin", "Paracetamol"],
    },
    {
      id: `hx-${digits}-2`,
      date: format(date2),
      diagnosis: "Gastritis",
      medications: ["Omeprazole", "Antacid"],
    },
  ];

  return { entries };
};

const getRiskLabel = (entries: HistoryEntry[]): string | null => {
  const diagnoses = entries.map((e) => e.diagnosis.toLowerCase());
  if (diagnoses.some((d) => d.includes("hypertension"))) return "Patient has Hypertension";
  if (diagnoses.some((d) => chronicKeywords.some((k) => d.includes(k)))) return "Patient has chronic condition(s)";
  return null;
};

export default function PatientHistoryPanel({ nin }: { nin: string }) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [loadedNin, setLoadedNin] = useState<string | null>(null);

  const trimmedNin = nin.trim();
  const isLoading = Boolean(trimmedNin) && trimmedNin !== loadedNin;

  useEffect(() => {
    if (!trimmedNin) {
      return;
    }

    let canceled = false;

    const timer = window.setTimeout(() => {
      if (canceled) return;
      const key = `${STORAGE_PREFIX}${trimmedNin}`;
      const raw = window.localStorage.getItem(key);
      const stored = raw ? safeParseJson<HistoryPayload>(raw) : null;
      const payload = stored ?? buildMockHistory(trimmedNin) ?? { entries: [] };
      setEntries(payload.entries);
      setLoadedNin(trimmedNin);
    }, 550);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedNin]);

  const riskLabel = useMemo(() => (entries ? getRiskLabel(entries) : null), [entries]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left text-teal-500" /> Patient History
        </h3>
        <span className="text-[11px] font-black text-slate-400" dir="ltr">
          {trimmedNin ? `NIN: ${trimmedNin}` : "—"}
        </span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 animate-pulse">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-56 rounded bg-slate-200" />
              <div className="mt-3 flex gap-2">
                <div className="h-6 w-20 rounded-full bg-slate-200" />
                <div className="h-6 w-24 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!trimmedNin && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
          Enter a patient NIN to load history.
        </div>
      )}

      {!isLoading && trimmedNin && entries !== null && entries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
          No history found for this patient.
        </div>
      )}

      {!isLoading && trimmedNin && entries !== null && entries.length > 0 && (
        <>
          {riskLabel && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <div>
                <p className="text-sm font-black">{riskLabel}</p>
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  Review previous diagnoses and treatments before issuing the prescription.
                </p>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute right-[10px] top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="relative pr-8">
                  <div className="absolute right-2 top-3 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-teal-100" />
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-black text-slate-500" dir="ltr">
                        {entry.date}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                        Visit
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-black text-slate-900">{entry.diagnosis}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {entry.medications.map((med) => (
                        <span
                          key={`${entry.id}:${med}`}
                          className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-700"
                        >
                          <i className="fa-solid fa-pills text-[10px]" />
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
