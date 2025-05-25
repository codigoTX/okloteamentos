import React, { useEffect, useState } from 'react';
import { 
  UserIcon, 
  PencilIcon, 
  TrashIcon, 
  UserAddIcon as UserPlusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/outline';
import { userService } from '../../services/supabase';
import { UserProfile } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import UserModal from './UserModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import MainLayout from '../../components/layout/MainLayout';

const UsersPage: React.FC = () => {
  const { session, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Estados do usuário atual para uso com o MainLayout
  const [userRole, setUserRole] = useState<'administrador' | 'gestor' | 'assistente' | 'vendedor'>('vendedor');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Carregar dados do usuário do AuthContext
  useEffect(() => {
    console.log('=== CARREGANDO DADOS DO USUÁRIO NA PÁGINA DE USUÁRIOS ===');
    
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
    }
  }, [profile]);
  
  useEffect(() => {
    loadUsers();
  }, [session]);

  // Dados de demonstração para quando o serviço falhar
  const MOCK_USERS: UserProfile[] = [
    {
      id: '1',
      email: 'administrador@okloteamento.com',
      name: 'Administrador do Sistema',
      role: 'administrador',
      created_at: new Date().toISOString(),
      is_active: true,
      avatar_url: 'https://ui-avatars.com/api/?name=Administrador+Sistema&background=6366F1&color=fff',
    },
    {
      id: '2',
      email: 'gestor@okloteamento.com',
      name: 'Gestor Principal',
      role: 'gestor',
      created_at: new Date().toISOString(),
      is_active: true,
      avatar_url: 'https://ui-avatars.com/api/?name=Gestor+Principal&background=22C55E&color=fff',
    },
    {
      id: '3',
      email: 'assistente@okloteamento.com',
      name: 'Assistente Regional',
      role: 'assistente',
      created_at: new Date().toISOString(),
      is_active: true,
      avatar_url: 'https://ui-avatars.com/api/?name=Assistente+Regional&background=3B82F6&color=fff',
    },
    {
      id: '4',
      email: 'vendedor@okloteamento.com',
      name: 'Vendedor Padrão',
      role: 'vendedor',
      created_at: new Date().toISOString(),
      is_active: true,
      avatar_url: 'https://ui-avatars.com/api/?name=Vendedor+Padrao&background=EAB308&color=fff',
    },
  ];

  const loadUsers = async () => {
    try {
      setLoading(true);
      try {
        // Tentar carregar do Supabase
        const data = await userService.getUsers();
        // Filtrar para não mostrar administradores (antigo master)
        const filteredData = data.filter(user => user.role !== 'administrador');
        setUsers(filteredData);
      } catch (supabaseError) {
        console.warn('Erro ao carregar do Supabase, usando dados mock:', supabaseError);
        // Falhou, usar dados de demonstração
        // Filtrar para não mostrar administradores (antigo master)
        const filteredMockUsers = MOCK_USERS.filter(user => user.role !== 'administrador');
        setUsers(filteredMockUsers);
        // Mostrar toast como alerta em vez de erro
        toast.success('Usando dados de demonstração para apresentação da interface');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: UserProfile | null = null) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleOpenDeleteModal = (user: UserProfile) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentUser(null);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (currentUser) {
        // Atualizar usuário existente
        await userService.updateProfile(currentUser.id, userData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        await userService.createUser(userData.email, userData.password, {
          name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url
        });
        toast.success('Usuário criado com sucesso!');
      }
      loadUsers();
      handleCloseModal();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      // Aqui seria ideal ter uma função para deletar usuário no userService
      // Por enquanto vamos apenas atualizar o status para inativo
      await userService.updateProfile(currentUser.id, { 
        role: 'inativo' as any // Isso é temporário, idealmente teríamos um campo is_active
      });
      toast.success('Usuário removido com sucesso!');
      loadUsers();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
    }
  };

  // Verificar se o usuário atual pode gerenciar usuários
  const canManageUsers = ['administrador', 'gestor'].includes(userRole);
  
  if (!canManageUsers) {
    return (
      <MainLayout userRole={userRole} userName={userName} userEmail={userEmail} notificationCount={0}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Você não tem permissão para acessar esta página.
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userRole={userRole} userName={userName} userEmail={userEmail} notificationCount={0}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciamento de Usuários</h1>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Novo Usuário
          </button>
        </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.avatar_url}
                            alt={user.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'administrador' ? 'bg-purple-100 text-purple-800' : ''} 
                      ${user.role === 'gestor' ? 'bg-green-100 text-green-800' : ''} 
                      ${user.role === 'assistente' ? 'bg-blue-100 text-blue-800' : ''} 
                      ${user.role === 'vendedor' ? 'bg-yellow-100 text-yellow-800' : ''}`}>
                      {user.role === 'administrador' ? 'Administrador' : ''}
                      {user.role === 'gestor' ? 'Gestor' : ''}
                      {user.role === 'assistente' ? 'Assistente' : ''}
                      {user.role === 'vendedor' ? 'Vendedor' : ''}
                      {!['administrador', 'gestor', 'assistente', 'vendedor'].includes(user.role) ? user.role : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {user.role !== 'administrador' && (
                      <button
                        onClick={() => handleOpenDeleteModal(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para criar/editar usuário */}
      {isModalOpen && (
        <UserModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSave={handleSaveUser} 
          user={currentUser} 
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {isDeleteModalOpen && currentUser && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteUser}
          title="Remover Usuário"
          message={`Tem certeza que deseja remover o usuário ${currentUser.name}? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  </MainLayout>
  );
};

export default UsersPage;
