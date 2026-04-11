import React from 'react';
import { Bell, Menu, UserCircle, Stethoscope } from 'lucide-react';

export function Navbar() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-6 z-20 w-full sticky top-0">
      <div className="flex items-center">
        <button className="md:hidden mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <Stethoscope className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
            Seha
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button className="text-gray-500 hover:text-blue-600 transition-colors relative p-2 hover:bg-blue-50 rounded-full">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        <button className="flex items-center space-x-2 text-gray-700 hover:bg-gray-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-gray-100 transition-all">
          <UserCircle size={28} className="text-gray-400" />
          <span className="text-sm font-semibold hidden sm:block">Dr. Admin</span>
        </button>
      </div>
    </header>
  );
}
