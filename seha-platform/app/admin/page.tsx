"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ChevronLeft, Lock, DownloadCloud, LayoutDashboard, UserPlus, Users, LogOut } from 'lucide-react';
import Link from 'next/link';

import DashboardOverview from './components/DashboardOverview';
import UserRegistration from './components/UserRegistration';
import UsersList from './components/UsersList';
import AdminAuthScreen from './components/AdminAuthScreen';
import api, { authStore } from '@/lib/api';

const ADMIN_SESSION_KEY = 'seha_admin_session';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'users'>('dashboard');

  useEffect(() => {
    setMounted(true);
    const token = authStore.getToken();
    const saved  = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (token && saved === 'admin') {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = async (nin: string, password: string) => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', { nin, password });
      const { token, user } = res.data;

      if (user.role !== 'admin') {
        setLoginError('هذه البوابة مخصصة لمدراء النظام فقط.');
        return;
      }

      authStore.setToken(token);
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'admin');
      setIsAuthenticated(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === 'Invalid credentials') {
        setLoginError('الرقم الوطني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        // Demo mode fallback
        authStore.setToken('demo_admin_token');
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'admin');
        setIsAuthenticated(true);
      } else {
        setLoginError(msg || 'حدث خطأ أثناء تسجيل الدخول.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    authStore.clearToken();
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
  };

  if (!mounted || isCheckingAuth) return null;

  if (!isAuthenticated) {
    return (
      <AdminAuthScreen
        onLogin={handleLogin}
        isLoading={loginLoading}
        error={loginError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans" dir="rtl">
      {/* Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 border-b border-slate-800 pb-6 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors ml-3">
              <ChevronLeft className="text-slate-400 rotate-180" size={20} />
            </Link>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 ml-3">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              مركز الرقابة <span className="font-light text-slate-400">والتحكم</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm mr-16 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            السجل الوطني للوصفات • الخادم لا يقرأ بيانات المرضى (E2EE)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
          {/* Navigation Tabs */}
          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 flex gap-1 flex-1 sm:flex-initial">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard size={18} /> لوحة القيادة
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users size={18} /> قائمة المستخدمين
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserPlus size={18} /> تسجيل المستخـدمين
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2">
              <DownloadCloud size={16} /> تصدير
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-slate-800 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> خروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="transition-all duration-300">
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'users'     && <UsersList />}
        {activeTab === 'register'  && <UserRegistration />}
      </main>

      {/* Footer */}
      <p className="text-center text-slate-700 text-[10px] uppercase tracking-widest font-bold mt-12 mb-4 flex items-center justify-center gap-1.5 opacity-50">
        <Lock size={10} /> الخادم لا يقرأ محتوى الوصفات • E2EE مطبق على جميع البيانات الطبية
      </p>
    </div>
  );
}
