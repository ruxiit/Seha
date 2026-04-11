"use client";

import React, { useState, useCallback } from 'react';
import {
  hashNIN,
  generatePatientKeyPair,
  exportPublicKey,
  protectPrivateKey,
  restorePrivateKey,
  decryptPrescription,
  saveEncryptedPrivateKey,
  loadEncryptedPrivateKey,
  hasLocalKeyPair,
  type PrescriptionData,
} from '@/lib/crypto';
import api from '@/lib/api';

import AuthScreen from './components/AuthScreen';
import HomeTab from './components/HomeTab';
import RXTab from './components/RXTab';
import HistoryTab from './components/HistoryTab';
import PrescriptionModal from './components/PrescriptionModal';

type AuthStep = 'LOGIN_NIN' | 'LOGIN_OTP' | 'AUTHENTICATED';
type Tab = 'home' | 'rx' | 'history';

interface RawPrescription {
  id: string;
  encrypted_blob: string;
  status: 'pending' | 'dispensed';
  created_at: string;
  doctor_id: string;
}

export default function PatientPortal() {
  const [authStep, setAuthStep]     = useState<AuthStep>('LOGIN_NIN');
  const [nin, setNin]               = useState('');
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [patientName, setPatientName] = useState('مريض');
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [ninHash, setNinHash]       = useState('');

  const [activeTab, setActiveTab]             = useState<Tab>('home');
  const [rawPrescriptions, setRawPrescriptions] = useState<RawPrescription[]>([]);
  const [decryptedMap, setDecryptedMap]         = useState<Record<string, PrescriptionData>>({});
  const [decryptingId, setDecryptingId]         = useState<string | null>(null);
  const [selectedRx, setSelectedRx]             = useState<PrescriptionData | null>(null);
  const [rxModalOpen, setRxModalOpen]           = useState(false);

  // ── Auth: NIN & Phone submit ──────────────────────────────────────
  const handleNinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nin.trim().length < 5) {
      setError('يرجى إدخال رقم وطني صحيح (5 أرقام على الأقل).');
      return;
    }
    if (phone.trim().length < 8) {
      setError('يرجى إدخال رقم هاتف صحيح.');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    try {
      await api.post('/auth/request-otp', { nin, phone });
      setAuthStep('LOGIN_OTP');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'فشل التحقق من المريض (تأكد من رقم الهاتف والبطاقة).';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auth: OTP verify + load prescriptions ─────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', { nin, phone, otp });
      if (res.data?.profile?.name) {
        setPatientName(res.data.profile.name);
      }

      const hash = await hashNIN(nin);
      setNinHash(hash);

      // First-time setup: generate key pair for this patient
      if (!hasLocalKeyPair(hash)) {
        const keyPair = await generatePatientKeyPair();
        const pubKey  = await exportPublicKey(keyPair.publicKey);
        const encPK   = await protectPrivateKey(keyPair.privateKey, nin);
        saveEncryptedPrivateKey(hash, encPK);

        // Register public key on server (so doctors can encrypt for this patient)
        try {
          await api.post('/patients/public-key', { nin, public_key: pubKey });
        } catch {
          console.warn('Could not register public key – offline mode.');
        }
      }

      // Fetch prescriptions from backend
      await loadPrescriptions(hash);
      setAuthStep('AUTHENTICATED');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Load prescriptions ────────────────────────────────────
  const loadPrescriptions = useCallback(async (hash: string) => {
    try {
      const res = await api.get(`/prescriptions/patient/${hash}`);
      setRawPrescriptions(res.data?.prescriptions || []);
    } catch {
      // Fallback mock for demo
      setRawPrescriptions([
        {
          id: 'RX-2026-994',
          encrypted_blob: '',
          status: 'pending',
          created_at: new Date().toISOString(),
          doctor_id: 'doc_001',
        },
      ]);
    }
  }, []);

  // ── Decrypt a single prescription ────────────────────────
  const decryptRx = async (rx: RawPrescription) => {
    if (decryptedMap[rx.id]) { setSelectedRx(decryptedMap[rx.id]); setRxModalOpen(true); return; }
    if (!rx.encrypted_blob)  { setError('لا يوجد محتوى مشفر لهذه الوصفة.'); return; }

    setDecryptingId(rx.id);
    try {
      const encPK = loadEncryptedPrivateKey(ninHash);
      if (!encPK) throw new Error('المفتاح الخاص غير موجود على هذا الجهاز.');

      const privateKey = await restorePrivateKey(encPK, nin);
      const data = await decryptPrescription(rx.encrypted_blob, privateKey);

      const enhancedData = { ...data, prescriptionId: rx.id, status: rx.status };
      setDecryptedMap(prev => ({ ...prev, [rx.id]: enhancedData }));
      setSelectedRx(enhancedData);
      setRxModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'فشل فك التشفير.');
    } finally {
      setDecryptingId(null);
    }
  };

  // ── Login screen ──────────────────────────────────────────
  if (authStep !== 'AUTHENTICATED') {
    return (
      <AuthScreen
        authStep={authStep} setAuthStep={setAuthStep as any}
        nin={nin} setNin={setNin}
        phone={phone} setPhone={setPhone}
        otp={otp} setOtp={setOtp}
        isLoading={isLoading} error={error}
        handleNinSubmit={handleNinSubmit} handleOtpSubmit={handleOtpSubmit}
      />
    );
  }

  // ── Authenticated ─────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { display: none; }
        .pb-safe { padding-bottom: calc(5.5rem + env(safe-area-inset-bottom)); }
        .modern-nav { position:fixed; bottom:max(1rem,env(safe-area-inset-bottom)); left:1.5rem; right:1.5rem; height:4rem; background:rgba(255,255,255,0.92); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.8); border-radius:2rem; box-shadow:0 10px 40px rgba(59,130,246,0.15); display:flex; justify-content:space-around; align-items:center; z-index:50; padding:0 0.5rem; }
        .nav-item { position:relative; display:flex; align-items:center; justify-content:center; height:3rem; width:3rem; color:#94a3b8; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); border-radius:1.5rem; cursor:pointer; }
        .nav-item.active { background-color:#3b82f6; color:#fff; width:auto; padding:0 1.25rem; gap:0.5rem; box-shadow:0 4px 15px rgba(59,130,246,0.3); }
        .nav-item .nav-text { display:none; font-size:.875rem; font-weight:600; white-space:nowrap; }
        .nav-item.active .nav-text { display:block; animation:fadeIn .3s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateX(5px)} to{opacity:1;transform:translateX(0)} }
      `}} />

      <div className="w-full min-h-screen flex flex-col bg-slate-50" dir="rtl">
        <main className="flex-1 overflow-y-auto pb-safe px-5 pt-10 mx-auto w-full max-w-md md:max-w-xl scroll-smooth">
          {activeTab === 'home' && (
            <HomeTab
              patientName={patientName}
              setActiveTab={setActiveTab}
              setAuthStep={setAuthStep as any}
              setNin={setNin}
              setNinHash={setNinHash}
            />
          )}

          {activeTab === 'rx' && (
            <RXTab
              rawPrescriptions={rawPrescriptions}
              decryptingId={decryptingId}
              error={error}
              decryptRx={decryptRx}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              rawPrescriptions={rawPrescriptions}
              setActiveTab={setActiveTab}
              decryptRx={decryptRx}
            />
          )}
        </main>

        {/* ── Bottom nav ── */}
        <nav className="modern-nav mx-auto max-w-md md:max-w-xl">
          {[
            { tab: 'home', icon: 'fa-house', label: 'الرئيسية' },
            { tab: 'rx',   icon: 'fa-qrcode', label: 'الوصفات' },
            { tab: 'history', icon: 'fa-clock-rotate-left', label: 'السجل' },
          ].map(({ tab, icon, label }) => (
            <button key={tab} onClick={() => setActiveTab(tab as Tab)}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}>
              <i className={`fa-solid ${icon} text-xl`} />
              <span className="nav-text">{label}</span>
            </button>
          ))}
        </nav>

        {/* ── Prescription detail modal ── */}
        <PrescriptionModal
          rxModalOpen={rxModalOpen}
          setRxModalOpen={setRxModalOpen}
          selectedRx={selectedRx}
        />
      </div>
    </>
  );
}
