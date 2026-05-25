'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isLoginPage = pathname === '/login';

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>Yuklanmoqda...</div>;
  }

  // Sahifa himoyasi (Route Guard)
  if (!user && !isLoginPage) {
    // AuthContext o'zi redirect qiladi, bu yerda shunchaki bo'sh ekran ko'rsatib turamiz
    return null; 
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
