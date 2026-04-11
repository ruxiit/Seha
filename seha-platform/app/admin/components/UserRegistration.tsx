"use client";

import React, { useState } from 'react';
import { UserPlus, User, Stethoscope, Store, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

type Role = 'patient' | 'doctor' | 'pharmacist';

export default function UserRegistration() {
  const [role, setRole] = useState<Role>('patient');
  const [nin, setNin] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Profile Data
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [schedule, setSchedule] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nin || !password || !phone || !name) {
      setMessage({ type: 'error', text: 'يرجى إدخال المعلومات الأساسية (الاسم، رقم الهاتف، رقم التعريف، كلمة المرور)' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    let profileData = { name };
    if (role === 'patient') profileData = { ...profileData, age, bloodType } as any;
    if (role === 'doctor') profileData = { ...profileData, specialization, schedule } as any;
    if (role === 'pharmacist') profileData = { ...profileData, pharmacyName, licenseNumber } as any;

    try {
      await api.post('/auth/register', { nin, phone, password, role, profileData });
      setMessage({ type: 'success', text: `تم تسجيل ${role === 'patient' ? 'المريض' : role === 'doctor' ? 'الطبيب' : 'الصيدلي'} بنجاح!` });
      setNin('');
      setPhone('');
      setPassword('');
      setName('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'فشل في تسجيل المستخدم. يرجى المحاولة مرة أخرى.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { id: Role, label: string, icon: React.ElementType }[] = [
    { id: 'patient', label: 'مريض', icon: User },
    { id: 'doctor', label: 'طبيب', icon: Stethoscope },
    { id: 'pharmacist', label: 'صيدلي', icon: Store },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto fade-in">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500">
          <UserPlus size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">تسجيل مستخدم جديد</h2>
          <p className="text-sm text-slate-400">إضافة مرضى، أطباء أو صيادلة إلى المنصة</p>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">نوع المستخدم</label>
          <div className="grid grid-cols-3 gap-3">
            {roles.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setRole(id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  role === id 
                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <Icon size={24} className={role === id ? 'text-blue-500' : 'text-slate-500'} />
                <span className="font-semibold text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم الكامل</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="الاسم الكامل"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                placeholder="05..."
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">رقم التعريف الوطني (NIN)</label>
              <input
                type="text"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                placeholder="XXXXXXXXX"
                dir="ltr"
              />
            </div>
          </div>

          {/* Dynamic Role Fields */}
          {role === 'patient' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">العمر</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="العمر" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">فصيلة الدم</label>
                <input type="text" value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="مثال: O+" />
              </div>
            </div>
          )}

          {role === 'doctor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">التخصص</label>
                <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="التخصص الطبي" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">أوقات العمل</label>
                <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="أيام وساعات العمل" />
              </div>
            </div>
          )}

          {role === 'pharmacist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">اسم الصيدلية</label>
                <input type="text" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="اسم الصيدلية" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">رقم الترخيص</label>
                <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" placeholder="رقم الترخيص" dir="ltr" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">كلمة المرور المؤقتة</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              placeholder="••••••••"
              dir="ltr"
            />
            <p className="text-xs text-slate-500 mt-2">
              يرجى مشاركة كلمة المرور مع المستخدم ليتمكن من الدخول وتغييرها لاحقاً.
            </p>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`p-4 rounded-lg flex items-start gap-3 border ${
            message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              جاري التسجيل...
            </>
          ) : (
            'تسجيل المستخدم'
          )}
        </button>
      </form>
    </div>
  );
}
