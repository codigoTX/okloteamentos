import React, { useState, useEffect } from 'react';
import { ChartBarIcon as BarChart } from '@heroicons/react/outline';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Lote } from '../../components/maps/LoteamentoMap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { loteamentoService, loteService, userService } from '../../services/supabase';

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
  // Inicializar com string vazia para garantir que só dados reais do banco sejam usados
  const [userRole, setUserRole] = useState<'administrador' | 'coordenador' | 'assistente' | 'corretor'>('corretor');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
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

    // Carregar dados reais do dashboard
    loadDashboardStats();
  }, [profile]);

  // Função para buscar dados reais do dashboard
  const loadDashboardStats = async () => {
    try {
      // Buscar todos os loteamentos ativos
      const loteamentos = await loteamentoService.getLoteamentos();
      let totalLotes = 0;
      let lotesDisponiveis = 0;
      let lotesReservados = 0;
      let lotesVendidos = 0;
      let valorTotalVendas = 0;
      let vendasPorMes: { mes: string; quantidade: number; valor: number }[] = [];
      let ultimasReservas: Lote[] = [];
      let ultimasVendas: Lote[] = [];
      let corretoresTop: { nome: string; vendas: number; valor: number }[] = [];

      // Buscar todos os lotes de todos os loteamentos
      let todosLotes: Lote[] = [];
      for (const loteamento of loteamentos) {
        const lotes = await loteService.getLotes(loteamento.id);
        todosLotes = todosLotes.concat(lotes);
      }

      totalLotes = todosLotes.length;
      lotesDisponiveis = todosLotes.filter(l => l.status === 'disponivel').length;
      lotesReservados = todosLotes.filter(l => l.status === 'reservado').length;
      lotesVendidos = todosLotes.filter(l => l.status === 'vendido').length;
      valorTotalVendas = todosLotes.filter(l => l.status === 'vendido').reduce((acc, l) => acc + (l.valor || 0), 0);

      // Vendas por mês (últimos 6 meses)
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const vendasAgrupadas: { [key: string]: { quantidade: number; valor: number } } = {};
      const agora = new Date();
      for (const lote of todosLotes) {
        if (lote.status === 'vendido' && lote.data_venda) {
          const data = new Date(lote.data_venda);
          const mes = meses[data.getMonth()];
          const ano = data.getFullYear();
          const chave = `${mes}/${ano}`;
          if (!vendasAgrupadas[chave]) vendasAgrupadas[chave] = { quantidade: 0, valor: 0 };
          vendasAgrupadas[chave].quantidade += 1;
          vendasAgrupadas[chave].valor += lote.valor || 0;
        }
      }
      vendasPorMes = Object.entries(vendasAgrupadas)
        .sort((a, b) => {
          const [mesA, anoA] = a[0].split('/');
          const [mesB, anoB] = b[0].split('/');
          if (anoA !== anoB) return Number(anoA) - Number(anoB);
          return meses.indexOf(mesA) - meses.indexOf(mesB);
        })
        .map(([mesAno, dados]) => ({ mes: mesAno, quantidade: dados.quantidade, valor: dados.valor }));

      // Últimas reservas e vendas
      ultimasReservas = todosLotes
        .filter(l => l.status === 'reservado' && l.dataReserva)
        .sort((a, b) => (b.dataReserva || '').localeCompare(a.dataReserva || ''))
        .slice(0, 3)
        .map(l => ({ ...l, responsavel: l.responsavel || 'N/A', dataReserva: l.dataReserva }));
      ultimasVendas = todosLotes
        .filter(l => l.status === 'vendido' && l.dataVenda)
        .sort((a, b) => (b.dataVenda || '').localeCompare(a.dataVenda || ''))
        .slice(0, 3)
        .map(l => ({ ...l, responsavel: l.responsavel || 'N/A', dataVenda: l.dataVenda }));

      // Top corretores (por vendas)
      const corretoresMap: { [nome: string]: { vendas: number; valor: number } } = {};
      for (const lote of todosLotes) {
        if (lote.status === 'vendido' && lote.responsavel) {
          if (!corretoresMap[lote.responsavel]) corretoresMap[lote.responsavel] = { vendas: 0, valor: 0 };
          corretoresMap[lote.responsavel].vendas += 1;
          corretoresMap[lote.responsavel].valor += lote.valor || 0;
        }
      }
      // Buscar nomes dos corretores
      const corretoresIds = Object.keys(corretoresMap);
      let corretoresPerfis: { id: string; name: string }[] = [];
      if (corretoresIds.length > 0) {
        const todosUsuarios = await userService.getUsers({ showInactive: true });
        corretoresPerfis = todosUsuarios
          .filter((u: any) => corretoresIds.includes(u.id))
          .map((u: any) => ({ id: u.id, name: u.name }));
      }
      corretoresTop = corretoresIds.map(id => ({
        nome: corretoresPerfis.find(c => c.id === id)?.name || id,
        vendas: corretoresMap[id].vendas,
        valor: corretoresMap[id].valor,
      })).sort((a, b) => b.vendas - a.vendas).slice(0, 5);

      setStats({
        totalLotes,
        lotesDisponiveis,
        lotesReservados,
        lotesVendidos,
        valorTotalVendas,
        vendasPorMes,
        ultimasReservas,
        ultimasVendas,
        corretoresTop,
      });
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    }
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
  // Função utilitária para garantir apenas roles válidos
  const allowedRoles = ['administrador', 'coordenador', 'assistente', 'corretor'] as const;
  const effectiveRole = allowedRoles.includes(userRole as any) ? userRole : 'administrador';

  return (
    <MainLayout 
      userRole={effectiveRole as 'administrador' | 'coordenador' | 'assistente' | 'corretor'}
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
        <Card title="Vendas por Mês">
          <div className="h-64">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Card>
        <Card title="Últimas Vendas">
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
        </Card>
      </div>
      {/* Top corretores - visível apenas para Administrador e Coordenador */}
      {(userRole === 'administrador' || userRole === 'coordenador') && (
        <Card title="Top Corretores">
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
    </MainLayout>
  );
};

export default DashboardPage;
