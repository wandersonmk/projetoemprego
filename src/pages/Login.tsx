import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(credentials.email, credentials.password);
      
      // Fetch user profile to determine user type
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('email', credentials.email)
        .single();

      if (profileError) throw profileError;

      // Check if we should return to services page
      const returnToService = sessionStorage.getItem('returnToService');
      if (returnToService) {
        sessionStorage.removeItem('returnToService');
        navigate('/services');
      } else {
        // Otherwise, redirect based on user type
        if (profile.user_type === 'provider') {
          navigate('/provider/dashboard');
        } else {
          navigate('/profile');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Email ou senha inválidos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Formulário de Login */}
      <div className="bg-white dark:bg-dark-lighter p-8 flex items-center justify-center transition-colors">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">TaskMatch</h2>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta</h1>
            <p className="text-gray-600 dark:text-gray-300">Por favor, insira os detalhes da sua conta</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="seuemail@exemplo.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button type="button" className="text-sm text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                Criar conta
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Seção de Depoimentos */}
      <div className="hidden md:block bg-primary p-8 relative overflow-hidden">
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-bold text-white mb-12">
              O que nossos Profissionais dizem.
            </h2>

            <div className="space-y-6">
              <blockquote className="text-white text-lg">
                "Encontrar trabalhos e se conectar com clientes nunca foi tão fácil. 
                A plataforma simplifica todo o processo."
              </blockquote>

              <div className="space-y-2">
                <p className="text-white font-semibold">Ana Silva</p>
                <p className="text-primary-bg">Designer de Interiores</p>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="p-2 bg-primary-dark/20 rounded-lg text-white hover:bg-primary-dark/30 transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="p-2 bg-primary-dark/20 rounded-lg text-white hover:bg-primary-dark/30 transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Encontre o trabalho perfeito agora
              </h3>
              <p className="text-primary-bg">
                Seja um dos primeiros profissionais a experimentar a maneira mais fácil
                de começar a trabalhar de forma independente.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute right-0 bottom-0 transform translate-x-1/4 translate-y-1/4">
          <div className="w-96 h-96 bg-primary-dark/30 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}