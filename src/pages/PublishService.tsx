import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, DollarSign, Tag, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase/client';
import { fireConfetti } from '../utils/confetti';

interface ServiceForm {
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  deadline: string;
}

const categories = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'traducao', label: 'Tradução' },
  { value: 'redacao', label: 'Redação' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'educacao', label: 'Educação' },
];

export function PublishService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<ServiceForm>({
    title: '',
    description: '',
    category: '',
    budget: 0,
    location: '',
    deadline: '',
  });

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('services')
        .insert([
          {
            client_id: user.id,
            title: service.title,
            description: service.description,
            category: service.category,
            budget: service.budget,
            location: service.location,
            deadline: service.deadline,
            status: 'open'
          }
        ]);

      if (insertError) throw insertError;

      fireConfetti();
      navigate('/profile');
    } catch (err) {
      console.error('Error publishing service:', err);
      setError('Erro ao publicar serviço. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Publicar Novo Serviço
        </h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título do Serviço
              </label>
              <input
                type="text"
                id="title"
                value={service.title}
                onChange={(e) => setService(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                placeholder="Ex: Desenvolvimento de Website Responsivo"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição Detalhada
              </label>
              <textarea
                id="description"
                value={service.description}
                onChange={(e) => setService(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={6}
                required
                placeholder="Descreva detalhadamente o serviço que você precisa, incluindo requisitos específicos e expectativas..."
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline-block mr-2" />
                  Categoria
                </label>
                <select
                  id="category"
                  value={service.category}
                  onChange={(e) => setService(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  disabled={isLoading}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline-block mr-2" />
                  Orçamento (R$)
                </label>
                <input
                  type="number"
                  id="budget"
                  value={service.budget}
                  onChange={(e) => setService(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline-block mr-2" />
                  Localização
                </label>
                <input
                  type="text"
                  id="location"
                  value={service.location}
                  onChange={(e) => setService(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  placeholder="Cidade, Estado"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline-block mr-2" />
                  Prazo
                </label>
                <input
                  type="date"
                  id="deadline"
                  value={service.deadline}
                  onChange={(e) => setService(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-border rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark rounded-lg transition"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <span>Publicar Serviço</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}