import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { Database } from '../lib/supabase/types';
import { 
  Briefcase, Users, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, MessageSquare, ListTodo, User as UserIcon, Settings,
  MoreHorizontal, Plus, Bell, LogOut, Star, Search, DollarSign,
  MapPin
} from 'lucide-react';
import { ProviderProfile } from '../components/ProviderProfile';

type Service = Database['public']['Tables']['services']['Row'];
type ServiceApplication = Database['public']['Tables']['service_applications']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProviderProfile = Database['public']['Tables']['provider_profiles']['Row'];

type ServiceWithDetails = Service & {
  client: Profile;
  application: ServiceApplication;
};

export function ProviderDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [acceptedServices, setAcceptedServices] = useState<ServiceWithDetails[]>([]);
  const [pendingServices, setPendingServices] = useState<ServiceWithDetails[]>([]);
  const [completedServices, setCompletedServices] = useState<ServiceWithDetails[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Verifica se o usuário é um prestador de serviços
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.user_type !== 'provider') {
          navigate('/client/dashboard');
          return;
        }

        await loadDashboardData();
      } catch (err) {
        console.error('Error in init:', err);
        setError('Erro ao carregar dados do dashboard');
      }
    };

    init();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Iniciando carregamento dos dados do dashboard');

      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, provider_profiles (*)')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      console.log('Perfil carregado:', profileData);

      // Buscar candidaturas pendentes
      const { data: pendingApplications, error: pendingError } = await supabase
        .from('service_applications')
        .select(`
          *,
          service:services(
            *,
            client:profiles(*)
          )
        `)
        .eq('provider_id', user?.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Buscar serviços em andamento (aceitos pelo cliente)
      const { data: inProgressServices, error: inProgressError } = await supabase
        .from('services')
        .select(`
          *,
          client:profiles(*),
          service_applications!inner(*)
        `)
        .eq('service_applications.provider_id', user?.id)
        .eq('service_applications.status', 'accepted')
        .eq('status', 'in_progress');

      if (inProgressError) {
        console.error('Erro ao buscar serviços em andamento:', inProgressError);
        throw inProgressError;
      }
      console.log('Serviços em andamento (raw):', inProgressServices);

      // Formatar serviços em andamento
      const formattedInProgressServices = inProgressServices?.map(service => ({
        ...service,
        application: service.service_applications[0]
      })) || [];

      console.log('Serviços em andamento (formatados):', formattedInProgressServices);
      setAcceptedServices(formattedInProgressServices);

      // Buscar serviços concluídos
      const { data: completedServices, error: completedError } = await supabase
        .from('services')
        .select(`
          *,
          client:profiles(*),
          service_applications!inner(*)
        `)
        .eq('service_applications.provider_id', user?.id)
        .eq('service_applications.status', 'accepted')
        .eq('status', 'completed');

      if (completedError) throw completedError;

      // Formatar serviços pendentes
      const formattedPendingServices = pendingApplications
        ?.filter(app => app.service?.status === 'open')
        .map(app => ({
          ...app.service,
          client: app.service.client,
          application: app
        })) || [];

      // Formatar serviços concluídos
      const formattedCompletedServices = completedServices?.map(service => ({
        ...service,
        application: service.service_applications[0]
      })) || [];

      console.log('Serviços em andamento:', formattedInProgressServices);

      setPendingServices(formattedPendingServices);
      setCompletedServices(formattedCompletedServices);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const serviceChanges = supabase
      .channel('service-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Mudança detectada em services:', payload);
          loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_applications'
        },
        (payload) => {
          console.log('Mudança detectada em service_applications:', payload);
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      serviceChanges.unsubscribe();
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-dark-lighter border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">TaskMaster</h1>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-64 px-4 py-2 bg-gray-100 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                to="/services"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                <Search className="w-4 h-4" />
                <span>Buscar Serviços</span>
              </Link>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {profile.full_name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {profile.email}
                  </span>
                </div>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profile'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark rounded-lg"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-dark-lighter rounded-xl p-4">
              <div className="p-4 mb-4 text-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profile'}
                    className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-primary" />
                  </div>
                )}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.full_name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.provider_profiles?.is_verified ? 'Profissional Verificado' : 'Profissional'}
                </p>
                {profile.provider_profiles?.rating && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {profile.provider_profiles.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({profile.provider_profiles.total_reviews} avaliações)
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeTab === 'profile'
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="font-medium">Perfil</span>
                </button>
                <button 
                  onClick={() => setActiveTab('services')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeTab === 'services'
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="font-medium">Meus Serviços</span>
                  {acceptedServices.length > 0 && (
                    <span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {acceptedServices.length}
                    </span>
                  )}
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Mensagens</span>
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    2
                  </span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark rounded-lg">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Calendário</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' ? (
              <ProviderProfile />
            ) : (
              <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-dark-border">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Meus Serviços
                  </h2>
                </div>

                <div className="p-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="mt-8">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Meus Serviços
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Coluna: Pendentes */}
                        <div className="bg-red-100/50 dark:bg-red-900/10 rounded-xl overflow-hidden">
                          <div className="bg-red-200 dark:bg-red-900/30 p-4">
                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                              Pendentes ({pendingServices.length})
                            </h3>
                          </div>
                          <div className="p-4 space-y-4 min-h-[500px]">
                            {pendingServices.map((service) => (
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
                                    <Clock className="w-4 h-4" />
                                    <span>Aguardando</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Coluna: Em Andamento */}
                        <div className="bg-yellow-100/50 dark:bg-yellow-900/10 rounded-xl overflow-hidden">
                          <div className="bg-yellow-200 dark:bg-yellow-900/30 p-4">
                            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                              Em Andamento ({acceptedServices.length})
                            </h3>
                          </div>
                          <div className="p-4 space-y-4 min-h-[500px]">
                            {acceptedServices.map((service) => (
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
                                    R$ {service.application.proposed_price.toFixed(2)}
                                  </span>
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <UserIcon className="w-4 h-4" />
                                    <span>{service.client.full_name}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Coluna: Concluídos */}
                        <div className="bg-blue-100/50 dark:bg-blue-900/10 rounded-xl overflow-hidden">
                          <div className="bg-blue-200 dark:bg-blue-900/30 p-4">
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                              Concluídos ({completedServices.length})
                            </h3>
                          </div>
                          <div className="p-4 space-y-4 min-h-[500px]">
                            {completedServices.map((service) => (
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
                                    R$ {service.application.proposed_price.toFixed(2)}
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}