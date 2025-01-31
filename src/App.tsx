import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ClientDashboard } from './pages/ClientDashboard';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { Services } from './pages/Services';
import { PublishService } from './pages/PublishService';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-white dark:bg-dark transition-colors">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/new" element={<PublishService />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;