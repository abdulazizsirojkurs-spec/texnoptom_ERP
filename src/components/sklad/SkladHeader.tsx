'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, History } from 'lucide-react';

// /sklad bo'limining barcha sahifalari uchun bir xil, sodda sarlavha —
// admin sidebar/mobile-header o'rnini bosadi (ClientLayout /sklad'da
// ularni umuman render qilmaydi). `actionHref`/`actionLabel` berilsa,
// o'ng tomonda qo'shimcha tugma (masalan "Tarix") chiqadi.
export default function SkladHeader({
  title, backHref, actionHref, actionLabel,
}: { title: string; backHref?: string; actionHref?: string; actionLabel?: string }) {
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
      {actionHref && (
        <button
          onClick={() => router.push(actionHref)}
          className="btn-ghost"
          style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-600)', fontWeight: 600, fontSize: '0.9rem' }}
        >
          <History size={17} /> {actionLabel || 'Tarix'}
        </button>
      )}
    </div>
  );
}
