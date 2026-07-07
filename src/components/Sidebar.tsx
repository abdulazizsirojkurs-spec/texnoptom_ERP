'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Package, ShoppingCart, FileText, Wallet, TrendingUp, ArrowDownUp,
  Scale, Truck, Users, HandCoins, Award, CalendarClock, Building2, Settings,
  LayoutDashboard, X, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  const { role, user, signOut } = useAuth();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const isActive = (href: string) => pathname === href;

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => (
    <Link onClick={handleLinkClick} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
      <Icon size={17} strokeWidth={2} />
      {children}
    </Link>
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-mark">TO</div>
        <div style={{ flex: 1 }}>
          <div className="brand-text">Texno Optom</div>
          <div className="brand-sub">Back Office ERP</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6, borderRadius: 6 }}>
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink href="/" icon={Home}>Dashboard</NavLink>

        {(role === 'admin' || role === 'sotuvchi') && (
          <>
            <div className="nav-group-label">Sotuv</div>
            <NavLink href="/sales" icon={FileText}>Yangi Sotuv</NavLink>
            <NavLink href="/sales/orders" icon={Package}>Buyurtmalar</NavLink>
          </>
        )}

        {(role === 'admin' || role === 'skladchi') && (
          <>
            <div className="nav-group-label">Ombor</div>
            <NavLink href="/warehouse" icon={Package}>Ombor va Katalog</NavLink>
          </>
        )}

        {(role === 'admin' || role === 'buxgalter') && (
          <>
            <div className="nav-group-label">Moliya</div>
            <NavLink href="/finance" icon={LayoutDashboard}>Moliya paneli</NavLink>
            <NavLink href="/finance/kassa" icon={Wallet}>Kassa</NavLink>
            <NavLink href="/finance/kassa/balance" icon={Scale}>Kassa nazorati</NavLink>
            <NavLink href="/finance/reports/pnl" icon={TrendingUp}>P&amp;L (Foyda)</NavLink>
            <NavLink href="/finance/reports/cashflow" icon={ArrowDownUp}>Pul oqimi</NavLink>
            <NavLink href="/finance/reports/balance" icon={Scale}>Balans</NavLink>
            <NavLink href="/finance/debts" icon={Truck}>Qarzdorliklar</NavLink>
            <NavLink href="/finance/payroll" icon={HandCoins}>Ish haqi</NavLink>
            <NavLink href="/finance/payroll/accruals" icon={Award}>Hisoblanmalar</NavLink>
            <NavLink href="/finance/obligations" icon={CalendarClock}>Majburiyatlar</NavLink>
            <NavLink href="/finance/fixed-assets" icon={Building2}>Asosiy vositalar</NavLink>
            <NavLink href="/finance/settings" icon={Settings}>Sozlamalar</NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'var(--gray-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 650, color: 'var(--gray-700)', flexShrink: 0,
          }}>
            {(user?.email || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || '—'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {role || '—'}
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost" style={{ padding: 6, borderRadius: 6 }} title="Chiqish">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
