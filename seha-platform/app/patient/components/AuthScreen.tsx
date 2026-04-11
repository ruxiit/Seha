// AuthScreen.tsx
import React from 'react';
import { ShieldCheck, Phone, KeyRound, AlertCircle, Lock, ChevronLeft } from 'lucide-react';

interface AuthScreenProps {
  authStep: 'LOGIN_NIN' | 'LOGIN_OTP';
  setAuthStep: (step: 'LOGIN_NIN' | 'LOGIN_OTP') => void;
  nin: string;
  setNin: (nin: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  isLoading: boolean;
  error: string | null;
  handleNinSubmit: (e: React.FormEvent) => void;
  handleOtpSubmit: (e: React.FormEvent) => void;
}

export default function AuthScreen({
  authStep, setAuthStep,
  nin, setNin,
  phone, setPhone,
  otp, setOtp,
  isLoading, error,
  handleNinSubmit, handleOtpSubmit,
}: AuthScreenProps) {
  const isNinStep = authStep === 'LOGIN_NIN';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4">
      {/* Logo block */}
      <div className="flex flex-col items-center mb-8 select-none">
        <div className="w-[60px] h-[60px] bg-blue-600 rounded-[18px] flex items-center justify-center mb-4">
          <ShieldCheck size={28} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-[22px] font-medium text-slate-900 tracking-tight">منصة المريض</h1>
        <p className="text-[13px] text-slate-400 mt-1">محفظتك الصحية الرقمية</p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5 mb-5">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${isNinStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${!isNinStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'}`} />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[360px] bg-white rounded-[20px] border border-slate-100 p-7"
        dir="rtl"
        style={{ boxShadow: '0 2px 24px 0 rgba(0,0,0,0.06)' }}
      >
        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl px-4 py-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1 — NIN + Phone ── */}
        {isNinStep ? (
          <form onSubmit={handleNinSubmit}>
            {/* Phone field */}
            <div className="mb-4">
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5 tracking-wide">
                رقم الهاتف
              </label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  autoFocus
                  className="
                    w-full pr-10 pl-4 py-3 text-[15px] text-slate-900 font-medium
                    bg-slate-50 border border-slate-200 rounded-[12px]
                    focus:bg-white focus:border-blue-500 focus:ring-0
                    outline-none transition-colors placeholder:text-slate-300
                  "
                />
              </div>
            </div>

            {/* NIN field */}
            <div className="mb-1">
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5 tracking-wide">
                الرقم الوطني (NIN)
              </label>
              <div className="relative">
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                  <KeyRound size={16} />
                </span>
                <input
                  type="text"
                  value={nin}
                  onChange={e => setNin(e.target.value)}
                  placeholder="أدخل رقمك الوطني"
                  dir="ltr"
                  className="
                    w-full pr-10 pl-4 py-3 text-[15px] text-slate-900 font-medium
                    bg-slate-50 border border-slate-200 rounded-[12px]
                    focus:bg-white focus:border-blue-500 focus:ring-0
                    outline-none transition-colors placeholder:text-slate-300
                  "
                />
              </div>
            </div>

            <p className="flex items-center justify-end gap-1 text-[11px] text-slate-300 mb-5 mt-2">
              <Lock size={10} />
              يُشفَّر رقمك محلياً — لا يُرسل إلى الخادم مطلقاً
            </p>

            <button
              type="submit"
              className="
                w-full py-[14px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
                text-white text-[15px] font-medium rounded-[12px]
                transition-all duration-150
              "
            >
              إرسال رمز التحقق
            </button>
          </form>

        ) : (
        /* ── Step 2 — OTP ── */
          <form onSubmit={handleOtpSubmit}>
            {/* Back link */}
            <button
              type="button"
              onClick={() => setAuthStep('LOGIN_NIN')}
              className="flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-700 mb-5 transition-colors"
            >
              <ChevronLeft size={14} />
              تغيير البيانات
            </button>

            <label className="block text-[12px] font-medium text-slate-400 mb-1.5 tracking-wide">
              رمز التحقق
            </label>

            <input
              type="number"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="• • • •"
              autoFocus
              className="
                w-full py-4 text-center text-[28px] font-semibold tracking-[0.6em]
                text-slate-900 bg-slate-50 border border-slate-200 rounded-[12px]
                focus:bg-white focus:border-blue-500 outline-none
                transition-colors placeholder:tracking-normal placeholder:text-[18px]
                placeholder:text-slate-300 mb-3
              "
            />

            <div className="flex items-center justify-center bg-blue-50 rounded-xl py-2.5 mb-5">
              <p className="text-[12px] font-medium text-blue-500">للتجربة: أدخل 1234</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-[14px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98]
                disabled:opacity-50 text-white text-[15px] font-medium rounded-[12px]
                flex items-center justify-center gap-2 transition-all duration-150
              "
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                  جاري التحقق...
                </>
              ) : 'دخول للمحفظة'}
            </button>
          </form>
        )}
      </div>

      <p className="text-[11px] text-slate-300 mt-6">
        بيانات مشفرة end-to-end · لا يمكن لأحد الاطلاع عليها
      </p>
    </div>
  );
}
