'use client';
import { useEffect } from 'react';

// PWA service worker'ni ro'yxatdan o'tkazadi (iPhone/Android "asosiy ekranga qo'shish").
// Faqat production'da va HTTPS'da ishlaydi.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* jimgina — SW muvaffaqiyatsiz bo'lsa ham ilova oddiy web sifatida ishlaydi */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
