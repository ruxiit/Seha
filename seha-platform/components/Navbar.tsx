'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  
  // إخفاء navbar على جميع الصفحات
  return null;
}
