'use client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// /kassir bo'limining barcha sahifalari uchun umumiy ramka: sodda sarlavha
// (admin sidebar'i yo'q) + faqat kassir/admin rolga ruxsat.
export default function KassirShell({
  title, backHref, right, children,
}: { title: string; backHref?: string; right?: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const { role } = useAuth();
  const allowed = role === 'kassir' || role === 'admin';

  return (
    <div className="ks-page">
      <div className="ks-header">
        {backHref !== undefined && (
          <button className="ks-iconbtn" onClick={() => router.push(backHref)} aria-label="Orqaga">
            <ChevronLeft size={24} />
          </button>
        )}
        <span className="ks-title">{title}</span>
        <div className="ks-header-right">{right}</div>
      </div>
      <div className="ks-body">
        {allowed ? children : <div className="ks-denied">Bu bo&apos;limga ruxsat yo&apos;q.</div>}
      </div>
    </div>
  );
}
