import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  HomeIcon, 
  UsersIcon, 
  MapIcon, 
  ChatIcon, 
  CogIcon,
  ChartBarIcon,
  LogoutIcon,
  MenuIcon,
  XIcon
} from '@heroicons/react/outline';
import SidebarUserDropdown from './SidebarUserDropdown';

type SidebarProps = {
  userRole: 'administrador' | 'coordenador' | 'assistente' | 'corretor';
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Define menu items based on user role
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['administrador', 'coordenador', 'assistente', 'corretor'] },
    { name: 'Loteamentos', href: '/loteamentos', icon: MapIcon, roles: ['administrador', 'coordenador', 'assistente', 'corretor'] },
    { name: 'Gerenciar Usuários', href: '/usuarios', icon: UsersIcon, roles: ['administrador', 'coordenador'] },
    { name: 'Mensagens', href: '/chat', icon: ChatIcon, roles: ['administrador', 'coordenador', 'assistente', 'corretor'] },
    { name: 'Relatórios', href: '/relatorios', icon: ChartBarIcon, roles: ['administrador', 'coordenador'] },
    { name: 'Configurações', href: '/configuracoes', icon: CogIcon, roles: ['administrador', 'coordenador'] },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success('Sessão encerrada com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao encerrar sessão');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-500 hover:text-white hover:bg-primary-500 focus:outline-none"
        >
          {mobileMenuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar for desktop and mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-10 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700 border-gray-200">
          <div className="flex items-center">
            {!collapsed && (
              <span className="text-xl font-semibold text-primary-600">OK Loteamentos</span>
            )}
            {collapsed && (
              <span className="text-xl font-semibold text-primary-600">OK</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SidebarUserDropdown />
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white focus:outline-none hidden lg:block"
            >
              {collapsed ? (
                <MenuIcon className="h-6 w-6" />
              ) : (
                <XIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
                      isActive
                        ? 'text-primary-500 dark:text-white'
                        : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>


      </aside>
    </>
  );
};

export default Sidebar;
