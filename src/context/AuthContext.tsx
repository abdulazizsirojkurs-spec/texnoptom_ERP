'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: any;
  role: 'admin' | 'skladchi' | 'sotuvchi' | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'skladchi' | 'sotuvchi' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Session fetch error:", error.message);
      
      const currentUser = session?.user || null;
      
      if (mounted) {
        setUser(currentUser);
        if (currentUser) {
          await fetchRole(currentUser);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      if (mounted) {
        setUser(currentUser);
        if (currentUser) {
          await fetchRole(currentUser);
        } else {
          setRole(null);
          setLoading(false);
          router.push('/login');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function fetchRole(currentUser: any) {
    const email = currentUser?.email || '';
    const metaRole = currentUser?.user_metadata?.role;

    if (metaRole) {
      setRole(metaRole);
    } else if (email === 'admin@texno.uz' || email.includes('admin') || email === 'xontorayevabdulaziz@gmail.com') {
      setRole('admin');
    } else if (email.includes('sklad') || email.includes('ombor')) {
      // Pochtada "sklad" yoki "ombor" bo'lsa Skladchi bo'ladi
      setRole('skladchi');
    } else if (email.includes('sotuvchi') || email === 'begoyim@texno.uz' || email === 'farzona@texno.uz') {
      setRole('sotuvchi');
    } else {
      // Boshqa har qanday yangi profil avtomat 'sotuvchi' bo'ladi
      setRole('sotuvchi'); 
    }
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
