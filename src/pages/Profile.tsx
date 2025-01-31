import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Star, Briefcase, Clock } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">João Silva</h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <Mail className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-medium">4.8</span>
              </span>
              <span className="text-gray-600">(12 avaliações)</span>
            </div>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Serviços Realizados</h3>
              <p className="text-2xl font-bold text-blue-600">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Avaliação Média</h3>
              <p className="text-2xl font-bold text-green-600">4.8</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tempo na Plataforma</h3>
              <p className="text-2xl font-bold text-purple-600">3 meses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h4 className="font-medium">Montagem de Móveis</h4>
              <p className="text-sm text-gray-600">Serviço concluído</p>
            </div>
            <span className="text-green-600 font-medium">R$ 150,00</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h4 className="font-medium">Limpeza Residencial</h4>
              <p className="text-sm text-gray-600">Serviço em andamento</p>
            </div>
            <span className="text-blue-600 font-medium">R$ 200,00</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium">Pintura de Parede</h4>
              <p className="text-sm text-gray-600">Proposta enviada</p>
            </div>
            <span className="text-gray-600 font-medium">R$ 300,00</span>
          </div>
        </div>
      </div>
    </div>
  );
}