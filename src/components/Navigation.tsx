import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Briefcase, User, LogIn, Sun, Moon, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { NotificationBell } from './NotificationBell';

export function Navigation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProvider, setIsProvider] = useState<boolean | null>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  React.useEffect(() => {
    const fetchUserType = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching user type:', error);
            return;
          }

          setIsProvider(data?.user_type === 'provider');
        } catch (err) {
          console.error('Error in user type fetch:', err);
        }
      } else {
        setIsProvider(null);
      }
    };

    fetchUserType();
  }, [user]);

  return (
    <nav className="bg-white dark:bg-dark-lighter shadow-lg transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">TaskMatch</span>
          </Link>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark rounded-lg transition-colors mr-2"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark rounded-lg transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {!isLoginPage && (
              <>
                {user ? (
                  <>
                    <NotificationBell />
                    <Link 
                      to={isProvider ? "/provider/dashboard" : "/profile"} 
                      className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
                    >
                      <User className="h-5 w-5" />
                      <span>Perfil</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Entrar</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && !isLoginPage && (
          <div className="md:hidden border-t border-gray-200 dark:border-dark-border py-4">
            <div className="flex flex-col space-y-4">
              {user ? (
                <Link
                  to={isProvider ? "/provider/dashboard" : "/profile"}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Perfil</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Entrar</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}