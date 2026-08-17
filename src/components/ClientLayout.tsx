'use client';
import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

import { Menu } from 'lucide-react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/login';
  const isSkladRoute = pathname.startsWith('/sklad');

  // Skladchi faqat /sklad bo'limini ko'radi — boshqa har qanday admin
  // sahifasiga (qo'lda URL yozib bo'lsa ham) kirishga urinsa qaytariladi.
  useEffect(() => {
    if (!loading && user && role === 'skladchi' && !isSkladRoute && !isLoginPage) {
      router.push('/sklad');
    }
  }, [loading, user, role, isSkladRoute, isLoginPage, router]);

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

  // Skladchi noto'g'ri sahifada bo'lsa, yuqoridagi effect uni /sklad'ga
  // qaytarayotgan bo'ladi — shu oraliqda admin chrome'ini bir lahza ham
  // ko'rsatmaslik uchun hech narsa render qilmaymiz.
  if (role === 'skladchi' && !isSkladRoute) {
    return null;
  }

  // /sklad bo'limi — o'zining alohida, minimal mobil interfeysi bor,
  // admin sidebar/mobile-header umuman ko'rsatilmaydi.
  if (isSkladRoute) {
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
