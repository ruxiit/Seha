import React from 'react';
import Link from 'next/link';
import { Home, Users, FileText, Settings, Activity } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col h-full shadow-sm z-10">
      <div className="p-4 flex flex-col space-y-1.5 mt-4">
        <Link href="/" className="flex items-center space-x-3 text-gray-600 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
          <Home size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link href="/patients" className="flex items-center space-x-3 text-gray-600 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
          <Users size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Patients</span>
        </Link>
        <Link href="/prescriptions" className="flex items-center space-x-3 text-gray-600 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
          <FileText size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Prescriptions</span>
        </Link>
        <Link href="/analytics" className="flex items-center space-x-3 text-gray-600 p-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group">
          <Activity size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Analytics</span>
        </Link>
      </div>
      <div className="mt-auto p-4 mb-4">
        <div className="h-px bg-gray-100 mb-4 w-full"></div>
        <Link href="/settings" className="flex items-center space-x-3 text-gray-600 p-3 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group">
          <Settings size={20} className="group-hover:rotate-45 transition-transform" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
