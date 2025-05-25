import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Páginas de autenticação
import LoginPage from './pages/auth/LoginPage';

// Páginas principais
import DashboardPage from './pages/dashboard/DashboardPage';
import SimpleDashboard from './pages/dashboard/SimpleDashboard';
import LoteamentosPage from './pages/loteamentos/LoteamentosPage';
import UsersPage from './pages/users/UsersPage';
import UserManagementPage from './pages/users/UserManagementPage';
import DetalhesLoteamentoPage from './pages/loteamentos/DetalhesLoteamentoPage';

// Componente de proteção de rotas
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  // Se o usuário não estiver autenticado, redirecionar para a página de login
  return session ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="bottom-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Duração das notificações (5 segundos)
            duration: 5000,
            // Estilo para todas as notificações
            style: {
              background: '#363636',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
            },
            // Notificações de sucesso
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
              style: {
                background: '#22c55e',
              },
            },
            // Notificações de erro
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rotas protegidas */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
          />
          <Route 
            path="/simple-dashboard" 
            element={<ProtectedRoute><SimpleDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/loteamentos" 
            element={<ProtectedRoute><LoteamentosPage /></ProtectedRoute>} 
          />
          <Route 
            path="/loteamentos/:id" 
            element={<ProtectedRoute><DetalhesLoteamentoPage /></ProtectedRoute>} 
          />
          <Route 
            path="/usuarios" 
            element={<ProtectedRoute><UsersPage /></ProtectedRoute>} 
          />
          <Route 
            path="/gerenciar-usuarios" 
            element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} 
          />
          
          {/* Rota padrão - redireciona para o login ou dashboard */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
