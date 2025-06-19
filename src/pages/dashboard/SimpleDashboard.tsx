import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SimpleDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Dashboard Simplificado - OK Loteamentos</h1>
        
        {profile ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Dados do Usuário</h2>
              <p><strong>Nome:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Perfil:</strong> {profile.role}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Navegação</h2>
              <div className="space-y-2">
                <Link to="/loteamentos" className="block p-2 bg-blue-500 text-white rounded text-center">
                  Ver Loteamentos
                </Link>
                <button 
                  onClick={signOut}
                  className="block w-full p-2 bg-red-500 text-white rounded text-center"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            Usuário não autenticado. Por favor, <Link to="/login" className="underline">faça login</Link>.
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboard;
