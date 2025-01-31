import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Calendar, User, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { Navigation } from '../components/Navigation';
import { fireConfetti } from '../utils/confetti';

interface Service {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  deadline: string;
  created_at: string;
  has_applications: boolean;
  client: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ServiceApplication {
  serviceId: string;
  message: string;
}

export function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [application, setApplication] = useState<ServiceApplication>({
    serviceId: '',
    message: '',
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (feedback) {
      timeoutId = setTimeout(() => {
        setFeedback(null);
      }, 5000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [feedback]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          client:profiles(full_name, avatar_url),
          applications:service_applications(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      // Format services to include has_applications flag
      const formattedServices = servicesData?.map(service => ({
        ...service,
        has_applications: service.applications[0].count > 0
      })) || [];

      setServices(formattedServices);
    } catch (err) {
      console.error('Error loading services:', err);
      setFeedback({
        type: 'error',
        message: 'Erro ao carregar serviços. Por favor, tente novamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (service: Service) => {
    if (!user) {
      sessionStorage.setItem('returnToService', 'true');
      navigate('/login');
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.user_type !== 'provider') {
        setFeedback({
          type: 'error',
          message: 'Apenas prestadores de serviços podem se candidatar.'
        });
        return;
      }

      const { data: applications, error: applicationsError } = await supabase
        .from('service_applications')
        .select('id')
        .eq('service_id', service.id)
        .eq('provider_id', user.id);

      if (applicationsError) throw applicationsError;

      if (applications && applications.length > 0) {
        setFeedback({
          type: 'error',
          message: 'Você já se candidatou para este serviço.'
        });
        return;
      }

      setSelectedService(service);
      
      if (service.has_applications) {
        setShowConfirmModal(true);
      } else {
        setShowModal(true);
      }

      setApplication({
        serviceId: service.id,
        message: '',
      });
    } catch (err) {
      console.error('Error checking application:', err);
      setFeedback({
        type: 'error',
        message: 'Erro ao verificar candidatura. Por favor, tente novamente.'
      });
    }
  };

  const handleConfirmApplication = () => {
    setShowConfirmModal(false);
    setShowModal(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedService) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { error } = await supabase
        .from('service_applications')
        .insert([
          {
            service_id: selectedService.id,
            provider_id: user.id,
            proposed_price: selectedService.budget,
            message: application.message,
          },
        ]);

      if (error) throw error;

      setShowModal(false);
      setApplication({ serviceId: '', message: '' });
      fireConfetti();
      setFeedback({
        type: 'success',
        message: 'Candidatura enviada com sucesso!'
      });

      // Reload services to update the has_applications status
      await loadServices();

    } catch (err) {
      console.error('Error submitting application:', err);
      setFeedback({
        type: 'error',
        message: 'Erro ao enviar candidatura. Por favor, tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Feedback message */}
        {feedback && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 transition-opacity duration-300 ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search and filters section */}
        <div className="bg-white dark:bg-dark-lighter shadow-lg p-6 rounded-xl">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Encontre Serviços
            </h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar serviços..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select className="px-4 py-2 bg-white dark:bg-dark-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
            <option value="">Todas as categorias</option>
            <option value="tecnologia">Tecnologia</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
          </select>
          <select className="px-4 py-2 bg-white dark:bg-dark-lighter text-gray-900 dark:text-white border border-gray-200 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
            <option value="">Ordenar por</option>
            <option value="recent">Mais recentes</option>
            <option value="budget">Maior valor</option>
          </select>
        </div>

        {/* Services grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className={`group bg-white dark:bg-dark-lighter rounded-xl shadow-sm hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${
                  service.has_applications ? 'border-2 border-orange-400' : ''
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-6">
                  {service.has_applications && (
                    <div className="absolute top-2 right-2 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                      Tem candidatos
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{service.client.full_name}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{service.location}</span>
                        </div>
                      </div>
                    </div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium group-hover:bg-primary group-hover:text-white transition-colors">
                      R$ {service.budget.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-border">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(service.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => handleApply(service)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors relative overflow-hidden group-hover:shadow-md"
                    >
                      <span className="relative z-10">Candidatar-se</span>
                      <div className="absolute inset-0 bg-primary-dark transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedService && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-lighter shadow-xl rounded-xl w-full max-w-md p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Confirmar Candidatura
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Este serviço já possui candidatos. Deseja prosseguir com sua candidatura?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmApplication}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Application Modal */}
        {showModal && selectedService && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-lighter shadow-xl rounded-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Candidatar-se ao Serviço
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedService.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cliente: {selectedService.client.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Orçamento do cliente
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    R$ {selectedService.budget.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedService.description}
                </p>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensagem ao Cliente
                  </label>
                  <textarea
                    id="message"
                    value={application.message}
                    onChange={(e) => setApplication(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent h-32 resize-none"
                    required
                    placeholder="Descreva sua experiência e por que você é a melhor escolha para este serviço..."
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark rounded-lg transition"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-2 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Candidatura</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}