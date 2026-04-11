"use client";

import React, { useState, useEffect } from 'react';
import ScheduleTab from './components/ScheduleTab';
import PrescriptionTab from './components/PrescriptionTab';
import PharmacyDirectoryTab from './components/PharmacyDirectoryTab';
import DoctorAuthScreen from './components/DoctorAuthScreen';
import api, { authStore } from '@/lib/api';

type Tab = 'schedule' | 'prescription' | 'pharmacy';

/* ─────────────────────────────────────────────────────────────
   Doctor info shape (populated from backend JWT profile)
───────────────────────────────────────────────────────────── */
interface DoctorInfo {
  name: string;
  licenseNo: string;
  id: string;
  specialty?: string;
}

const FALLBACK_DOCTOR: DoctorInfo = {
  name: 'د. يوسف بركات',
  licenseNo: '14529',
  id: 'doc_001',
  specialty: 'طب باطني',
};

// LocalStorage key for persisting doctor session
const DOCTOR_SESSION_KEY = 'seha_doctor_session';

export default function DoctorPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth]   = useState(true);
  const [doctorInfo, setDoctorInfo]           = useState<DoctorInfo>(FALLBACK_DOCTOR);
  const [activeTab, setActiveTab]             = useState<Tab>('schedule');
  const [loginLoading, setLoginLoading]       = useState(false);
  const [loginError, setLoginError]           = useState<string | null>(null);

  /* ── Restore session on mount ──────────────────────────── */
  useEffect(() => {
    const token = authStore.getToken();
    const saved  = sessionStorage.getItem(DOCTOR_SESSION_KEY);

    if (token && saved) {
      try {
        const parsed = JSON.parse(saved) as DoctorInfo;
        setDoctorInfo(parsed);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    }
    setIsCheckingAuth(false);
  }, []);

  /* ── Login handler ─────────────────────────────────────── */
  const handleLogin = async (nin: string, password: string) => {
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await api.post('/auth/login', { nin, password });

      const { token, user, profile } = res.data;

      // Ensure the logged-in user is actually a doctor
      if (user.role !== 'doctor' && user.role !== 'admin') {
        setLoginError('هذه البوابة مخصصة للأطباء فقط. يرجى التحقق من حسابك.');
        return;
      }

      // Store JWT
      authStore.setToken(token);

      // Build DoctorInfo from backend profile (with sensible fallbacks)
      const info: DoctorInfo = {
        name:      profile?.name       || FALLBACK_DOCTOR.name,
        licenseNo: profile?.licenseNo  || profile?.license_no || FALLBACK_DOCTOR.licenseNo,
        id:        user.id             || FALLBACK_DOCTOR.id,
        specialty: profile?.specialty  || FALLBACK_DOCTOR.specialty,
      };

      setDoctorInfo(info);
      sessionStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(info));
      setIsAuthenticated(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === 'Invalid credentials') {
        setLoginError('الرقم الوطني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        // Backend unreachable — allow demo login for hackathon
        console.warn('Backend unreachable — using demo mode');
        authStore.setToken('demo_token');
        setDoctorInfo(FALLBACK_DOCTOR);
        sessionStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(FALLBACK_DOCTOR));
        setIsAuthenticated(true);
      } else {
        setLoginError(msg || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  /* ── Logout handler ────────────────────────────────────── */
  const handleLogout = () => {
    authStore.clearToken();
    sessionStorage.removeItem(DOCTOR_SESSION_KEY);
    setIsAuthenticated(false);
    setDoctorInfo(FALLBACK_DOCTOR);
    setActiveTab('schedule');
  };

  /* ── Splash while checking saved session ───────────────── */
  if (isCheckingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a, #134e4a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#14b8a6', fontSize: '2rem' }} />
      </div>
    );
  }

  /* ── Auth screen ───────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <DoctorAuthScreen
        onLogin={handleLogin}
        isLoading={loginLoading}
        error={loginError}
      />
    );
  }

  /* ── Authenticated dashboard ───────────────────────────── */
  const avatarInitials = doctorInfo.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('+');

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .glass-panel { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 8px 32px rgba(0,0,0,0.04); }
        .timeline-line { position: absolute; right: 11px; top: 0; bottom: 0; width: 2px; background-color: #e2e8f0; z-index: 0; }
        .slot-checkbox:checked + div { background-color: #14b8a6; color: white; border-color: #14b8a6; }
      `}} />

      <div className="flex h-screen overflow-hidden antialiased bg-slate-50" dir="rtl">

        {/* ── Sidebar ── */}
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col z-20 shadow-sm shrink-0 hidden md:flex">
          <div className="h-24 flex items-center px-8 border-b border-slate-100 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg ml-4">
              <i className="fa-solid fa-staff-snake text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">صحة</h1>
            <span className="mr-2 text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">DOCTOR</span>
          </div>

          <nav className="flex-1 py-6 space-y-1 overflow-y-auto px-4">
            {[
              { tab: 'schedule',     icon: 'fa-regular fa-calendar-days',  label: 'إدارة المواعيد' },
              { tab: 'prescription', icon: 'fa-solid fa-file-prescription', label: 'إصدار وصفة رقمية (E2EE)' },
              { tab: 'pharmacy',     icon: 'fa-solid fa-pills',             label: 'دليل الأدوية' },
            ].map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-right ${activeTab === tab ? 'bg-teal-50 text-teal-600 border-r-4 border-teal-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <i className={`${icon} text-xl w-6 text-center`} />
                <span className="text-[15px]">{label}</span>
              </button>
            ))}
          </nav>

          {/* E2EE notice */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 text-teal-600 mb-2">
              <i className="fa-solid fa-lock" />
              <span className="text-sm font-bold">تشفير نهاية لنهاية</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              الوصفة تُشفّر بمفتاح المريض العام. الخادم يخزن بيانات مشفرة فقط — لا أحد يقرأها غير المريض.
            </p>
          </div>

          {/* Logout */}
          <div className="px-4 pb-5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold"
            >
              <i className="fa-solid fa-right-from-bracket" />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col h-screen bg-slate-50 overflow-hidden">

          {/* Header */}
          <header className="h-24 glass-panel border-b border-slate-200 px-6 md:px-10 flex items-center justify-between z-10 sticky top-0 shrink-0">
            {/* Mobile tab switcher */}
            <div className="md:hidden flex gap-2">
              {(['schedule','prescription','pharmacy'] as Tab[]).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`p-2 rounded-lg text-sm ${activeTab===t?'bg-teal-100 text-teal-700':'bg-white text-slate-500'}`}>
                  <i className={t==='schedule'?'fa-solid fa-calendar':t==='prescription'?'fa-solid fa-file-prescription':'fa-solid fa-pills'} />
                </button>
              ))}
            </div>

            {/* Doctor info */}
            <div className="flex items-center gap-4 shrink-0 mr-auto">
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <i className="fa-solid fa-circle-check text-blue-500 text-sm" />
                  <h2 className="font-bold text-slate-800">{doctorInfo.name}</h2>
                </div>
                <p className="text-xs text-slate-500">
                  {doctorInfo.specialty || 'طبيب'} • رقم التسجيل: {doctorInfo.licenseNo}
                </p>
              </div>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(avatarInitials)}&background=0d9488&color=fff`}
                className="w-11 h-11 rounded-full border-2 border-white shadow-md"
                alt="Doctor avatar"
              />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth">
            {activeTab === 'schedule'     && <ScheduleTab />}
            {activeTab === 'prescription' && <PrescriptionTab doctorInfo={doctorInfo} />}
            {activeTab === 'pharmacy'     && <PharmacyDirectoryTab />}
          </div>
        </main>
      </div>
    </>
  );
}
