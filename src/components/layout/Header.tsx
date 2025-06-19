import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BellIcon, SunIcon, MoonIcon, UserCircleIcon } from '@heroicons/react/outline';

type HeaderProps = {
  userName: string;
  userEmail?: string; // Adicionando propriedade para o email
  userRole: string;
  userRoleKey?: 'administrador' | 'coordenador' | 'assistente' | 'corretor' | string;
  userAvatar?: string;
  notificationCount: number;
};

const Header: React.FC<HeaderProps> = ({
  userName,
  userEmail,
  userRole,
  userRoleKey,
  userAvatar,
  notificationCount,
}) => {
  const { signOut } = useAuth();
  console.log('=== ETAPA 4: RECEBENDO DADOS NO HEADER ===');
  console.log('Dados recebidos do MainLayout:');
  console.log('- userName:', userName);
  console.log('- userEmail:', userEmail);
  console.log('- userRole (para exibição):', userRole);
  console.log('- userRoleKey (valor original do papel):', userRoleKey);
  console.log('- notificationCount:', notificationCount);
  console.log('============================================');
  
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    setNotificationsOpen(false);
  };

  // Sample notifications for demo
  const notifications = [
    {
      id: 1,
      title: 'Reserva aprovada',
      message: 'Sua reserva do lote A-12 foi aprovada pelo gestor.',
      time: '5 min atrás',
      read: false,
    },
    {
      id: 2,
      title: 'Nova mensagem',
      message: 'Você recebeu uma nova mensagem de Carlos Silva.',
      time: '1 hora atrás',
      read: false,
    },
    {
      id: 3,
      title: 'Lembrete',
      message: 'A reserva do lote B-07 vence em 24 horas.',
      time: '3 horas atrás',
      read: true,
    },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex flex-1 justify-end">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              {darkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>

            {/* Notifications */}
            <div className="ml-3 relative">
              <button
                onClick={toggleNotifications}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white focus:outline-none"
              >
                <span className="sr-only">Ver notificações</span>
                <BellIcon className="h-6 w-6" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1 divide-y divide-gray-200 dark:divide-gray-700" role="menu" aria-orientation="vertical">
                    <div className="px-4 py-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notificações</h3>
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma notificação no momento.
                      </div>
                    )}
                    <div className="px-4 py-2">
                      <button className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                        Ver todas as notificações
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none"
                >
                  <span className="sr-only">Abrir menu de usuário</span>
                  {userAvatar ? (
                    <img className="h-8 w-8 rounded-full" src={userAvatar} alt="Avatar do usuário" />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-500" />
                  )}
                  <div className="ml-2 hidden md:block">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{userName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{userRole}</div>
                  </div>
                </button>
              </div>

              {/* User menu dropdown */}
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <a
                      href="#perfil"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Meu Perfil
                    </a>
                    <a
                      href="#configuracoes"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Configurações
                    </a>
                    <button
                      onClick={signOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                      type="button"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
