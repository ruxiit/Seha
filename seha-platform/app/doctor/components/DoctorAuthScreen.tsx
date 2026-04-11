"use client";

import React, { useState } from 'react';

interface DoctorAuthScreenProps {
  onLogin: (nin: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function DoctorAuthScreen({ onLogin, isLoading, error }: DoctorAuthScreenProps) {
  const [nin, setNin]           = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nin.trim() || !password) return;
    await onLogin(nin.trim(), password);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .doctor-auth-bg {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .doctor-auth-bg::before {
          content: '';
          position: absolute;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%);
          top: -200px; right: -200px;
          pointer-events: none;
        }
        .doctor-auth-bg::after {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%);
          bottom: -150px; left: -150px;
          pointer-events: none;
        }
        .auth-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1.5rem;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          box-shadow: 0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 0.875rem;
          padding: 0.875rem 1rem;
          color: #f1f5f9;
          font-size: 0.9375rem;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(148,163,184,0.6); }
        .auth-input:focus {
          border-color: #14b8a6;
          background: rgba(20,184,166,0.08);
          box-shadow: 0 0 0 3px rgba(20,184,166,0.15);
        }
        .auth-btn {
          width: 100%;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          color: white;
          font-weight: 700;
          font-size: 1rem;
          padding: 0.9375rem;
          border-radius: 0.875rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(20,184,166,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(20,184,166,0.45);
        }
        .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .error-box {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          color: #fca5a5;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .eye-btn {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(148,163,184,0.7);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          transition: color 0.15s;
        }
        .eye-btn:hover { color: #94a3b8; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display: inline-block; }
      `}} />

      <div className="doctor-auth-bg" dir="rtl">
        <div className="auth-card">

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 64, height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 24px rgba(20,184,166,0.4)',
            }}>
              <i className="fa-solid fa-staff-snake" style={{ fontSize: 28, color: 'white' }} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>صحة</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              بوابة الطبيب — الدخول الآمن
            </p>
          </div>

          {/* Badge */}
          <div style={{
            background: 'rgba(20,184,166,0.12)',
            border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '1.5rem',
          }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#14b8a6', fontSize: '1rem' }} />
            <p style={{ color: '#5eead4', fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>
              اتصال مشفر بالكامل — بيانات الدخول لا تُخزَّن على الجهاز
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box" style={{ marginBottom: '1.25rem' }}>
              <i className="fa-solid fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                الرقم الوطني (NIN)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="doctor-nin"
                  className="auth-input"
                  type="text"
                  dir="ltr"
                  placeholder="أدخل رقم هويتك الوطنية"
                  value={nin}
                  onChange={e => setNin(e.target.value)}
                  required
                  autoComplete="username"
                  style={{ paddingRight: '2.75rem' }}
                />
                <i className="fa-solid fa-id-card"
                   style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', fontSize: '0.9rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                كلمة المرور
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="doctor-password"
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingLeft: '3rem', paddingRight: '2.75rem' }}
                />
                <i className="fa-solid fa-lock"
                   style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', fontSize: '0.9rem' }} />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(v => !v)}
                  title={showPass ? 'إخفاء' : 'إظهار'}
                >
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '0.9rem' }} />
                </button>
              </div>
            </div>

            <button
              id="doctor-login-btn"
              type="submit"
              className="auth-btn"
              disabled={isLoading || !nin.trim() || !password}
              style={{ marginTop: '0.5rem' }}
            >
              {isLoading
                ? <><i className="fa-solid fa-circle-notch spin" /> جاري التحقق...</>
                : <><i className="fa-solid fa-right-to-bracket" /> تسجيل الدخول</>
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'rgba(148,163,184,0.5)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
            بوابة مخصصة للأطباء المرخصين فقط
          </p>
        </div>
      </div>
    </>
  );
}
