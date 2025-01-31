import React from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, Shield, DollarSign } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="space-y-8 md:space-y-16 pt-8">
          {/* Hero Section */}
          <section className="text-center space-y-6 md:space-y-8 px-4">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Encontre profissionais qualificados para suas necessidades
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              O TaskMatch conecta você aos melhores profissionais para realizar seus serviços,
              de forma rápida, segura e confiável.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link
                to={user ? "/profile" : "/login"}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                <span>Publicar Serviço</span>
              </Link>
              <Link
                to="/services"
                className="bg-white dark:bg-dark-lighter text-primary px-6 py-3 rounded-lg border border-primary hover:bg-primary-bg dark:hover:bg-dark transition flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span>Procurar Serviços</span>
              </Link>
            </div>
          </section>

          {/* Features Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div className="text-center space-y-4">
              <Search className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Encontre Profissionais</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Publique sua necessidade e receba propostas de profissionais qualificados
              </p>
            </div>
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pagamento Seguro</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sistema de créditos com garantia de pagamento após conclusão do serviço
              </p>
            </div>
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Profissionais Verificados</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Prestadores passam por verificação e são avaliados pelos clientes
              </p>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="bg-primary-bg dark:bg-dark-lighter p-4 md:p-8 rounded-xl mx-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Como Funciona</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto">
                  1
                </div>
                <h4 className="text-lg font-semibold text-center text-gray-900 dark:text-white">Publique seu serviço</h4>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Descreva o que precisa ser feito, orçamento e prazo
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto">
                  2
                </div>
                <h4 className="text-lg font-semibold text-center text-gray-900 dark:text-white">Receba propostas</h4>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Profissionais interessados enviarão suas propostas
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto">
                  3
                </div>
                <h4 className="text-lg font-semibold text-center text-gray-900 dark:text-white">Escolha o profissional</h4>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Compare avaliações e preços para escolher o melhor
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto">
                  4
                </div>
                <h4 className="text-lg font-semibold text-center text-gray-900 dark:text-white">Serviço realizado</h4>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Após a conclusão, avalie o profissional e libere o pagamento
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-lighter shadow-lg mt-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">TaskMatch</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} TaskMatch. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}