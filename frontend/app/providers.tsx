'use client';

import { useEffect } from 'react';
import i18n from './i18n';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function loadLanguage() {
      const token = Cookies.get('token');
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.language) {
            i18n.changeLanguage(data.language);
            localStorage.setItem('language', data.language);
          }
        } catch {
          // localStorage'dan al
          const saved = localStorage.getItem('language');
          if (saved) i18n.changeLanguage(saved);
        }
      } else {
        const saved = localStorage.getItem('language');
        if (saved) i18n.changeLanguage(saved);
      }
    }
    loadLanguage();
  }, []);

  return <>{children}</>;
}