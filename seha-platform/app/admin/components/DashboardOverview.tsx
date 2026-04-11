"use client";

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, ShieldAlert, Store, FileText, Lock, Eye, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

const VOLUME_DATA = [
  { time: '00:00', v: 120 }, { time: '02:00', v: 80 },
  { time: '04:00', v: 45  }, { time: '06:00', v: 150 },
  { time: '08:00', v: 850 }, { time: '10:00', v: 1250 },
  { time: '12:00', v: 1400 }, { time: '14:00', v: 1300 },
  { time: '16:00', v: 1100 }, { time: '18:00', v: 800 },
  { time: '20:00', v: 500 }, { time: '22:00', v: 200 },
];

const DRUG_DATA = [
  { name: 'أموكسيسيلين', count: 4200 },
  { name: 'باراسيتامول',   count: 3900 },
  { name: 'إيبوبروفين',    count: 2800 },
  { name: 'أوميبرازول',    count: 2100 },
  { name: 'ديازيبام',      count: 850  },
  { name: 'ليسينوبريل',    count: 1800 },
];

interface Stats {
  totalPrescriptions: number;
  dispensedPrescriptions: number;
  fraudAttempts: number;
  registeredPatients: number;
}

interface SecurityLog {
  id: string;
  type: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, logsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/security-logs?limit=10'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (logsRes.status  === 'fulfilled') setLogs(logsRes.value.data.logs || []);
    } catch {
      // Use mock data if backend unavailable
      setStats({ totalPrescriptions: 14240, dispensedPrescriptions: 12800, fraudAttempts: 84, registeredPatients: 9320 });
      setLogs([
        { id: 'SEC-901', type: 'محاولة تكرار صرف',      location: 'صيدلية (ID:901)',     severity: 'high',   created_at: new Date().toISOString() },
        { id: 'SEC-902', type: 'تشفير غير صالح',         location: 'صيدلية (ID:142)',     severity: 'medium', created_at: new Date().toISOString() },
        { id: 'SEC-903', type: 'تجاوز حد الطلبات',       location: 'IP: 192.168.*',       severity: 'low',    created_at: new Date().toISOString() },
        { id: 'SEC-904', type: 'محاولة تكرار صرف',      location: 'صيدلية (ID:885)',     severity: 'high',   created_at: new Date().toISOString() },
        { id: 'SEC-905', type: 'ارتفاع مريب بالنشاط',    location: 'مستشفى الشفاء',       severity: 'medium', created_at: new Date().toISOString() },
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const kpis = stats ? [
    { label: 'إجمالي الوصفات المصدرة',       value: stats.totalPrescriptions.toLocaleString(),    icon: FileText,    color: 'blue',    sub: 'مقاييس مباشرة (24 ساعة)' },
    { label: 'المرضى المسجلون',               value: stats.registeredPatients.toLocaleString(),    icon: Store,       color: 'emerald', sub: 'متصل بالشبكة الوطنية' },
    { label: 'عمليات الاحتيال المحظورة',     value: stats.fraudAttempts.toString(),               icon: ShieldAlert, color: 'red',     sub: 'منع تكرار الصرف' },
    { label: 'نسبة أدوية الرقابة',            value: '6.2%',                                       icon: Eye,         color: 'amber',   sub: 'تتبع المؤثرات العقلية نشط' },
  ] : [];

  const severityStyle = (s: string) =>
    s === 'high'   ? 'bg-red-500/10 text-red-500 border-red-500/20' :
    s === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                     'bg-slate-500/10 text-slate-400 border-slate-500/20';

  const severityLabel = (s: string) =>
    s === 'high' ? 'محظور' : s === 'medium' ? 'تحذير' : 'مقيد';

  return (
    <div className="space-y-8 fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors ${color==='red'?'border-red-900/50':''}`}>
            <div className="absolute top-0 left-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Icon size={80} className={`-mt-4 -ml-4 transform -rotate-12 ${color==='red'?'text-red-500':color==='emerald'?'text-emerald-400':color==='amber'?'text-amber-400':'text-blue-400'}`} />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className={`font-medium text-sm mb-1 tracking-wider ${color==='red'?'text-red-400/80':'text-slate-400'}`}>{label}</p>
                <h3 className={`text-4xl font-bold tracking-tight ${color==='red'?'text-red-500 font-black':color==='amber'?'text-amber-400':'text-white'}`} dir="ltr">{value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl ${color==='red'?'bg-red-500/10 text-red-500 animate-pulse':color==='emerald'?'bg-emerald-500/10 text-emerald-400':color==='amber'?'bg-amber-500/10 text-amber-400':'bg-blue-500/10 text-blue-400'}`}>
                <Icon size={20} />
              </div>
            </div>
            <p className={`text-sm font-medium relative z-10 ${color==='red'?'text-red-400/60':color==='emerald'?'text-emerald-400/70':color==='amber'?'text-amber-500/50':'flex items-center text-emerald-400 gap-1'}`}>
              {color==='blue' ? <><Activity size={14} className="mt-0.5" />{sub}</> : sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-400" /> حجم العمليات في الشبكة
            </h3>
            <span className="text-xs font-bold px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">مباشر</span>
          </div>
          <div className="h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={VOLUME_DATA} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', color: '#f1f5f9' }} itemStyle={{ color: '#3b82f6' }} />
                <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#020617', strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" /> توزيع المكونات الدوائية
            </h3>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">أعلى 6 مواد (DCI)</span>
          </div>
          <div className="h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DRUG_DATA} layout="vertical" margin={{ top: 5, right: -20, bottom: 5, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal vertical={false} />
                <XAxis type="number" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '0.75rem', color: '#f1f5f9' }} itemStyle={{ color: '#818cf8' }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Security logs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Lock size={18} className="text-slate-400" /> سجل أحداث الأمان
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-bold tracking-wider">مراقبة نشطة</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-[#0b1121] text-slate-500 font-bold text-[11px] tracking-widest">
              <tr>
                {['معرف التتبع','الوقت','نمط التنبيه','المصدر','حالة الاستجابة'].map(h => (
                  <th key={h} className="px-6 py-4 border-b border-slate-800/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-400 text-xs" dir="ltr">{log.id}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Date(log.created_at).toLocaleTimeString('ar-DZ')}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">{log.type}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.location}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-black tracking-wider border ${severityStyle(log.severity)}`}>
                      {severityLabel(log.severity)}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-600">لا توجد سجلات أمان حتى الآن.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <button onClick={fetchDashboard} disabled={isRefreshing}
            className="text-sm text-blue-500 hover:text-blue-400 font-bold flex items-center justify-center gap-1.5 mx-auto py-2 px-6 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50">
            {isRefreshing ? 'جاري التحديث...' : 'تحديث البيانات'} <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
