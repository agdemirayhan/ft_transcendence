'use client';

import { useEffect } from 'react';
import i18n from './i18n';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function authHeaders(): Record<string, string> {
  const token = Cookies.get('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;

    const sendHeartbeat = () => {
      if (!Cookies.get('token')) return;
      fetch(`${API_URL}/auth/heartbeat`, { method: 'POST', headers: authHeaders() }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}