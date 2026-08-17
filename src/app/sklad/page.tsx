'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PackagePlus, DollarSign, ClipboardList, Boxes, LogOut } from 'lucide-react';

const TILES = [
  { href: '/sklad/kirim', label: 'Tovar kirim qilish', icon: PackagePlus },
  { href: '/sklad/tolov', label: "Hamkorga to'lov qilish", icon: DollarSign },
  { href: '/sklad/buyurtmalar', label: 'Buyurtmalar', icon: ClipboardList },
  { href: '/sklad/qoldiq', label: "Ombor qoldig'i", icon: Boxes },
];

export default function SkladDashboard() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <div className="sklad-page">
      <div className="sklad-header">
        <span style={{ fontWeight: 650, fontSize: '1.05rem', color: 'var(--gray-900)' }}>Sklad</span>
        <button
          onClick={signOut}
          className="btn-ghost"
          style={{ marginLeft: 'auto', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}
        >
          <LogOut size={18} /> Chiqish
        </button>
      </div>

      <div className="sklad-body">
        <div className="sklad-tile-grid">
          {TILES.map(({ href, label, icon: Icon }) => (
            <button key={href} className="sklad-tile" onClick={() => router.push(href)}>
              <span className="sklad-tile-icon"><Icon size={22} /></span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
