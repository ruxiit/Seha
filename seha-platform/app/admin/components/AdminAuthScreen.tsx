"use client";

import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';

interface AdminAuthScreenProps {
  onLogin: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function AdminAuthScreen({ onLogin, isLoading, error }: AdminAuthScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #0a1628 100%)' }}
      dir="rtl"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <ShieldAlert className="text-blue-400" size={32} />
          </div>
          <h1 className="text-4xl font-black text-white mb-1 tracking-tight">
            مركز التحكم
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-wider">
            صحة — السجل الوطني للوصفات الطبية
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6 pb-5 border-b border-slate-800">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-slate-400 text-sm font-bold">دخول المدراء فقط</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 tracking-wider">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm pr-12"
                  dir="ltr"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> جاري التحقق...</>
              ) : (
                <><Lock size={18} /> دخول الآمن</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6 flex items-center justify-center gap-1.5">
          <Lock size={10} />
          جلسة مؤمنة بـ JWT • جميع الأحداث مسجلة ومراقبة
        </p>
      </div>
    </div>
  );
}
