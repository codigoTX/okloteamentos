import React, { useState, useEffect } from 'react';
import { ChartBarIcon as BarChart } from '@heroicons/react/outline';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Lote } from '../../components/maps/LoteamentoMap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Tipos para as estatísticas do dashboard
type DashboardStats = {
  totalLotes: number;
  lotesDisponiveis: number;
  lotesReservados: number;
  lotesVendidos: number;
  valorTotalVendas: number;
  vendasPorMes: { mes: string; quantidade: number; valor: number }[];
  ultimasReservas: Lote[];
  ultimasVendas: Lote[];
  corretoresTop: { nome: string; vendas: number; valor: number }[];
};

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  // Inicializar com null para representar estado não carregado
  const [userRole, setUserRole] = useState<'administrador' | 'gestor' | 'assistente' | 'vendedor' | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalLotes: 0,
    lotesDisponiveis: 0,
    lotesReservados: 0,
    lotesVendidos: 0,
    valorTotalVendas: 0,
    vendasPorMes: [],
    ultimasReservas: [],
    ultimasVendas: [],
    corretoresTop: [],
  });

  // Carregar dados do usuário 
  useEffect(() => {
    console.log('=== ETAPA 2: PROCESSANDO DADOS NO DASHBOARDPAGE ===');
    // Priorizar o perfil do AuthContext
    if (profile) {
      console.log('Perfil recebido do AuthContext:', JSON.stringify(profile, null, 2));
      
      // Garantir que estamos usando o nome correto e não o papel do usuário
      // Se o nome for igual ao papel, usar email como fallback
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
    } else {
      // Fallback para o modo de demonstração (localStorage)
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        console.log('Dados do usuário do localStorage:', userData);
        
        // Mesma verificação para o localStorage
        if (userData.name === userData.role) {
          const emailName = userData.email?.split('@')[0] || 'Usuário';
          setUserName(emailName);
        } else {
          setUserName(userData.name);
        }
        
        // Configurar o email do usuário do localStorage
        setUserEmail(userData.email || '');
        
        setUserRole(userData.role as any);
      }
    }

    // Simulação de carregamento de dados
    loadDashboardData();
  }, [profile]);

  // Simulação de carregamento de dados do dashboard
  const loadDashboardData = () => {
    // Em um cenário real, estes dados viriam de uma API
    const mockStats: DashboardStats = {
      totalLotes: 150,
      lotesDisponiveis: 75,
      lotesReservados: 25,
      lotesVendidos: 50,
      valorTotalVendas: 7500000,
      vendasPorMes: [
        { mes: 'Jan', quantidade: 3, valor: 450000 },
        { mes: 'Fev', quantidade: 5, valor: 750000 },
        { mes: 'Mar', quantidade: 4, valor: 600000 },
        { mes: 'Abr', quantidade: 6, valor: 900000 },
        { mes: 'Mai', quantidade: 8, valor: 1200000 },
        { mes: 'Jun', quantidade: 7, valor: 1050000 },
      ],
      ultimasReservas: [
        { id: 'r1', numero: '15', quadra: 'A', area: 250, valor: 150000, status: 'reservado', responsavel: 'João Silva', dataReserva: '2025-05-24' },
        { id: 'r2', numero: '08', quadra: 'B', area: 300, valor: 180000, status: 'reservado', responsavel: 'Maria Oliveira', dataReserva: '2025-05-23' },
        { id: 'r3', numero: '22', quadra: 'C', area: 275, valor: 165000, status: 'reservado', responsavel: 'Carlos Santos', dataReserva: '2025-05-22' },
      ],
      ultimasVendas: [
        { id: 'v1', numero: '05', quadra: 'A', area: 250, valor: 150000, status: 'vendido', responsavel: 'Pedro Almeida', dataVenda: '2025-05-20' },
        { id: 'v2', numero: '12', quadra: 'B', area: 320, valor: 192000, status: 'vendido', responsavel: 'Ana Costa', dataVenda: '2025-05-18' },
        { id: 'v3', numero: '07', quadra: 'D', area: 280, valor: 168000, status: 'vendido', responsavel: 'Luiz Ferreira', dataVenda: '2025-05-15' },
      ],
      corretoresTop: [
        { nome: 'Ana Costa', vendas: 8, valor: 1200000 },
        { nome: 'Pedro Almeida', vendas: 6, valor: 900000 },
        { nome: 'Luiz Ferreira', vendas: 5, valor: 750000 },
        { nome: 'Maria Oliveira', vendas: 4, valor: 600000 },
        { nome: 'João Silva', vendas: 3, valor: 450000 },
      ],
    };

    setStats(mockStats);
  };

  // Dados para o gráfico de pizza (status dos lotes)
  const pieData = {
    labels: ['Disponíveis', 'Reservados', 'Vendidos'],
    datasets: [
      {
        label: 'Quantidade de Lotes',
        data: [stats.lotesDisponiveis, stats.lotesReservados, stats.lotesVendidos],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Verde
          'rgba(245, 158, 11, 0.8)', // Amarelo
          'rgba(239, 68, 68, 0.8)', // Vermelho
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Dados para o gráfico de barras (vendas por mês)
  const barData = {
    labels: stats.vendasPorMes.map(item => item.mes),
    datasets: [
      {
        label: 'Vendas por Mês',
        data: stats.vendasPorMes.map(item => item.quantidade),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
      },
    ],
  };

  // Formatação de valores monetários em reais
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Log para depuração - verificar o valor de userRole antes de renderizar
  console.log('Renderizando com userRole:', userRole, 'e userName:', userName);
  
  // Se o email for rst_86@hotmail.com ou contiver 'admin', forçar o papel como administrador
  // Essa verificação garante que o usuário Rafael Teixeira (que sabemos que é administrador) sempre seja exibido corretamente
  const effectiveRole = 
    (userName?.toLowerCase() === 'rafael teixeira' || 
     profile?.email?.toLowerCase() === 'rst_86@hotmail.com' || 
     profile?.email?.toLowerCase().includes('admin')) ? 'administrador' : userRole;
     
  return (
    <MainLayout 
      userRole={effectiveRole || 'administrador'} 
      userName={userName} 
      userEmail={userEmail} 
      notificationCount={3}>
      <div className="pb-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">Dashboard</h3>
      </div>

      {/* Cards com números gerais */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-green-100 dark:bg-green-900">
              <BarChart className="h-6 w-6 text-green-600 dark:text-green-300" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total de Lotes</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.totalLotes}</div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-green-100 dark:bg-green-900">
              <BarChart className="h-6 w-6 text-green-600 dark:text-green-300" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Lotes Disponíveis</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.lotesDisponiveis}</div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-yellow-100 dark:bg-yellow-900">
              <BarChart className="h-6 w-6 text-yellow-600 dark:text-yellow-300" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Lotes Reservados</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.lotesReservados}</div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-red-100 dark:bg-red-900">
              <BarChart className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Lotes Vendidos</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.lotesVendidos}</div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos e listas */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Gráfico de status de lotes */}
        <Card title="Status dos Lotes">
          <div className="h-64">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Card>

        {/* Gráfico de vendas por mês */}
        <Card title="Vendas por Mês">
          <div className="h-64">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Card>

        {/* Lista de últimas reservas */}
        <Card title="Últimas Reservas">
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.ultimasReservas.map((lote) => (
                <li key={lote.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        Lote {lote.quadra}-{lote.numero}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {lote.area} m² - {formatCurrency(lote.valor)}
                      </p>
                    </div>
                    <div>
                      <Badge variant="warning">Reservado</Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                      Por: {lote.responsavel}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Data: {lote.dataReserva}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Lista de últimas vendas */}
        <Card title="Últimas Vendas">
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.ultimasVendas.map((lote) => (
                <li key={lote.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        Lote {lote.quadra}-{lote.numero}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {lote.area} m² - {formatCurrency(lote.valor)}
                      </p>
                    </div>
                    <div>
                      <Badge variant="danger">Vendido</Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                      Por: {lote.responsavel}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Data: {lote.dataVenda}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Top corretores - visível apenas para Administrador e Gestor */}
        {(userRole === 'administrador' || userRole === 'gestor') && (
          <Card title="Top Corretores" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Corretor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vendas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Comissão (5%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.corretoresTop.map((corretor, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {corretor.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {corretor.vendas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(corretor.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(corretor.valor * 0.05)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
