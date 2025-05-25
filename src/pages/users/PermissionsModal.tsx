import React, { useState, useEffect } from 'react';
import { XIcon, ShieldCheckIcon } from '@heroicons/react/outline';
import { UserProfile, UserPermissions } from '../../services/supabase';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: UserPermissions) => void;
  user: UserProfile;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  user 
}) => {
  const defaultPermissions: UserPermissions = {
    view_dashboard: true,
    view_loteamentos: true,
    manage_lotes: false,
    manage_users: false,
    view_reports: false,
    manage_reservations: true,
    send_notifications: false,
    use_chat: true,
  };

  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  useEffect(() => {
    if (user && user.permissions) {
      setPermissions(user.permissions as UserPermissions);
      setSelectedPreset('custom'); // Reset to custom when loading existing permissions
    } else {
      // Definir permissões padrão baseado no papel do usuário
      if (user.role === 'administrador') {
        setPermissions({
          view_dashboard: true,
          view_loteamentos: true,
          manage_lotes: true,
          manage_users: false,
          view_reports: true,
          manage_reservations: true,
          send_notifications: true,
          use_chat: true,
        });
        setSelectedPreset('administrador');
      } else if (user.role === 'vendedor') {
        setPermissions({
          view_dashboard: true,
          view_loteamentos: true,
          manage_lotes: false,
          manage_users: false,
          view_reports: false,
          manage_reservations: true,
          send_notifications: false,
          use_chat: true,
        });
        setSelectedPreset('vendedor');
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPermissions((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setSelectedPreset('custom'); // Change to custom when manually modifying permissions
  };

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    
    if (preset === 'administrador') {
      setPermissions({
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: true,
        manage_users: false,
        view_reports: true,
        manage_reservations: true,
        send_notifications: true,
        use_chat: true,
      });
    } else if (preset === 'vendedor') {
      setPermissions({
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: false,
        manage_users: false,
        view_reports: false,
        manage_reservations: true,
        send_notifications: false,
        use_chat: true,
      });
    } else if (preset === 'restrito') {
      setPermissions({
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: false,
        manage_users: false,
        view_reports: false,
        manage_reservations: false,
        send_notifications: false,
        use_chat: true,
      });
    } else if (preset === 'todos') {
      setPermissions({
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: true,
        manage_users: true,
        view_reports: true,
        manage_reservations: true,
        send_notifications: true,
        use_chat: true,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(permissions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Permissões de {user.name}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Perfil de Permissões
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => applyPreset('administrador')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${
                    selectedPreset === 'administrador'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  Administrador
                </button>
                
                <button
                  type="button"
                  onClick={() => applyPreset('vendedor')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${
                    selectedPreset === 'vendedor'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  Vendedor
                </button>
                
                <button
                  type="button"
                  onClick={() => applyPreset('restrito')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${
                    selectedPreset === 'restrito'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  Restrito
                </button>
                
                <button
                  type="button"
                  onClick={() => applyPreset('todos')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${
                    selectedPreset === 'todos'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  Acesso Total
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Permissões Personalizadas
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="view_dashboard"
                    name="view_dashboard"
                    type="checkbox"
                    checked={permissions.view_dashboard}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="view_dashboard" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visualizar Dashboard
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="view_loteamentos"
                    name="view_loteamentos"
                    type="checkbox"
                    checked={permissions.view_loteamentos}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="view_loteamentos" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visualizar Loteamentos
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="manage_lotes"
                    name="manage_lotes"
                    type="checkbox"
                    checked={permissions.manage_lotes}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="manage_lotes" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gerenciar Lotes (editar, atualizar status)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="manage_users"
                    name="manage_users"
                    type="checkbox"
                    checked={permissions.manage_users}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="manage_users" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gerenciar Usuários (apenas administradores)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="view_reports"
                    name="view_reports"
                    type="checkbox"
                    checked={permissions.view_reports}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="view_reports" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Visualizar Relatórios
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="manage_reservations"
                    name="manage_reservations"
                    type="checkbox"
                    checked={permissions.manage_reservations}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="manage_reservations" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gerenciar Reservas e Vendas
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="send_notifications"
                    name="send_notifications"
                    type="checkbox"
                    checked={permissions.send_notifications}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="send_notifications" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enviar Notificações
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="use_chat"
                    name="use_chat"
                    type="checkbox"
                    checked={permissions.use_chat}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="use_chat" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usar Chat Interno
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Salvar Permissões
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;
