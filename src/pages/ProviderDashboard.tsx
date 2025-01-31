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

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          provider_profiles (*)
        `)
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch accepted services with their details
      const { data: applications, error: servicesError } = await supabase
        .from('service_applications')
        .select(`
          *,
          service:services!inner(
            *,
            client:profiles(*)
          )
        `)
        .eq('provider_id', user?.id)
        .eq('status', 'accepted')
        .eq('service.status', 'in_progress');

      if (servicesError) throw servicesError;

      // Format the services data
      const formattedServices = applications?.map(app => ({
        ...app.service,
        client: app.service.client,
        application: {
          id: app.id,
          service_id: app.service_id,
          provider_id: app.provider_id,
          proposed_price: app.proposed_price,
          message: app.message,
          status: app.status,
          created_at: app.created_at
        }
      })) || [];

      setAcceptedServices(formattedServices);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Erro ao carregar dados do painel');
    } finally {
      setIsLoading(false);
    }
  };

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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Meus Serviços
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Serviços em que você foi selecionado
                  </p>
                </div>

                <div className="p-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : acceptedServices.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum serviço em andamento
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Você ainda não foi selecionado para nenhum serviço
                      </p>
                      <Link
                        to="/services"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                      >
                        <Search className="w-4 h-4" />
                        <span>Buscar Serviços</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {acceptedServices.map((service) => (
                        <div
                          key={service.id}
                          className="bg-gray-50 dark:bg-dark rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {service.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <UserIcon className="w-4 h-4" />
                                  <span>{service.client.full_name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{service.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                R$ {service.application.proposed_price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {service.description}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>Prazo: {new Date(service.deadline || '').toLocaleDateString()}</span>
                            </div>
                            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                              Iniciar Chat
                            </button>
                          </div>
                        </div>
                      ))}
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