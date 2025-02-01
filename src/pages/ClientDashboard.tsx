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
  Search,
  X,
  Trash2
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    budget: '',
    location: '',
    deadline: '',
    category: ''
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

      // Verificar sessão antes de fazer as requisições
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Sessão expirada');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST301') {
          throw new Error('Sessão expirada');
        }
        console.error('Erro ao carregar perfil:', profileError);
        throw new Error('Erro ao carregar perfil');
      }

      // Buscar serviços com candidaturas pendentes
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          applications:service_applications!inner(
            *,
            provider:profiles(*)
          )
        `)
        .eq('client_id', user.id)
        .eq('status', 'open')
        .eq('service_applications.status', 'pending');

      if (servicesError) {
        console.error('Services error:', servicesError);
        throw new Error('Erro ao carregar serviços pendentes');
      }

      const formattedServices = servicesData?.map(service => ({
        ...service,
        applications: service.applications || []
      })) || [];

      // Buscar serviços em andamento
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
        // Verificar se o token ainda é válido
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('Sessão expirada');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST301') {
            // Erro de autenticação
            await signOut();
            navigate('/login');
            return;
          }
          console.error('Erro ao verificar perfil:', profileError);
          throw new Error('Erro ao verificar tipo de usuário');
        }

        if (profile.user_type !== 'client') {
          navigate('/provider/dashboard');
          return;
        }

        await loadDashboardData();
      } catch (err) {
        console.error('Erro na inicialização:', err);
        if (err instanceof Error && err.message === 'Sessão expirada') {
          await signOut();
          navigate('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Erro ao inicializar dashboard');
        setIsLoading(false);
      }
    };

    init();
  }, [user, navigate, signOut]);

  const [data, setData] = useState<DashboardData>({
    profile: null,
    pendingServices: [],
    activeServices: [],
    completedServices: [],
    applications: [],
  });

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      setIsProcessing(true);

      // Buscar informações da candidatura
      const { data: applicationData, error: fetchError } = await supabase
        .from('service_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar status da candidatura aceita
      const { error: acceptError } = await supabase
        .from('service_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId);

      if (acceptError) throw acceptError;

      // Rejeitar outras candidaturas
      const { error: rejectError } = await supabase
        .from('service_applications')
        .update({ status: 'rejected' })
        .eq('service_id', applicationData.service_id)
        .neq('id', applicationId);

      if (rejectError) throw rejectError;

      // Atualizar status do serviço
      const { error: serviceError } = await supabase
        .from('services')
        .update({ status: 'in_progress' })
        .eq('id', applicationData.service_id);

      if (serviceError) throw serviceError;

      loadDashboardData();
    } catch (error) {
      console.error('Erro ao aceitar candidatura:', error);
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

  const handleCompleteService = async (serviceId: string) => {
    try {
      setIsProcessing(true);
      console.log('Iniciando conclusão do serviço:', { serviceId });

      // Atualizar o status do serviço para 'completed'
      const { error: serviceError } = await supabase
        .from('services')
        .update({ status: 'completed' })
        .eq('id', serviceId);

      if (serviceError) {
        console.error('Erro ao atualizar serviço:', serviceError);
        throw serviceError;
      }
      console.log('Serviço atualizado para completed');

      console.log('Updates successful, reloading data...');
      
      await loadDashboardData();

    } catch (err) {
      console.error('Error in handleCompleteService:', err);
      setError('Erro ao concluir serviço. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validação dos campos
      if (!newService.title.trim()) {
        throw new Error('O título é obrigatório');
      }
      if (!newService.description.trim()) {
        throw new Error('A descrição é obrigatória');
      }
      if (!newService.budget || parseFloat(newService.budget) <= 0) {
        throw new Error('O orçamento deve ser maior que zero');
      }
      if (!newService.location.trim()) {
        throw new Error('A localização é obrigatória');
      }
      if (!newService.deadline) {
        throw new Error('O prazo é obrigatório');
      }
      if (!newService.category) {
        throw new Error('A categoria é obrigatória');
      }

      setIsProcessing(true);
      setError(null);

      const { data: service, error } = await supabase
        .from('services')
        .insert([
          {
            title: newService.title.trim(),
            description: newService.description.trim(),
            budget: parseFloat(newService.budget),
            location: newService.location.trim(),
            deadline: newService.deadline,
            category: newService.category,
            client_id: user?.id,
            status: 'open' // Alterado de 'requested' para 'open'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setIsModalOpen(false);
      setNewService({
        title: '',
        description: '',
        budget: '',
        location: '',
        deadline: '',
        category: ''
      });
      
      await loadDashboardData();
      alert('Serviço criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar serviço. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filterServices = (services: any[]) => {
    if (!searchTerm) return services;
    
    const searchLower = searchTerm.toLowerCase();
    return services.filter(service => 
      service.title.toLowerCase().includes(searchLower) ||
      service.description.toLowerCase().includes(searchLower) ||
      service.location?.toLowerCase().includes(searchLower) ||
      (service.applications?.some((app: any) => 
        app.provider?.full_name.toLowerCase().includes(searchLower) ||
        app.message?.toLowerCase().includes(searchLower)
      ))
    );
  };

  // Atualizar os filtros de status
  const openServices = data.pendingServices.filter(service => service.status === 'open');
  const inProgressServices = data.activeServices.filter(service => service.status === 'in_progress');
  const completedServices = data.completedServices.filter(service => service.status === 'completed');

  const filteredOpenServices = filterServices(openServices);
  const filteredInProgressServices = filterServices(inProgressServices);
  const filteredCompletedServices = filterServices(completedServices);

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    let number = value.replace(/\D/g, '');
    
    // Se não houver número, retorna R$ 0,00
    if (!number) {
      return 'R$ 0,00';
    }
    
    // Converte para número e divide por 100 para considerar centavos
    const amount = Number(number) / 100;
    
    // Formata para real brasileiro
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove formatação para armazenar apenas o número
    const numericValue = value.replace(/\D/g, '');
    
    // Atualiza o estado com o valor numérico (para uso interno)
    setNewService({
      ...newService,
      budget: numericValue ? (Number(numericValue) / 100).toString() : ''
    });

    // Atualiza o valor exibido no input
    e.target.value = formatCurrency(numericValue);
  };

  const handleBudgetFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Se o valor for zero, limpa o campo ao focar
    if (e.target.value === 'R$ 0,00') {
      e.target.value = '';
    }
  };

  const handleBudgetBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Se o campo estiver vazio ao perder o foco, coloca zero
    if (!e.target.value) {
      e.target.value = formatCurrency('0');
      setNewService({
        ...newService,
        budget: '0'
      });
    }
  };

  // Adicionar array de cidades disponíveis
  const availableCities = [
    'Salto',
    'Indaiatuba',
    'Itu',
    'Sorocaba',
    'Campinas',
    'São Paulo'
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-6 rounded-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Clock className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-red-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Candidaturas Pendentes</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {openServices.length}
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-6 rounded-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Em Andamento</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {inProgressServices.length}
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-white ${darkMode ? 'dark:bg-dark-lighter' : ''} p-6 rounded-xl`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Serviços Concluídos</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {completedServices.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications and Active Services */}
        <div className="mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
              Meus Serviços
            </h2>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-96">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar serviços..."
                  className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-lighter text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Solicitar Serviço
              </button>
            </div>
          </div>

          {/* Modal de Solicitação de Serviço */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-dark-lighter rounded-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Solicitar Novo Serviço
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateService} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-white"
                      placeholder="Ex: Desenvolvimento de Website"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-white"
                      placeholder="Descreva os detalhes do serviço..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Orçamento
                      </label>
                      <input
                        type="text"
                        value={newService.budget ? formatCurrency(Math.round(parseFloat(newService.budget) * 100).toString()) : 'R$ 0,00'}
                        onChange={handleBudgetChange}
                        onFocus={handleBudgetFocus}
                        onBlur={handleBudgetBlur}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-white"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Localização
                      </label>
                      <select
                        value={newService.location}
                        onChange={(e) => setNewService({ ...newService, location: e.target.value })}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione uma cidade</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prazo
                      </label>
                      <input
                        type="date"
                        value={newService.deadline}
                        onChange={(e) => setNewService({ ...newService, deadline: e.target.value })}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoria
                      </label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="desenvolvimento">Desenvolvimento</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="redacao">Redação</option>
                        <option value="traducao">Tradução</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
                    >
                      {isProcessing ? 'Criando...' : 'Criar Serviço'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna: Candidaturas Pendentes */}
            <div className="bg-red-100/50 dark:bg-red-900/10 rounded-xl overflow-hidden">
              <div className="bg-red-200 dark:bg-red-900/30 p-4">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Candidaturas Pendentes ({filteredOpenServices.length})
                </h3>
              </div>
              <div className="p-4 space-y-4 min-h-[500px]">
                {filteredOpenServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-dark-lighter shadow-sm hover:shadow-md transition-shadow rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {service.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary font-medium">
                        R$ {service.budget.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <UserIcon className="w-4 h-4" />
                        <span>{service.applications?.length || 0} candidatos</span>
                      </div>
                    </div>
                    {service.applications && service.applications.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {service.applications.map((application) => (
                          <div
                            key={application.id}
                            className="p-3 bg-gray-50 dark:bg-dark rounded-lg"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium dark:text-white">
                                {application.provider?.full_name}
                              </span>
                              <button
                                onClick={() => handleAcceptApplication(application.id)}
                                className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition"
                              >
                                Aceitar
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {application.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna: Em Andamento */}
            <div className="bg-yellow-100/50 dark:bg-yellow-900/10 rounded-xl overflow-hidden">
              <div className="bg-yellow-200 dark:bg-yellow-900/30 p-4">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Em Andamento ({filteredInProgressServices.length})
                </h3>
              </div>
              <div className="p-4 space-y-4 min-h-[500px]">
                {filteredInProgressServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-dark-lighter shadow-sm hover:shadow-md transition-shadow rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {service.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary font-medium">
                        R$ {service.budget.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <UserIcon className="w-4 h-4" />
                        <span>
                          {service.applications?.find(app => app.status === 'accepted')?.provider?.full_name}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCompleteService(service.id)}
                      className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                    >
                      Marcar como Concluído
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna: Concluídos */}
            <div className="bg-blue-100/50 dark:bg-blue-900/10 rounded-xl overflow-hidden">
              <div className="bg-blue-200 dark:bg-blue-900/30 p-4">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Concluídos ({filteredCompletedServices.length})
                </h3>
              </div>
              <div className="p-4 space-y-4 min-h-[500px]">
                {filteredCompletedServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-dark-lighter shadow-sm hover:shadow-md transition-shadow rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {service.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary font-medium">
                        R$ {service.budget.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Finalizado</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}