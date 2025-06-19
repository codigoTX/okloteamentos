import React, { useState, useEffect } from 'react';
import { PlusIcon, SearchIcon } from '@heroicons/react/outline';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

import { loteamentoService } from '../../services/supabase';

const LoteamentosPage: React.FC = () => {
  const { profile, loading } = useAuth();
  const [userRole, setUserRole] = useState<'administrador' | 'coordenador' | 'assistente' | 'corretor'>('corretor');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loteamentos, setLoteamentos] = useState<any[]>([]);
  const [loadingLoteamentos, setLoadingLoteamentos] = useState(true);

  useEffect(() => {
    async function fetchLoteamentos() {
      setLoadingLoteamentos(true);
      try {
        const data = await loteamentoService.getLoteamentos();
        setLoteamentos(data || []);
      } catch (err) {
        setLoteamentos([]);
      } finally {
        setLoadingLoteamentos(false);
      }
    }
    fetchLoteamentos();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados do usuário do AuthContext
  useEffect(() => {
    console.log('=== CARREGANDO DADOS DO USUÁRIO NA PÁGINA DE LOTEAMENTOS ===');
    
    // Priorizar o perfil do AuthContext
    if (profile) {
      console.log('Perfil recebido do AuthContext:', JSON.stringify(profile, null, 2));
      
      // Garantir que estamos usando o nome correto e não o papel do usuário
      if (profile.name === profile.role) {
        // O nome está incorreto, usar email como nome
        const emailName = profile.email?.split('@')[0] || 'Usuário';
        console.log('Nome igual ao papel, usando parte do email como nome:', emailName);
        setUserName(emailName);
      } else {
        console.log('Usando nome do perfil:', profile.name);
        setUserName(profile.name);
      }
      
      // Configurar o email do usuário
      console.log('Definindo email do usuário:', profile.email);
      setUserEmail(profile.email || '');
      
      console.log('Definindo papel do usuário:', profile.role);
      setUserRole(profile.role as any);
    } else if (!loading) {
      // Fallback para o modo de demonstração (localStorage) apenas se não estiver carregando
      console.log('Perfil não encontrado no AuthContext, tentando localStorage');
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserName(userData.name);
        setUserRole(userData.role as any);
      }
    }
  }, [profile, loading]);

  // Filtrar loteamentos pelo termo de busca
  const filteredLoteamentos = loteamentos.filter(
    (loteamento) =>
      loteamento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loteamento.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loteamento.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout userRole={userRole} userName={userName} userEmail={userEmail} notificationCount={3}>
      <div className="pb-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">Loteamentos</h3>
        
        {/* Botão para adicionar novo loteamento - visível apenas para Administrador */}
        {userRole === 'administrador' && (
          <Button
            variant="primary"
            size="md"
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Novo Loteamento
          </Button>
        )}
      </div>

      {/* Barra de busca */}
      <div className="mt-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Buscar loteamentos por nome, cidade ou estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de loteamentos */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredLoteamentos.length > 0 ? (
          filteredLoteamentos.map((loteamento) => (
            <Card key={loteamento.id} className="overflow-hidden flex flex-col">
              <div className="relative">
                <img
                  src={loteamento.imagem}
                  alt={loteamento.nome}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <h3 className="text-xl font-semibold text-white">{loteamento.nome}</h3>
                  <p className="text-sm text-gray-200">
                    {loteamento.cidade}, {loteamento.estado}
                  </p>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total de Lotes</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{loteamento.totalLotes}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Disponíveis</span>
                    <p className="text-lg font-semibold text-green-600">{loteamento.disponiveis}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 mb-4">
                  <Badge variant="success">
                    {loteamento.disponiveis} Disponíveis
                  </Badge>
                  <Badge variant="warning">
                    {loteamento.reservados} Reservados
                  </Badge>
                  <Badge variant="danger">
                    {loteamento.vendidos} Vendidos
                  </Badge>
                </div>
                
                <Button variant="primary" fullWidth>
                  Ver Loteamento
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum loteamento encontrado com o termo "{searchTerm}".
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LoteamentosPage;
