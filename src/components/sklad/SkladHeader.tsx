'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

// /sklad bo'limining barcha sahifalari uchun bir xil, sodda sarlavha —
// admin sidebar/mobile-header o'rnini bosadi (ClientLayout /sklad'da
// ularni umuman render qilmaydi).
export default function SkladHeader({ title, backHref }: { title: string; backHref?: string }) {
  const router = useRouter();

  return (
    <div className="sklad-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {backHref !== undefined ? (
          <button
            onClick={() => router.push(backHref || '/sklad')}
            className="btn-ghost"
            style={{ padding: 6, borderRadius: 6, display: 'flex' }}
            aria-label="Orqaga"
          >
            <ChevronLeft size={22} />
          </button>
        ) : null}
        <span style={{ fontWeight: 650, fontSize: '1.05rem', color: 'var(--gray-900)' }}>{title}</span>
      </div>
    </div>
  );
}
