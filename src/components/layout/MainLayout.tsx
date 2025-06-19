import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

type MainLayoutProps = {
  children: React.ReactNode;
  userRole: 'administrador' | 'coordenador' | 'assistente' | 'corretor';
  userName: string;
  userEmail?: string; // Adicionando propriedade para o email
  notificationCount: number;
};

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  userRole,
  userName,
  userEmail,
  notificationCount,
}) => {
  // Garantir que o userRole seja tratado corretamente
  console.log('=== ETAPA 3: DADOS NO MAINLAYOUT ===');
  console.log('UserName recebido do DashboardPage:', userName);
  console.log('UserEmail recebido do DashboardPage:', userEmail);
  console.log('UserRole recebido do DashboardPage:', userRole);

  // Converter userRole para um tipo compatível com userRoleKey do Header
  // Isso garante que apenas valores válidos sejam passados
  const getCompatibleRole = (role: 'administrador' | 'coordenador' | 'assistente' | 'corretor'): 'administrador' | 'coordenador' | 'assistente' | 'corretor' => {
    console.log('Convertendo papel:', role);
    switch(role) {
      case 'administrador': return 'administrador';
      case 'coordenador': return 'coordenador';
      case 'assistente': return 'assistente';
      case 'corretor': return 'corretor';
      default:
        console.log('Papel não reconhecido, usando fallback corretor');
        return 'corretor';
    }
  };
  
  // Verificar se o usuário é administrador baseado no nome/email
  const isAdmin = userName?.toLowerCase().includes('admin') || 
                userEmail?.toLowerCase() === 'rst_86@hotmail.com' || 
                userEmail?.toLowerCase()?.includes('@okloteamento');
  
  console.log('Verificando se é administrador:', isAdmin);
  console.log('- Nome contém "admin"?', userName?.toLowerCase().includes('admin'));
  console.log('- Email é rst_86@hotmail.com?', userEmail?.toLowerCase() === 'rst_86@hotmail.com');
  console.log('- Email contém @okloteamento?', userEmail?.toLowerCase()?.includes('@okloteamento'));
  
  // Determinar o papel correto baseado no email/nome
  const correctedRole = isAdmin ? 'administrador' as const : getCompatibleRole(userRole);
  console.log('Papel corrigido (correctedRole):', correctedRole);
  
  // Map user role to a display name
  const roleDisplay = {
    administrador: 'Administrador',
    coordenador: 'Coordenador',
    assistente: 'Assistente',
    corretor: 'Corretor',
  }[correctedRole || 'corretor'];
  
  console.log('Nome do papel para exibição (roleDisplay):', roleDisplay);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar component */}
      <Sidebar userRole={correctedRole} />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden lg:ml-64">
        <Header
          userName={userName}
          userEmail={userEmail}
          userRole={roleDisplay}
          userRoleKey={correctedRole}
          notificationCount={notificationCount}
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
