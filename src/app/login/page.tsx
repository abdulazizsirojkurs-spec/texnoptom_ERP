'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/warehouse');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email va parolni kiriting!");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? "Login yoki parol noto'g'ri!" : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Tekshirilmoqda...</div>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>Texno Optom ERP</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>Xavfsiz tizimga xush kelibsiz</p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>Email (Login)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@texno.uz"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>Parol</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '8px', marginTop: '8px' }}
          >
            {loading ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
