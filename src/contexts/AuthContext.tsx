import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ data: any, error: any }>;
  signUp: (email: string, password: string, userType: 'client' | 'provider', fullName: string) => Promise<void>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Função para atualizar o estado do usuário
    const updateUserState = (session: any) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    // Verificar sessão ativa
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        updateUserState(session);

        // Se não houver sessão, tentar recuperar
        if (!session) {
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
          if (!error && refreshedSession) {
            updateUserState(refreshedSession);
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Ouvir mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Evento de autenticação:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token atualizado com sucesso');
      }
      
      if (event === 'SIGNED_OUT') {
        // Limpar dados locais se necessário
        localStorage.removeItem('supabase.auth.token');
      }

      updateUserState(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userType: 'client' | 'provider', fullName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create profile after signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            user_type: userType,
          },
        ]);

      if (profileError) throw profileError;

      if (userType === 'provider') {
        const { error: providerError } = await supabase
          .from('provider_profiles')
          .insert([
            {
              id: data.user.id,
            },
          ]);

        if (providerError) throw providerError;
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Configurar refresh token automático
      await supabase.auth.refreshSession();

      setUser(data.user);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpar dados locais
      localStorage.removeItem('supabase.auth.token');
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}