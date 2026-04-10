"use client";

import React, { useState, useEffect } from 'react';
import { Users, User, Stethoscope, Store, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

type SystemUser = {
  id: string;
  role: 'admin' | 'doctor' | 'pharmacist' | 'patient';
  created_at: string;
  profile: Record<string, any>;
};

export default function UsersList() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      console.error(err);
      setError('فشل في جلب قائمة المستخدمين. ' + (err.response?.data?.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'patient':
        return <span className="px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-full border border-slate-700 flex items-center gap-1.5"><User size={12} /> مريض</span>;
      case 'doctor':
        return <span className="px-3 py-1 bg-blue-500/10 text-blue-400 font-bold text-xs rounded-full border border-blue-500/20 flex items-center gap-1.5"><Stethoscope size={12} /> طبيب</span>;
      case 'pharmacist':
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-full border border-emerald-500/20 flex items-center gap-1.5"><Store size={12} /> صيدلي</span>;
      case 'admin':
        return <span className="px-3 py-1 bg-purple-500/10 text-purple-400 font-bold text-xs rounded-full border border-purple-500/20 flex items-center gap-1.5"><ShieldCheck size={12} /> أدمن</span>;
      default:
        return <span className="px-3 py-1 bg-slate-800 text-slate-400 font-bold text-xs rounded-full border border-slate-700">{role}</span>;
    }
  };

  const filteredUsers = filterRole === 'all' ? users : users.filter(u => u.role === filterRole);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl mx-auto fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">إدارة المستخدمين</h2>
            <p className="text-sm text-slate-400">سجل بجميع المستخدمين المسجلين في المنصة</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'patient', 'doctor', 'pharmacist', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                filterRole === role
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {role === 'all' ? 'الكل' : role === 'patient' ? 'المرضى' : role === 'doctor' ? 'الأطباء' : role === 'pharmacist' ? 'الصيادلة' : 'المدراء'}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 flex items-center gap-3 mb-6">
          <AlertTriangle size={18} />
          <span className="font-semibold text-sm">{error}</span>
          <button onClick={fetchUsers} className="mr-auto px-4 py-1.5 bg-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/30 transition">
            إعادة المحاولة
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
          <p className="text-sm font-semibold">جاري جلب البيانات...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/50">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold">لا يوجد مستخدمين</p>
          <p className="text-sm mt-1">لم يتم العثور على مستخدمين يطابقون هذا الفلتر.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold bg-slate-900/50">
                <th className="px-4 py-4 rounded-tr-lg">الاسم / الجهة</th>
                <th className="px-4 py-4">الدور</th>
                <th className="px-4 py-4">تاريخ التسجيل</th>
                <th className="px-4 py-4 rounded-tl-lg">معلومات إضافية</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {user.profile?.name?.[0] || user.id.slice(0, 2)}
                        </span>
                      </div>
                      <span className="truncate max-w-[200px]">
                        {user.profile?.name || user.profile?.pharmacyName || <span className="text-slate-500 italic">بدون اسم</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-4 py-4 text-slate-400 whitespace-nowrap font-mono text-xs">
                    {new Date(user.created_at).toLocaleDateString('ar-DZ')}
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {user.role === 'doctor' && user.profile.specialization && <span>تط: {user.profile.specialization}</span>}
                    {user.role === 'pharmacist' && user.profile.licenseNumber && <span>رقم الترخيص: {user.profile.licenseNumber}</span>}
                    {user.role === 'patient' && user.profile.age && <span>العمر: {user.profile.age}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
