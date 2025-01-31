import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { Database } from '../lib/supabase/types';
import {
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  Settings,
  Bell,
  LogOut,
  DollarSign,
  Calendar,
  BarChart3,
  Briefcase,
  Plus,
  MapPin,
  Sun,
  Moon,
} from 'lucide-react';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  user_type: string;
  credits?: number;
};

type Service = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  deadline: string | null;
  status: string;
  created_at: string;
  applications?: ServiceApplication[];
};

type ServiceApplication = {
  id: string;
  service_id: string;
  provider_id: string;
  proposed_price: number;
  message: string;
  status: string;
  created_at: string;
  provider_name?: string;
  provider_avatar?: string | null;
};

interface ServiceWithProvider extends Service {
  provider?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface DashboardData {
  profile: Profile | null;
  pendingServices: Service[];
  activeServices: ServiceWithProvider[];
  completedServices: Service[];
  applications: ServiceApplication[];
}

export function ClientDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Erro ao carregar perfil');
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          applications:service_applications(*)
        `)
        .eq('client_id', user.id)
        .eq('status', 'open');

      if (servicesError) {
        console.error('Services error:', servicesError);
        throw new Error('Erro ao carregar serviços pendentes');
      }

      const formattedServices = servicesData?.map(service => ({
        ...service,
        applications: service.applications || []
      })) || [];

      const { data: activeServicesData, error: activeServicesError } = await supabase
        .from('services')
        .select(`
          *,
          service_applications!inner(
            *,
            provider:profiles(*)
          )
        `)
        .eq('client_id', user.id)
        .eq('status', 'in_progress');

      if (activeServicesError) {
        console.error('Active services error:', activeServicesError);
        throw new Error('Erro ao carregar serviços em andamento');
      }

      const formattedActiveServices = activeServicesData?.map(service => ({
        ...service,
        provider: service.service_applications?.[0]?.provider
      })) || [];

      const { data: completedServicesData, error: completedServicesError } = await supabase
        .from('services')
        .select('*')
        .eq('client_id', user.id)
        .eq('status', 'completed');

      if (completedServicesError) {
        console.error('Completed services error:', completedServicesError);
        throw new Error('Erro ao carregar serviços concluídos');
      }

      setData({
        profile: profileData,
        pendingServices: formattedServices,
        activeServices: formattedActiveServices,
        completedServices: completedServicesData || [],
        applications: [],
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw new Error('Erro ao verificar tipo de usuário');
        }

        if (profile.user_type !== 'client') {
          navigate('/provider/dashboard');
          return;
        }

        await loadDashboardData();
      } catch (err) {
        console.error('Error in init:', err);
        setError(err instanceof Error ? err.message : 'Erro ao inicializar dashboard');
        setIsLoading(false);
      }
    };

    init();
  }, [user, navigate]);

  const [data, setData] = useState<DashboardData>({
    profile: null,
    pendingServices: [],
    activeServices: [],
    completedServices: [],
    applications: [],
  });

  const handleAcceptApplication = async (application: ServiceApplication) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { error: serviceError } = await supabase
        .from('services')
        .update({ status: 'in_progress' })
        .eq('id', application.service_id);

      if (serviceError) {
        console.error('Service update error:', serviceError);
        throw serviceError;
      }

      const { error: applicationError } = await supabase
        .from('service_applications')
        .update({ status: 'accepted' })
        .eq('id', application.id);

      if (applicationError) {
        console.error('Application update error:', applicationError);
        throw applicationError;
      }

      console.log('Updates successful, reloading data...');
      
      await loadDashboardData();

    } catch (err) {
      console.error('Error in handleAcceptApplication:', err);
      setError('Erro ao aceitar candidatura. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async (application: ServiceApplication) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('service_applications')
        .update({ status: 'rejected' })
        .eq('id', application.id);

      if (error) throw error;

      await loadDashboardData();

    } catch (err) {
      console.error('Error rejecting application:', err);
      setError('Erro ao recusar candidatura. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsProcessing(true);
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setError('Erro ao fazer logout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
        <div className="bg-white dark:bg-dark-lighter p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow`}>
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="TaskMatch"
              className="h-8 w-auto"
            />
            <span className={`ml-2 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              TaskMatch
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {}} // Implementar notificações
              className={`p-2 ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => {}} // Implementar configurações
              className={`p-2 ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {data.profile && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>
                  {data.profile.full_name}
                </span>
                {data.profile.avatar_url && (
                  <img
                    src={data.profile.avatar_url}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={isProcessing}
              className={`p-2 ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 ${darkMode ? 'text-white' : ''}`}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Bem-vindo de volta, {data.profile.full_name?.split(' ')[0]}!
          </h2>
          <p className={`text-gray-600 ${darkMode ? 'dark:text-gray-400' : ''}`}>
            Aqui está um resumo das suas atividades
          </p>
        </div>

        {error && (
          <div className={`mb-8 p-4 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'} rounded-lg text-red-700 ${darkMode ? 'dark:text-red-200' : ''} flex items-center gap-2`}>
            <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
            <span className={`${darkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-6 rounded-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-primary'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Saldo de Créditos</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  R$ {data.profile.credits?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-6 rounded-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Serviços Pendentes</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.pendingServices.length}
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-6 rounded-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Serviços Ativos</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.activeServices.length}
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-6 rounded-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-green-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Serviços Concluídos</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.completedServices.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications and Active Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Candidaturas Recentes
              </h3>
            </div>
            <div className="space-y-4">
              {data.pendingServices.length === 0 ? (
                <p className={`text-gray-500 ${darkMode ? 'dark:text-gray-400' : ''}`}>
                  Nenhuma candidatura pendente
                </p>
              ) : (
                data.pendingServices.map((service) => (
                  <div key={service.id}>
                    {service.applications.map((application) => (
                      <div
                        key={application.id}
                        className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-4 rounded-lg border border-gray-200 ${darkMode ? 'dark:border-dark-border' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {application.provider_avatar ? (
                              <img
                                src={application.provider_avatar}
                                alt={application.provider_name || ''}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-10 h-10 ${darkMode ? 'bg-gray-700' : 'bg-primary/10'} rounded-full flex items-center justify-center`}>
                                <UserIcon className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-primary'}`} />
                              </div>
                            )}
                            <div>
                              <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {application.provider_name || 'Profissional'}
                              </h4>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Valor proposto: R$ {application.proposed_price}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptApplication(application)}
                              disabled={isProcessing}
                              className={`px-3 py-1 ${darkMode ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-primary text-white hover:bg-primary-dark'} rounded-lg text-sm transition disabled:opacity-50`}
                            >
                              {isProcessing ? 'Processando...' : 'Aceitar'}
                            </button>
                            <button
                              onClick={() => handleRejectApplication(application)}
                              disabled={isProcessing}
                              className={`px-3 py-1 ${darkMode ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg text-sm transition disabled:opacity-50`}
                            >
                              {isProcessing ? 'Processando...' : 'Recusar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Services */}
          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              Serviços em Andamento
            </h3>
            <div className="space-y-4">
              {data.activeServices.length === 0 ? (
                <p className={`text-gray-500 ${darkMode ? 'dark:text-gray-400' : ''}`}>
                  Nenhum serviço em andamento
                </p>
              ) : (
                data.activeServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 ${darkMode ? 'bg-gray-50 dark:bg-dark' : 'bg-gray-50'} rounded-lg`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.title}
                      </h4>
                      <span className={`text-sm font-medium ${darkMode ? 'text-primary' : 'text-primary'}`}>
                        R$ {service.budget.toFixed(2)}
                      </span>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <UserIcon className="w-4 h-4" />
                          <span>
                            Profissional: {service.provider?.full_name || 'Não definido'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-400'}`} />
                          <span>{service.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-gray-400'}`} />
                        <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                          {new Date(service.deadline || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}