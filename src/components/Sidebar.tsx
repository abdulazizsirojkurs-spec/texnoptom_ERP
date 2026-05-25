'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, DollarSign } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin'] },
    { name: 'Sotuv', href: '/sales', icon: ShoppingCart, roles: ['admin', 'sotuvchi', 'kassir'] },
    { name: 'Ombor', href: '/warehouse', icon: Package, roles: ['admin', 'skladchi'] },
    { name: 'Moliya', href: '/finance', icon: DollarSign, roles: ['admin'] },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        Texno Optom
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
