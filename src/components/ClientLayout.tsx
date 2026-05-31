'use client';
import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

import { Menu } from 'lucide-react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isLoginPage = pathname === '/login';

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>Yuklanmoqda...</div>;
  }

  // Sahifa himoyasi (Route Guard)
  if (!user && !isLoginPage) {
    return null; 
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>Texno Optom</div>
        <button onClick={() => setIsSidebarOpen(true)} style={{ color: 'var(--text-primary)' }}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
