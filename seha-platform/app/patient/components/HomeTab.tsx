// HomeTab.tsx
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { callGemini, processAI } from '../utils';
import { LogOut, Lock, Zap, Map, FileText, QrCode, Sparkles, ChevronLeft, Calendar, Phone } from 'lucide-react';
import { useBookings } from '@/lib/bookingStore';

type Tab = 'home' | 'rx' | 'history';

interface HomeTabProps {
  patientName?: string;
  setActiveTab: (tab: Tab) => void;
  setAuthStep: (step: 'LOGIN_NIN') => void;
  setNin: (nin: string) => void;
  setNinHash: (hash: string) => void;
}

const SmartMap = dynamic(() => import('@/components/maps/SmartMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-[20px] bg-slate-100 animate-pulse" />
  ),
});

const QUICK_ACTIONS = [
  { tab: 'rx' as Tab,      icon: <QrCode size={22} />,    label: 'وصفاتي',   color: 'bg-blue-50 text-blue-600' },
  { tab: 'history' as Tab, icon: <FileText size={22} />,  label: 'السجل',    color: 'bg-violet-50 text-violet-600' },
  { tab: 'home' as Tab,    icon: <Map size={22} />,        label: 'صيدليات', color: 'bg-emerald-50 text-emerald-600' },
];

export default function HomeTab({
  patientName = 'مريض', setActiveTab,
  setAuthStep, setNin, setNinHash,
}: HomeTabProps) {
  const { addBooking } = useBookings();
  const [symptomInput, setSymptomInput] = useState('');
  const [aiResult, setAiResult]         = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading]   = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    doctorId: 'doc_001',
    selectedTime: '10:00',
    phone: '',
  });
  const [bookingToast, setBookingToast] = useState<string | null>(null);

  const analyzeSymptoms = async () => {
    if (!symptomInput.trim()) return;
    setIsAiLoading(true);
    setAiResult(null);
    const res = await callGemini(
      `أعراضي: ${symptomInput}`,
      'أنت مساعد طبي. حدد التخصص الطبي المناسب في جملتين. أنهِ بتنبيه أن هذا توجيه فقط.'
    );
    setAiResult(res);
    setIsAiLoading(false);
  };

  const handleLogout = () => {
    setAuthStep('LOGIN_NIN');
    setNin('');
    setNinHash('');
  };

  const handleBooking = () => {
    if (!bookingData.phone.trim()) {
      setBookingToast('يرجى إدخال رقم الهاتف');
      setTimeout(() => setBookingToast(null), 3000);
      return;
    }

    addBooking({
      doctorId: bookingData.doctorId,
      doctorName: 'الطبيب المتخصص',
      patientName,
      patientPhone: bookingData.phone,
      time: bookingData.selectedTime,
      status: 'pending',
    });

    setBookingToast('✓ تم إرسال طلب الحجز بنجاح!');
    setTimeout(() => setBookingToast(null), 3000);
    setIsBookingModalOpen(false);
    setBookingData({ doctorId: 'doc_001', selectedTime: '10:00', phone: '' });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-[13px] font-semibold select-none">
            {patientName.charAt(0)}
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">مرحباً بك،</p>
            <h1 className="text-[17px] font-semibold text-slate-900 leading-tight">{patientName}</h1>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          aria-label="تسجيل الخروج"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* ── E2EE banner ── */}
      <div className="bg-blue-600 rounded-[20px] p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={14} className="text-blue-200" />
          <span className="text-[12px] font-medium text-blue-200 tracking-wide">محفظة مشفرة — E2EE</span>
        </div>
        <p className="text-[14px] text-blue-100 leading-relaxed">
          وصفاتك مشفرة بمفتاحك الخاص فقط. لا الخادم ولا الصيدلي يستطيع الاطلاع على سجلك.
        </p>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="text-[12px] font-medium text-slate-400 mb-3 tracking-wide">الخدمات السريعة</p>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ tab, icon, label, color }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center gap-2 py-4 bg-white rounded-[16px] border border-slate-100 hover:border-slate-200 active:scale-[0.97] transition-all"
            >
              <span className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${color}`}>
                {icon}
              </span>
              <span className="text-[12px] font-medium text-slate-600">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Book Appointment ── */}
      <div>
        <p className="text-[12px] font-medium text-slate-400 mb-3 tracking-wide">احجز موعداً</p>
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-[16px] p-4 flex items-center justify-between transition-all active:scale-95 shadow-lg shadow-blue-600/20"
        >
          <div className="flex items-center gap-3">
            <Calendar size={20} />
            <div className="text-left">
              <p className="font-semibold text-[14px]">حجز موعد مع الطبيب</p>
              <p className="text-[12px] text-blue-100">اختر الوقت المناسب لك</p>
            </div>
          </div>
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ── Booking Modal ── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50 animate-in fade-in duration-200">
          <div className="w-full bg-white rounded-t-3xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">احجز موعداً جديداً</h2>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Booking Form */}
            <div className="space-y-4">
              {/* Time Selector */}
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-2">اختر الوقت</label>
                <select
                  value={bookingData.selectedTime}
                  onChange={(e) => setBookingData({ ...bookingData, selectedTime: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[12px] text-slate-900 font-medium focus:outline-none focus:border-blue-400"
                >
                  {['09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:00', '16:30'].map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-2">رقم الهاتف</label>
                <div className="flex gap-2">
                  <div className="w-14 px-3 py-3 bg-slate-50 border border-slate-200 rounded-[12px] flex items-center justify-center text-slate-600 font-medium">
                    +966
                  </div>
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    placeholder="500000000"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-[12px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Booking Toast */}
              {bookingToast && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-[12px] text-[13px] text-blue-700 font-medium text-center animate-in fade-in">
                  {bookingToast}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleBooking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-[12px] transition-all active:scale-95"
              >
                تأكيد الحجز
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Smart map ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-medium text-slate-400 tracking-wide">القريبون منك</p>
          <button className="flex items-center gap-0.5 text-[12px] text-blue-600 font-medium">
            عرض الكل <ChevronLeft size={13} />
          </button>
        </div>
        <SmartMap compact title="الخريطة الذكية" subtitle="مزودو الخدمة القريبون منك" />
      </div>

      {/* ── AI Symptom checker ── */}
      <div className="bg-white rounded-[20px] border border-slate-100 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-[10px] bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-slate-800">المساعد الذكي</p>
            <p className="text-[11px] text-slate-400">صف أعراضك واحصل على توجيه طبي</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={symptomInput}
            onChange={e => setSymptomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyzeSymptoms()}
            placeholder="صف ما تشعر به..."
            className="
              flex-1 bg-slate-50 border border-slate-200 rounded-[12px]
              px-4 py-2.5 text-[14px] text-slate-900
              placeholder:text-slate-300 focus:outline-none focus:border-violet-400
              focus:bg-white transition-colors
            "
          />
          <button
            onClick={analyzeSymptoms}
            disabled={isAiLoading || !symptomInput.trim()}
            className="
              px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40
              text-white text-[13px] font-medium rounded-[12px]
              flex items-center gap-1.5 transition-all active:scale-95
            "
          >
            {isAiLoading
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" strokeLinecap="round"/></svg>
              : <Zap size={14} />
            }
            تحليل
          </button>
        </div>

        {aiResult && (
          <div className="mt-4 p-4 bg-violet-50 rounded-[12px] border border-violet-100">
            <div className="flex gap-3">
              <Sparkles size={16} className="text-violet-500 shrink-0 mt-0.5" />
              <div
                className="text-[13px] text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: processAI(aiResult) }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}