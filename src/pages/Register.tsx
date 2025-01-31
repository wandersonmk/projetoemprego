import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ChevronLeft, ChevronRight, Star, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';

type UserType = 'client' | 'provider';

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>('client');
  const [credentials, setCredentials] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (credentials.password !== credentials.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(
        credentials.email, 
        credentials.password, 
        userType, 
        `${credentials.firstName} ${credentials.lastName}`
      );
      // Redirect based on user type
      if (userType === 'client') {
        navigate('/profile');
      } else {
        navigate('/provider/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if ((err as { error: PostgrestError })?.error?.message) {
        setError((err as { error: PostgrestError }).error.message);
      } else {
        setError('Erro ao criar conta. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Formulário de Registro */}
      <div className="bg-white dark:bg-dark-lighter p-8 flex items-center justify-center transition-colors">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">TaskMatch</h2>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Crie sua conta</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Junte-se à nossa comunidade e comece a trabalhar de forma independente
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType('client')}
                    className={`p-4 rounded-lg border ${
                      userType === 'client'
                        ? 'border-primary bg-primary-bg dark:bg-primary/20 text-primary'
                        : 'border-gray-200 dark:border-dark-border hover:border-primary'
                    } transition-colors`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UserCircle className="w-6 h-6" />
                      <span className="font-medium">Cliente</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('provider')}
                    className={`p-4 rounded-lg border ${
                      userType === 'provider'
                        ? 'border-primary bg-primary-bg dark:bg-primary/20 text-primary'
                        : 'border-gray-200 dark:border-dark-border hover:border-primary'
                    } transition-colors`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Star className="w-6 h-6" />
                      <span className="font-medium">Profissional</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={credentials.firstName}
                    onChange={(e) => setCredentials(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="João"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={credentials.lastName}
                    onChange={(e) => setCredentials(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Silva"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Criando conta...</span>
                </>
              ) : (
                <span>Criar Conta</span>
              )}
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                Entrar
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
              {userType === 'client' 
                ? 'Encontre os melhores profissionais.'
                : 'Comece a trabalhar do seu jeito.'}
            </h2>

            <div className="space-y-6">
              <blockquote className="text-white text-lg">
                {userType === 'client'
                  ? '"Encontrei profissionais qualificados para todos os meus projetos. O processo é simples e seguro."'
                  : '"Encontrar trabalhos e se conectar com clientes nunca foi tão fácil. A plataforma simplifica todo o processo."'}
              </blockquote>

              <div className="space-y-2">
                <p className="text-white font-semibold">
                  {userType === 'client' ? 'Carlos Santos' : 'Ana Silva'}
                </p>
                <p className="text-primary-bg">
                  {userType === 'client' ? 'Empresário' : 'Designer de Interiores'}
                </p>
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
                {userType === 'client'
                  ? 'Contrate profissionais qualificados'
                  : 'Encontre o trabalho perfeito agora'}
              </h3>
              <p className="text-primary-bg">
                {userType === 'client'
                  ? 'Conecte-se com profissionais verificados e avaliados pela comunidade.'
                  : 'Seja um dos primeiros profissionais a experimentar a maneira mais fácil de começar a trabalhar de forma independente.'}
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