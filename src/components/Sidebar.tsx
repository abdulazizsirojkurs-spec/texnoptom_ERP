'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, DollarSign, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  
  const [salesOpen, setSalesOpen] = useState(pathname.includes('/sales'));

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

        {/* Moliya */}
        {role === 'admin' && (
          <Link href="/finance" className={`nav-item ${pathname === '/finance' ? 'active' : ''}`}>
            <DollarSign size={20} /> Moliya
          </Link>
        )}
      </nav>
    </aside>
  );
}
