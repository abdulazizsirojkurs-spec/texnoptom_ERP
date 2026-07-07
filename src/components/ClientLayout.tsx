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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid var(--gray-200)', borderTopColor: 'var(--accent-600)',
          animation: 'spin .7s linear infinite',
        }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Yuklanmoqda...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="brand-mark" style={{ width: 26, height: 26, fontSize: 12 }}>TO</div>
          <span style={{ fontWeight: 650, fontSize: '1rem', color: 'var(--gray-900)' }}>Texno Optom</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="btn-ghost" style={{ padding: 6, borderRadius: 6 }}>
          <Menu size={22} />
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
