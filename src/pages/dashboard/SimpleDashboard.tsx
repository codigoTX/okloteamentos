import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const SimpleDashboard: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
        console.log('Dashboard carregado com sucesso para o usuário:', user.name);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Dashboard Simplificado - OK Loteamentos</h1>
        
        {userData ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Dados do Usuário</h2>
              <p><strong>Nome:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Perfil:</strong> {userData.role}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Navegação</h2>
              <div className="space-y-2">
                <Link to="/loteamentos" className="block p-2 bg-blue-500 text-white rounded text-center">
                  Ver Loteamentos
                </Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
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
