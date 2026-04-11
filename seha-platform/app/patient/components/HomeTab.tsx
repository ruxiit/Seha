import React, { useState } from 'react';
import { callGemini, processAI } from '../utils';

type Tab = 'home' | 'rx' | 'history';

interface HomeTabProps {
  patientName?: string;
  setActiveTab: (tab: Tab) => void;
  setAuthStep: (step: 'LOGIN_NIN') => void;
  setNin: (nin: string) => void;
  setNinHash: (hash: string) => void;
}

export default function HomeTab({ patientName = 'مريض', setActiveTab, setAuthStep, setNin, setNinHash }: HomeTabProps) {
  const [symptomInput, setSymptomInput]   = useState('');
  const [aiResult, setAiResult]           = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading]     = useState(false);

  const analyzeSymptoms = async () => {
    if (!symptomInput) return;
    setIsAiLoading(true); setAiResult(null);
    const res = await callGemini(
      `أعراضي: ${symptomInput}`,
      'أنت مساعد طبي. حدد التخصص الطبي المناسب في جملتين. أنهِ بتنبيه أن هذا توجيه فقط.'
    );
    setAiResult(res); setIsAiLoading(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Greeting */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <img src="https://ui-avatars.com/api/?name=A+M&background=2563eb&color=fff" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="Avatar" />
          <div>
            <p className="text-xs text-slate-500 font-semibold">مرحباً بك،</p>
            <h1 className="text-xl font-bold text-slate-800">
              {patientName} <i className="fa-solid fa-hand text-yellow-500" />
            </h1>
          </div>
        </div>
        <button onClick={() => { setAuthStep('LOGIN_NIN'); setNin(''); setNinHash(''); }}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors">
          <i className="fa-solid fa-right-from-bracket" />
        </button>
      </div>

      {/* Privacy card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/25 mb-6 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-solid fa-lock text-blue-200" />
            <span className="text-sm font-bold text-blue-100">محفظتك مشفرة (E2EE)</span>
          </div>
          <p className="text-sm text-blue-100 leading-relaxed">
            وصفاتك مشفرة بمفتاحك الخاص فقط. لا الخادم ولا الصيدلي يستطيع الاطلاع على سجلك الكامل.
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <h3 className="font-bold text-slate-800 mb-4">الخدمات السريعة</h3>
      <div className="grid grid-cols-3 gap-4 mb-8 text-center">
        {[
          { tab: 'rx',      icon: 'fa-qrcode',       label: 'وصفاتي' },
          { tab: 'history', icon: 'fa-file-medical',  label: 'السجل' },
          { tab: 'home',    icon: 'fa-map-location-dot', label: 'صيدليات' },
        ].map(({ tab, icon, label }) => (
          <button key={tab} onClick={() => setActiveTab(tab as Tab)}
            className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 text-xl border border-slate-100 hover:bg-slate-50 transition-colors">
              <i className={`fa-solid ${icon}`} />
            </div>
            <span className="text-xs font-semibold text-slate-600">{label}</span>
          </button>
        ))}
      </div>

      {/* AI Symptom checker */}
      <div className="bg-gradient-to-r from-violet-50 to-white rounded-3xl p-5 border border-violet-100 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles text-sm" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">المساعد الذكي للأعراض</h3>
        </div>
        <div className="flex gap-2">
          <input type="text" value={symptomInput} onChange={e => setSymptomInput(e.target.value)}
            placeholder="صف ما تشعر به..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500" />
          <button onClick={analyzeSymptoms} disabled={isAiLoading || !symptomInput}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl px-4 text-sm font-bold transition-colors min-w-[80px]">
            {isAiLoading ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'تحليل ✨'}
          </button>
        </div>
        {aiResult && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-violet-100 text-sm text-slate-700 leading-relaxed shadow-sm">
            <div className="flex gap-3">
              <i className="fa-solid fa-robot text-violet-500 text-lg mt-1 shrink-0" />
              <div dangerouslySetInnerHTML={{ __html: processAI(aiResult) }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
