"use client";

import React, { useState, useEffect } from 'react';
import DashboardTab from './components/DashboardTab';
import ScanTab from './components/ScanTab';
import InventoryTab from './components/InventoryTab';
import PharmacyAuthScreen from './components/PharmacyAuthScreen';
import api, { authStore } from '@/lib/api';

type Tab = 'dashboard' | 'scan' | 'inventory';

/* ─────────────────────────────────────────────────────────────
   Pharmacy info shape (populated from backend JWT profile)
───────────────────────────────────────────────────────────── */
interface PharmacyInfo {
  name: string;
  licenseNo: string;
  id: string;
}

const FALLBACK_PHARMACY: PharmacyInfo = {
  name: 'صيدلية الشفاء',
  licenseNo: 'PH-10294',
  id: 'pharm_001',
};

// LocalStorage key for persisting pharmacy session
const PHARMACY_SESSION_KEY = 'seha_pharmacy_session';

export default function PharmacyPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth]   = useState(true);
  const [pharmacyInfo, setPharmacyInfo]       = useState<PharmacyInfo>(FALLBACK_PHARMACY);
  const [activeTab, setActiveTab]             = useState<Tab>('dashboard');
  const [loginLoading, setLoginLoading]       = useState(false);
  const [loginError, setLoginError]           = useState<string | null>(null);

  /* ── Restore session on mount ──────────────────────────── */
  useEffect(() => {
    const token = authStore.getToken();
    const saved = sessionStorage.getItem(PHARMACY_SESSION_KEY);

    if (token && saved) {
      try {
        const parsed = JSON.parse(saved) as PharmacyInfo;
        setPharmacyInfo(parsed);
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

      // Ensure the logged-in user is actually a pharmacist or admin
      if (user.role !== 'pharmacist' && user.role !== 'admin') {
        setLoginError('هذه البوابة مخصصة للصيادلة فقط. يرجى التحقق من حسابك.');
        return;
      }

      // Store JWT
      authStore.setToken(token);

      // Build PharmacyInfo from backend profile
      const info: PharmacyInfo = {
        name:      profile?.name       || profile?.pharmacy_name || FALLBACK_PHARMACY.name,
        licenseNo: profile?.licenseNo  || profile?.license_no || FALLBACK_PHARMACY.licenseNo,
        id:        user.id             || FALLBACK_PHARMACY.id,
      };

      setPharmacyInfo(info);
      sessionStorage.setItem(PHARMACY_SESSION_KEY, JSON.stringify(info));
      setIsAuthenticated(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === 'Invalid credentials') {
        setLoginError('الرقم الوطني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        // Backend unreachable — allow demo login for hackathon
        console.warn('Backend unreachable — using demo mode');
        authStore.setToken('demo_token');
        setPharmacyInfo(FALLBACK_PHARMACY);
        sessionStorage.setItem(PHARMACY_SESSION_KEY, JSON.stringify(FALLBACK_PHARMACY));
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
    sessionStorage.removeItem(PHARMACY_SESSION_KEY);
    setIsAuthenticated(false);
    setPharmacyInfo(FALLBACK_PHARMACY);
    setActiveTab('dashboard');
  };

  /* ── Splash while checking saved session ───────────────── */
  if (isCheckingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #022c22, #065f46)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#10b981', fontSize: '2rem' }} />
      </div>
    );
  }

  /* ── Auth screen ───────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <PharmacyAuthScreen
        onLogin={handleLogin}
        isLoading={loginLoading}
        error={loginError}
      />
    );
  }

  /* ── Authenticated dashboard ───────────────────────────── */
  const pharmacyInitials = pharmacyInfo.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('+');

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .pulse-border { animation: pb 2s infinite; }
        @keyframes pb { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        .alert-bg { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239,68,68,0.05) 10px, rgba(239,68,68,0.05) 20px); }
        #qr-reader { width: 100% !important; }
        #qr-reader video { border-radius: 1rem; }
      `}} />

      <div className="flex h-screen overflow-hidden antialiased bg-slate-50 pt-16" dir="rtl">

        {/* ── Sidebar ── */}
        <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col z-20 shrink-0 hidden md:flex">
          <div className="h-24 flex items-center px-8 border-b border-slate-800 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg ml-4">
              <i className="fa-solid fa-staff-snake text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-white">صحة</h1>
            <span className="mr-2 text-xs font-semibold bg-slate-800 text-emerald-400 px-2 py-1 rounded-md">PHARM</span>
          </div>

          <nav className="p-4 space-y-2 flex-1">
            <p className="text-[10px] font-bold text-slate-500 mb-3 px-2 tracking-wider uppercase">منصة الصيدلية</p>
            {[
              { tab: 'dashboard', icon: 'fa-chart-pie',       label: 'اللوحة الرئيسية' },
              { tab: 'scan',      icon: 'fa-qrcode',          label: 'مسح وصفة رقمية' },
              { tab: 'inventory', icon: 'fa-boxes-stacked',   label: 'المخزون المتصل' },
            ].map(({ tab, icon, label }) => (
              <button key={tab}
                onClick={() => setActiveTab(tab as Tab)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-right ${activeTab===tab ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}`}>
                <i className={`fa-solid ${icon} w-5 text-center`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Privacy notice */}
          <div className="p-5 border-t border-slate-800 text-xs text-slate-500 leading-relaxed">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <i className="fa-solid fa-eye-slash text-xs" /> عزل البيانات
            </div>
            ترى فقط اسم المريض والأدوية المطلوبة. السجل الطبي الكامل مشفر ولا يُكشف للصيدلية.
          </div>

          <div className="p-5 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pharmacyInitials)}&background=0f766e&color=fff`}
                className="w-10 h-10 rounded-full border border-slate-700"
                alt="Pharmacy avatar"
              />
              <div>
                <p className="text-sm font-bold text-white">{pharmacyInfo.name}</p>
                <p className="text-xs text-emerald-500">متصل بالشبكة الوطنية</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors text-xs font-semibold"
            >
              <i className="fa-solid fa-right-from-bracket" />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col h-screen bg-slate-50 overflow-hidden">

          {/* Header */}
          <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between shadow-sm shrink-0">
            <div className="md:hidden flex gap-2">
              {['dashboard','scan','inventory'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as Tab)}
                  className={`p-2 rounded-lg text-sm ${activeTab===t?'bg-emerald-100 text-emerald-700':'text-slate-500'}`}>
                  <i className={`fa-solid ${t==='dashboard'?'fa-chart-pie':t==='scan'?'fa-qrcode':'fa-boxes-stacked'}`} />
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-sm text-red-500 hover:bg-red-50 ml-2"
                title="تسجيل الخروج"
              >
                <i className="fa-solid fa-right-from-bracket" />
              </button>
            </div>
            <div className="hidden md:flex items-center gap-3 ml-auto">
              <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-200">
                <i className="fa-solid fa-shield-halved ml-1" /> الصيدلي يرى الأدوية فقط — E2EE
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeTab === 'dashboard' && <DashboardTab onStartScan={() => setActiveTab('scan')} />}
            {activeTab === 'scan' && <ScanTab />}
            {activeTab === 'inventory' && <InventoryTab />}
          </div>
        </main>
      </div>
    </>
  );
}
