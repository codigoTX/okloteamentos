import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  PencilIcon, 
  TrashIcon, 
  UserAddIcon, 
  ExclamationIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShieldCheckIcon,
  BanIcon,
  CheckCircleIcon
} from '@heroicons/react/outline';
import { useAuth } from '../../context/AuthContext';
import { userService, UserProfile, UserPermissions } from '../../services/supabase';
import toast from 'react-hot-toast';
// Importações corrigidas
import UserFormModal from './UserFormModal';
import PermissionsModal from './PermissionsModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';

const UserManagementPage: React.FC = () => {
  const { session, profile, isRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session?.user && profile) {
      loadUsers();
    }
  }, [session, profile]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let data: UserProfile[] = [];
      
      // Se for Master, carregar todos os usuários
      if (isRole('master')) {
        data = await userService.getUsers();
      } 
      // Se for Gestor, carregar apenas seus usuários
      else if (isRole('gestor') && profile) {
        // Primeiro carrega seus administradores e vendedores
        const managedUsers = await userService.getUsersByGestor(profile.id);
        
        // Adiciona o próprio gestor à lista
        const ownProfile = await userService.getUserProfile(profile.id);
        data = [ownProfile, ...managedUsers];
      }
      
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserModal = (user: UserProfile | null = null) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenPermissionsModal = (user: UserProfile) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };

  const handleClosePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDeleteModal = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    if (!user.id) return;

    try {
      const newStatus = !(user.is_active ?? true);
      await userService.toggleUserStatus(user.id, newStatus);
      
      toast.success(newStatus 
        ? `Usuário ${user.name} reativado com sucesso!` 
        : `Usuário ${user.name} suspenso com sucesso!`
      );
      
      loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (selectedUser) {
        // Atualizar usuário existente
        await userService.updateProfile(selectedUser.id, userData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário com o gestor atual como responsável
        const gestorId = profile?.role === 'gestor' ? profile.id : null;
        
        const defaultPermissions: UserPermissions = {
          view_dashboard: true,
          view_loteamentos: true,
          manage_lotes: userData.role === 'administrador',
          manage_users: false,
          view_reports: userData.role === 'administrador',
          manage_reservations: userData.role === 'administrador' || userData.role === 'vendedor',
          send_notifications: userData.role === 'administrador',
          use_chat: true,
        };
        
        await userService.createUser(userData.email, userData.password, {
          name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url,
          gestor_id: gestorId,
          permissions: defaultPermissions,
          is_active: true
        });
        
        toast.success('Usuário criado com sucesso!');
      }
      
      loadUsers();
      handleCloseUserModal();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  const handleSavePermissions = async (permissions: UserPermissions) => {
    if (!selectedUser) return;
    
    try {
      await userService.updateUserPermissions(selectedUser.id, permissions);
      toast.success(`Permissões de ${selectedUser.name} atualizadas com sucesso!`);
      loadUsers();
      handleClosePermissionsModal();
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      toast.error('Erro ao atualizar permissões do usuário');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Em vez de deletar, desativamos o usuário
      await userService.toggleUserStatus(selectedUser.id, false);
      toast.success(`Usuário ${selectedUser.name} desativado com sucesso!`);
      loadUsers();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
    }
  };

  // Filtrar usuários baseado nas abas e busca
  const filteredUsers = users.filter(user => {
    // Filtro por tab (status)
    if (selectedTab === 'active' && !(user.is_active ?? true)) return false;
    if (selectedTab === 'inactive' && (user.is_active ?? true)) return false;
    
    // Filtro por papel
    if (filterRole && user.role !== filterRole) return false;
    
    // Filtro por termo de busca
    if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Verificar se há um usuário master no localStorage (modo demo)
  const localUser = localStorage.getItem('user');
  let isMasterFromLocalStorage = false;
  
  if (localUser) {
    try {
      const userData = JSON.parse(localUser);
      if (userData.role === 'master') {
        isMasterFromLocalStorage = true;
      }
    } catch (e) {
      console.error('Erro ao ler usuário do localStorage', e);
    }
  }
  
  console.log('Debug permissões:', { 
    profile, 
    isMaster: isRole('master'), 
    isGestor: isRole('gestor'),
    localData: isMasterFromLocalStorage 
  });
  
  // Verificar permissões para acessar esta página
  if (!isRole('master') && !isRole('gestor') && !isMasterFromLocalStorage) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Você não tem permissão para acessar esta página. Entre em contato com um administrador.
              </p>
              <p className="text-sm text-red-700 mt-2">
                Debug: role={profile?.role || 'undefined'}, isMaster={isRole('master').toString()}, isGestor={isRole('gestor').toString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Adicione, edite e gerencie as permissões dos usuários da sua equipe
          </p>
        </div>
        
        <button
          onClick={() => handleOpenUserModal()}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <UserAddIcon className="h-5 w-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              placeholder="Buscar por nome ou email"
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filtrar por Perfil
            </label>
            <select
              id="roleFilter"
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={filterRole || ''}
              onChange={(e) => setFilterRole(e.target.value || null)}
            >
              <option value="">Todos os Perfis</option>
              {isRole('master') && <option value="master">Master</option>}
              <option value="gestor">Gestor</option>
              <option value="administrador">Administrador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setSelectedTab('all')}
              className={`${
                selectedTab === 'all'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedTab('active')}
              className={`${
                selectedTab === 'active'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Ativos
            </button>
            <button
              onClick={() => setSelectedTab('inactive')}
              className={`${
                selectedTab === 'inactive'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Inativos
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${!(user.is_active ?? true) ? 'bg-gray-100 dark:bg-gray-900' : ''}`}>
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
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'administrador' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''} 
                          ${user.role === 'gestor' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''} 
                          ${user.role === 'assistente' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''} 
                          ${user.role === 'vendedor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}`}>
                          {user.role === 'administrador' ? 'Administrador' : ''}
                          {user.role === 'gestor' ? 'Gestor' : ''}
                          {user.role === 'assistente' ? 'Assistente' : ''}
                          {user.role === 'vendedor' ? 'Vendedor' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${(user.is_active ?? true) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {(user.is_active ?? true) ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {/* Botão de Editar */}
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar usuário"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          
                          {/* Botão de Permissões - apenas para administradores e vendedores */}
                          {(user.role === 'administrador' || user.role === 'vendedor') && (
                            <button
                              onClick={() => handleOpenPermissionsModal(user)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Gerenciar permissões"
                            >
                              <ShieldCheckIcon className="h-5 w-5" />
                            </button>
                          )}
                          
                          {/* Botão de Ativar/Desativar - não mostra para Administrador */}
                          {user.role !== 'administrador' && (
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`${(user.is_active ?? true) 
                                ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300' 
                                : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'}`}
                              title={(user.is_active ?? true) ? 'Suspender usuário' : 'Reativar usuário'}
                            >
                              {(user.is_active ?? true) ? (
                                <BanIcon className="h-5 w-5" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          
                          {/* Botão de Excluir - não mostra para Administrador ou próprio usuário */}
                          {user.role !== 'administrador' && user.id !== profile?.id && (
                            <button
                              onClick={() => handleOpenDeleteModal(user)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir usuário"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de criação/edição de usuário */}
      {isUserModalOpen && (
        <UserFormModal
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          onSave={handleSaveUser}
          user={selectedUser}
          currentUserRole={profile?.role || 'vendedor'}
        />
      )}

      {/* Modal de permissões */}
      {isPermissionsModalOpen && selectedUser && (
        <PermissionsModal
          isOpen={isPermissionsModalOpen}
          onClose={handleClosePermissionsModal}
          onSave={handleSavePermissions}
          user={selectedUser}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {isDeleteModalOpen && selectedUser && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteUser}
          title="Remover Usuário"
          message={`Tem certeza que deseja remover o usuário ${selectedUser.name}? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
