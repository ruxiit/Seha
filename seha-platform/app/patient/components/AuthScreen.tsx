import React from 'react';
import { ShieldCheck, Phone, KeyRound, AlertCircle, Lock } from 'lucide-react';

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
  handleNinSubmit, handleOtpSubmit
}: AuthScreenProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/30">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">منصة المريض</h1>
          <p className="text-slate-500 mt-2">الوصول لمحفظتك الصحية الرقمية</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100" dir="rtl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {authStep === 'LOGIN_NIN' ? (
            <form onSubmit={handleNinSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pr-12 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-900 text-lg text-left"
                    placeholder="05..." dir="ltr" autoFocus />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">الرقم الوطني (NIN)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" value={nin} onChange={e => setNin(e.target.value)}
                    className="w-full pr-12 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-slate-900 text-lg text-left"
                    placeholder="أدخل رقمك الوطني" dir="ltr" autoFocus />
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Lock size={11} /> يُشفَّر رقمك محلياً — لا يُرسل إلى الخادم مطلقاً.
                </p>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                إرسال رمز التحقق
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">رمز التحقق (OTP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="number" value={otp} onChange={e => setOtp(e.target.value)}
                    className="w-full pr-12 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none tracking-[0.5em] text-2xl font-black text-center text-slate-900"
                    placeholder="••••" autoFocus />
                </div>
                <p className="text-xs text-blue-600 mt-3 text-center font-medium bg-blue-50 py-2 rounded-lg">للتجربة: أدخل 1234</p>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 flex justify-center items-center gap-2 active:scale-95 disabled:opacity-60">
                {isLoading ? <><i className="fa-solid fa-circle-notch fa-spin" /> جاري التحقق وإنشاء المفاتيح...</> : 'دخول للمحفظة'}
              </button>
              <button type="button" onClick={() => setAuthStep('LOGIN_NIN')}
                className="w-full py-3 mt-3 text-slate-400 font-medium hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                تغيير الرقم الوطني
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
