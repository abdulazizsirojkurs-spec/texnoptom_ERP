'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, DollarSign, ChevronDown, ChevronRight, FileText, Wallet, TrendingUp, ArrowDownUp, Scale, Truck, Users, HandCoins, Award, CalendarClock, Building2, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  
  const [salesOpen, setSalesOpen] = useState(pathname.includes('/sales'));
  const [financeOpen, setFinanceOpen] = useState(pathname.includes('/finance'));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        Texno Optom
      </div>
      <nav className="sidebar-nav">
        
        {/* Dashboard */}
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <Home size={20} /> Dashboard
        </Link>

        {/* Sotuv (Group) */}
        {(role === 'admin' || role === 'sotuvchi') && (
        <div className="nav-group">
          <div 
            className="nav-item" 
            style={{ cursor: 'pointer', justifyContent: 'space-between' }}
            onClick={() => setSalesOpen(!salesOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShoppingCart size={20} /> Sotuv
            </div>
            {salesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {salesOpen && (
            <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <Link href="/sales" className={`nav-item ${pathname === '/sales' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <FileText size={16} /> Yangi Sotuv
              </Link>
              <Link href="/sales/orders" className={`nav-item ${pathname === '/sales/orders' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Package size={16} /> Buyurtmalar
              </Link>
            </div>
          )}
        </div>
        )}

        {/* Ombor */}
        {(role === 'admin' || role === 'skladchi') && (
        <Link href="/warehouse" className={`nav-item ${pathname === '/warehouse' ? 'active' : ''}`}>
          <Package size={20} /> Ombor
        </Link>
        )}

        {/* Moliya (Group) */}
        {(role === 'admin' || role === 'buxgalter') && (
        <div className="nav-group">
          <div 
            className="nav-item" 
            style={{ cursor: 'pointer', justifyContent: 'space-between' }}
            onClick={() => setFinanceOpen(!financeOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DollarSign size={20} /> Moliya
            </div>
            {financeOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {financeOpen && (
            <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <Link href="/finance" className={`nav-item ${pathname === '/finance' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link href="/finance/kassa" className={`nav-item ${pathname === '/finance/kassa' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Wallet size={16} /> Kassa
              </Link>
              <Link href="/finance/kassa/balance" className={`nav-item ${pathname === '/finance/kassa/balance' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Scale size={16} /> Kassa Nazorat
              </Link>
              <Link href="/finance/reports/pnl" className={`nav-item ${pathname === '/finance/reports/pnl' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <TrendingUp size={16} /> P&L
              </Link>
              <Link href="/finance/reports/cashflow" className={`nav-item ${pathname === '/finance/reports/cashflow' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <ArrowDownUp size={16} /> Cash Flow
              </Link>
              <Link href="/finance/reports/balance" className={`nav-item ${pathname === '/finance/reports/balance' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Scale size={16} /> Balance
              </Link>
              <Link href="/finance/debts/suppliers" className={`nav-item ${pathname === '/finance/debts/suppliers' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Truck size={16} /> Postavshiklar
              </Link>
              <Link href="/finance/debts/customers" className={`nav-item ${pathname === '/finance/debts/customers' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Users size={16} /> Mijozlar qarzi
              </Link>
              <Link href="/finance/payroll" className={`nav-item ${pathname === '/finance/payroll' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <HandCoins size={16} /> Ish Haqi
              </Link>
              <Link href="/finance/payroll/accruals" className={`nav-item ${pathname === '/finance/payroll/accruals' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Award size={16} /> Hisoblanmalar
              </Link>
              <Link href="/finance/obligations" className={`nav-item ${pathname === '/finance/obligations' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <CalendarClock size={16} /> Majburiyatlar
              </Link>
              <Link href="/finance/fixed-assets" className={`nav-item ${pathname === '/finance/fixed-assets' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Building2 size={16} /> Asosiy vositalar
              </Link>
              <Link href="/finance/settings" className={`nav-item ${pathname === '/finance/settings' ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                <Settings size={16} /> Sozlamalar
              </Link>
            </div>
          )}
        </div>
        )}
      </nav>
    </aside>
  );
}
