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
} from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type ServiceApplication = Database['public']['Tables']['service_applications']['Row'];

interface ServiceWithProvider extends Service {
  provider?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface DashboardData {
  profile: Profile | null;
  pendingServices: Service[];
  activeServices: ServiceWithProvider[];
  completedServices: Service[];
  applications: (ServiceApplication & { service: Service })[];
}

export function ClientDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<DashboardData>({
    profile: null,
    pendingServices: [],
    activeServices: [],
    completedServices: [],
    applications: [],
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Fetch services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch active services with provider information
      const { data: activeServicesData, error: activeServicesError } = await supabase
        .from('services')
        .select(`
          *,
          applications:service_applications!inner(
            provider:profiles!inner(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('client_id', user?.id)
        .eq('status', 'in_progress')
        .eq('service_applications.status', 'accepted');

      if (activeServicesError) throw activeServicesError;

      // Format active services to include provider info
      const formattedActiveServices = activeServicesData?.map(service => ({
        ...service,
        provider: service.applications[0].provider
      }));

      // Fetch only pending applications for open services
      const { data: applications, error: applicationsError } = await supabase
        .from('service_applications')
        .select(`
          *,
          service:services(*)
        `)
        .in('service_id', services.filter(s => s.status === 'open').map(s => s.id))
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      setData({
        profile,
        pendingServices: services.filter(s => s.status === 'open'),
        activeServices: formattedActiveServices || [],
        completedServices: services.filter(s => s.status === 'completed'),
        applications: applications as any,
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Erro ao carregar dados do painel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptApplication = async (application: ServiceApplication) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      // Start a transaction to update both the application and service status
      const { error: updateApplicationError } = await supabase
        .from('service_applications')
        .update({ status: 'accepted' })
        .eq('id', application.id);

      if (updateApplicationError) throw updateApplicationError;

      // Update service status to in_progress
      const { error: updateServiceError } = await supabase
        .from('services')
        .update({ status: 'in_progress' })
        .eq('id', application.service_id);

      if (updateServiceError) throw updateServiceError;

      // Reject other applications for this service
      const { error: rejectOthersError } = await supabase
        .from('service_applications')
        .update({ status: 'rejected' })
        .eq('service_id', application.service_id)
        .neq('id', application.id);

      if (rejectOthersError) throw rejectOthersError;

      // Reload dashboard data
      await loadDashboardData();

    } catch (err) {
      console.error('Error accepting application:', err);
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

      // Reload dashboard data
      await loadDashboardData();

    } catch (err) {
      console.error('Error rejecting application:', err);
      setError('Erro ao recusar candidatura. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
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

  if (!user || !data.profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      {/* Header */}
      <header className="bg-white dark:bg-dark-lighter border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              TaskMatch
            </h1>
            
            <div className="flex items-center gap-4">
              <Link
                to="/services/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Serviço</span>
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
                    {data.profile.full_name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {data.profile.email}
                  </span>
                </div>
                {data.profile.avatar_url ? (
                  <img
                    src={data.profile.avatar_url}
                    alt={data.profile.full_name || ''}
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bem-vindo de volta, {data.profile.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aqui está um resumo das suas atividades
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-dark-lighter p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Saldo de Créditos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      R$ {data.profile.credits?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-lighter p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Serviços Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.pendingServices.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-lighter p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Serviços Ativos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.activeServices.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-lighter p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Serviços Concluídos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {data.completedServices.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Applications and Active Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-lighter rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Candidaturas Recentes
                  </h3>
                  <Link
                    to="/services/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Serviço</span>
                  </Link>
                </div>
                <div className="space-y-4">
                  {data.applications.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma candidatura pendente
                    </p>
                  ) : (
                    data.applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {application.service.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Proposta: R$ {application.proposed_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptApplication(application)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition disabled:opacity-50"
                          >
                            {isProcessing ? 'Processando...' : 'Aceitar'}
                          </button>
                          <button
                            onClick={() => handleRejectApplication(application)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-gray-200 dark:bg-dark-lighter text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-dark transition disabled:opacity-50"
                          >
                            {isProcessing ? 'Processando...' : 'Recusar'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Services */}
              <div className="bg-white dark:bg-dark-lighter rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Serviços em Andamento
                </h3>
                <div className="space-y-4">
                  {data.activeServices.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum serviço em andamento
                    </p>
                  ) : (
                    data.activeServices.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 bg-gray-50 dark:bg-dark rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {service.title}
                          </h4>
                          <span className="text-sm font-medium text-primary">
                            R$ {service.budget.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <UserIcon className="w-4 h-4" />
                              <span>Profissional: {service.provider?.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <MapPin className="w-4 h-4" />
                              <span>{service.location}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
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
          </>
        )}
      </main>
    </div>
  );
}