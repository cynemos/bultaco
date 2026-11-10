import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Vérifie côté base (fonction public.is_admin) que le compte est bien administrateur
const checkIsAdmin = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
};

// Ne garde la session que si l'utilisateur est administrateur
const resolveAdminUser = async (candidate: User | null): Promise<User | null> => {
  if (!candidate) return null;
  if (await checkIsAdmin()) return candidate;
  await supabase.auth.signOut();
  return null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(await resolveAdminUser(session?.user ?? null));
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Pas d'appel Supabase directement dans ce callback (risque de blocage) :
        // la vérification admin est différée.
        setTimeout(async () => {
          setUser(await resolveAdminUser(session?.user ?? null));
          setLoading(false);
        }, 0);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && !(await checkIsAdmin())) {
      await supabase.auth.signOut();
      return { data: null, error: new Error('not_admin') };
    }
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};