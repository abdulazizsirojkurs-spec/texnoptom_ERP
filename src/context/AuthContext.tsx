'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: any;
  role: 'admin' | 'skladchi' | 'sotuvchi' | 'buxgalter' | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'skladchi' | 'sotuvchi' | 'buxgalter' | null>(null);
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
    // Rol endi bazadagi `profiles` jadvalidan olinadi (server tomonidan RLS bilan
    // himoyalangan haqiqiy manba) — email matnidan taxmin qilish xavfsiz emas edi.
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (error || !data) {
      console.error('Rol topilmadi:', error?.message);
      setRole('sotuvchi'); // eng kam huquqli rol — xavfsiz standart holat
    } else {
      setRole(data.role);
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
