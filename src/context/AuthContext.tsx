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
    
    

    // Limpar subscriptions ao desmontar
    return () => {
      subscription.unsubscribe();
      
    };
  }, []);

  // Carregar perfil do usuário
  const loadUserProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setProfile(null);
        toast.error('Perfil do usuário não encontrado no banco de dados!');
        return;
      }
      setProfile(data);
    } catch (error) {
      setProfile(null);
      toast.error('Erro ao carregar perfil do usuário!');
    } finally {
      setLoading(false);
    }
  }



  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await authService.login(email, password);
      
      if (error) throw error;
      

      
      // Usuário autenticado com sucesso
      toast.success('Login realizado com sucesso!');

      // Atualizar último login se o perfil estiver carregado
      if (data.user && data.user.id) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
        // Recarregar perfil do banco para garantir dados atualizados
        await loadUserProfile(data.user.id);
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
      const result = await authService.registerUser(email, password, name, 'corretor');
      
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
    
    return false;
  };

  // Verificar se o usuário tem determinada permissão
  const hasPermission = (permission: keyof UserPermissions) => {
    if (!profile) return false;
    
    // Administrador e Coordenador têm todas as permissões
    if (profile.role === 'administrador' || profile.role === 'coordenador') return true;
    
    // Verificar permissão específica no objeto de permissões
    if (profile.permissions && profile.permissions[permission] !== undefined) {
      return !!profile.permissions[permission];
    }
    
    // Permissões padrão baseadas no papel
    // Administrador e Coordenador já retornaram true acima, então agora verificamos Assistente
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
    
    if (profile.role === 'corretor') {
      const corretorPermissions: Record<keyof UserPermissions, boolean> = {
        view_dashboard: true,
        view_loteamentos: true,
        manage_lotes: false,
        manage_users: false,
        view_reports: false,
        manage_reservations: true,
        send_notifications: false,
        use_chat: true
      };
      return corretorPermissions[permission] || false;
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
