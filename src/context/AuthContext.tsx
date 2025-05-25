import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, authService, UserProfile, UserPermissions } from '../services/supabase';
import { toast } from 'react-hot-toast';

// Tipo para o contexto de autenticação
interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isRole: (role: string) => boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  userIsActive: () => boolean;
  lastLoginTime: Date | null;
};

// Valor padrão para o contexto
const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isRole: () => false,
  hasPermission: () => false,
  userIsActive: () => false,
  lastLoginTime: null
});

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto de autenticação
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    // Obter sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Carregar perfil do usuário
        loadUserProfile(session.user.id);
      } else {
        // Verificar se existe um usuário no localStorage (modo de demonstração)
        const localUser = localStorage.getItem('user');
        if (localUser) {
          try {
            const userData = JSON.parse(localUser);
            setProfile(userData as UserProfile);
          } catch (e) {
            console.error('Erro ao carregar usuário do localStorage:', e);
          }
        }
        setLoading(false);
      }
    });

    // Configurar listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Carregar perfil do usuário
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    
    // Listener para o modo de demonstração
    const handleDemoAuth = (e: CustomEvent) => {
      console.log('Demo auth event recebido:', e.detail);
      if (e.detail && e.detail.profile) {
        setProfile(e.detail.profile as UserProfile);
        setLoading(false);
      }
    };
    
    // Adicionar o listener de evento personalizado
    window.addEventListener('supabase-demo-auth', handleDemoAuth as EventListener);

    // Limpar subscriptions ao desmontar
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('supabase-demo-auth', handleDemoAuth as EventListener);
    };
  }, []);

  // Carregar perfil do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('=== ETAPA 1: BUSCANDO PERFIL DO USUÁRIO NO SUPABASE ===');
      console.log('Buscando perfil para o ID:', userId);
      
      // Tentar obter o email do usuário da autenticação
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      console.log('Email do usuário obtido da autenticação:', userEmail);
      
      // Verificar se o ID corresponde ao email conhecido do master
      if (userEmail === 'rst_86@hotmail.com') {
        console.log('Usuário master identificado pelo email!');
        
        // Se não for possível obter do banco, criar um perfil default para o master
        const masterProfile: UserProfile = {
          id: userId,
          email: userEmail,
          name: 'Rafael Teixeira',
          role: 'administrador',
          created_at: new Date().toISOString(),
          is_active: true
        };
        
        console.log('=== ETAPA 1: CRIANDO PERFIL MASTER DE EMERGÊNCIA ===');
        console.log('Perfil completo:', JSON.stringify(masterProfile, null, 2));
        setProfile(masterProfile);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        
        // Se o usuário for reconhecido pelo email, evitar o modo de demonstração
        if (userEmail) {
          // Criar um perfil básico com o papel correto baseado no email
          const defaultRole = userEmail.includes('admin') ? 'administrador' :
                            userEmail.includes('gestor') ? 'gestor' :
                            userEmail.includes('assist') ? 'assistente' : 'vendedor';
                            
          const defaultProfile: UserProfile = {
            id: userId,
            email: userEmail,
            name: userEmail.split('@')[0],
            role: defaultRole,
            created_at: new Date().toISOString(),
            is_active: true
          };
          
          console.log('Criando perfil default baseado no email:', defaultProfile);
          setProfile(defaultProfile);
        }
        setLoading(false);
        return;
      }

      if (data) {
        console.log('=== ETAPA 1: DADOS RECEBIDOS DO SUPABASE ===');
        console.log('Perfil completo:', JSON.stringify(data, null, 2));
        console.log('ID do usuário:', data.id);
        console.log('Email do usuário:', data.email);
        console.log('Nome do usuário:', data.name);
        console.log('Role do usuário:', data.role);
        console.log('============================================');
        
        setProfile(data as UserProfile);
        console.log('Perfil definido no estado do AuthContext');
      } else {
        console.error('Perfil não encontrado para o usuário:', userId);
        
        // Se o usuário for reconhecido pelo email, criar um perfil default
        if (userEmail) {
          // Mesmo código de tratamento acima para criar um perfil padrão
          const defaultRole: 'administrador' | 'gestor' | 'assistente' | 'vendedor' = 
                            userEmail.includes('admin') ? 'administrador' :
                            userEmail.includes('gestor') ? 'gestor' :
                            userEmail.includes('assist') ? 'assistente' : 'vendedor';
                            
          const defaultProfile: UserProfile = {
            id: userId,
            email: userEmail,
            name: userEmail.split('@')[0],
            role: defaultRole,
            created_at: new Date().toISOString(),
            is_active: true
          };
          
          console.log('Perfil não encontrado. Criando perfil default baseado no email:', defaultProfile);
          setProfile(defaultProfile);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await authService.login(email, password);
      
      if (error) throw error;
      
      // Verificar se é o usuário master baseado no email
      if (email.toLowerCase().includes('master') || email.toLowerCase() === 'admin@okloteamento.com') {
        console.log('Login detectado como usuário master');
        // Forçar atualização do papel para master se for o email de admin
        if (data.user) {
          await supabase
            .from('profiles')
            .update({ role: 'master' })
            .eq('id', data.user.id);
        }
      }
      
      // Usuário autenticado com sucesso
      toast.success('Login realizado com sucesso!');

      // Atualizar último login se o perfil estiver carregado
      if (profile && profile.id) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', profile.id);
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função de registro
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const result = await authService.registerUser(email, password, name, 'vendedor');
      
      // Usuário registrado com sucesso
      toast.success('Registro realizado com sucesso! Verifique seu email.');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast.error(error.message || 'Erro ao registrar conta. Tente novamente.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.logout();
      
      // Limpar dados do usuário
      setProfile(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast.error(error.message || 'Erro ao fazer logout.');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário tem determinado papel
  const isRole = (role: string) => {
    // Primeiro verificar o perfil no estado atual
    if (profile && profile.role === 'administrador') return true;
    if (profile && profile.role === role) return true;
    
    // Se não temos um perfil no estado, verificar o localStorage (modo de demonstração)
    try {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const userData = JSON.parse(localUser);
        if (userData.role === 'master') return true;
        if (userData.role === role) return true;
      }
    } catch (e) {
      console.error('Erro ao verificar papel do usuário:', e);
    }
    
    return false;
  };

  // Verificar se o usuário tem determinada permissão
  const hasPermission = (permission: keyof UserPermissions) => {
    if (!profile) return false;
    
    // Administrador e Gestor têm todas as permissões
    if (profile.role === 'administrador' || profile.role === 'gestor') return true;
    
    // Verificar permissão específica no objeto de permissões
    if (profile.permissions && profile.permissions[permission] !== undefined) {
      return !!profile.permissions[permission];
    }
    
    // Permissões padrão baseadas no papel
    // Administrador e Gestor já retornaram true acima, então agora verificamos Assistente
    if (profile.role === 'assistente') {
      const assistentePermissions: Record<keyof UserPermissions, boolean> = {
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: true,
        manage_users: false,
        view_reports: true,
        send_notifications: true,
        manage_reservations: true,
        use_chat: true
      };
      return assistentePermissions[permission];
    }
    
    // O papel 'administrador' já foi verificado acima e tem todas as permissões
    
    if (profile.role === 'vendedor') {
      const vendedorPermissions: Record<keyof UserPermissions, boolean> = {
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: false,
        manage_users: false,
        view_reports: false,
        manage_reservations: true,
        send_notifications: false,
        use_chat: true
      };
      return vendedorPermissions[permission] || false;
    }
    
    return false;
  };
  
  // Verificar se o usuário está ativo
  const userIsActive = () => {
    if (!profile) return false;
    return profile.is_active ?? true; // Por padrão, consideramos ativo se não for especificado
  };
  
  // Obter a data do último login
  const lastLoginTime = profile?.last_login ? new Date(profile.last_login) : null;

  // Valor do contexto
  const value = {
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isRole,
    hasPermission,
    userIsActive,
    lastLoginTime,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
