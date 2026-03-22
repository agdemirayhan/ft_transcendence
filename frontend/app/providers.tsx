'use client';

import { useEffect } from 'react';
import i18n from './i18n';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) i18n.changeLanguage(savedLang);
  }, []);

  return <>{children}</>;
}