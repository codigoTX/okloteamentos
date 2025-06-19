import { createClient } from '@supabase/supabase-js';

// Supabase URL e chave anônima
// Para desenvolvimento local, estas variáveis podem ser definidas em um arquivo .env.local
// Para produção, configure estas variáveis no ambiente de hospedagem
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// Criar e exportar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de dados para as tabelas

// Usuários (estendendo o padrão do Supabase Auth)
export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: 'administrador' | 'coordenador' | 'assistente' | 'corretor';
  avatar_url?: string;
  created_at: string;
  is_active?: boolean;
  last_login?: string;
  coordenador_id?: string | null;
  permissions?: UserPermissions;
};

// Permissões de usuário
export type UserPermissions = {
  view_dashboard?: boolean;
  view_loteamentos?: boolean;
  manage_lotes?: boolean;
  manage_users?: boolean;
  view_reports?: boolean;
  manage_reservations?: boolean;
  send_notifications?: boolean;
  use_chat?: boolean;
  // Outras permissões podem ser adicionadas conforme necessário
};

// Loteamentos
export type Loteamento = {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  endereco: string;
  descricao: string;
  infraestrutura: string[];
  imagem_url: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
};

// Lotes
export type Lote = {
  id: string;
  loteamento_id: string;
  quadra: string;
  numero: string;
  area: number;
  valor: number;
  status: 'disponivel' | 'reservado' | 'vendido';
  responsavel_id?: string;
  data_reserva?: string;
  data_venda?: string;
  data_fim_reserva?: string;
  created_at: string;
};

// Fila de Reservas
export type FilaReserva = {
  id: string;
  lote_id: string;
  usuario_id: string;
  posicao: number;
  data_entrada: string;
  notificado: boolean;
};

// Funções de autenticação
export const authService = {
  // Registrar um novo usuário (para o administrador criar novos usuários)
  async registerUser(email: string, password: string, name: string, role: UserProfile['role'], avatar_url?: string | null, coordenador_id?: string | null) {
    // Validação extra para evitar erro 500
    const validRoles = ['administrador', 'coordenador', 'assistente', 'corretor'];
    if (!validRoles.includes(role)) {
      throw new Error(`Role inválido: ${role}. Use apenas: ${validRoles.join(', ')}`);
    }
    // Apenas campos aceitos pelo Supabase Auth
    const user_metadata: Record<string, string> = { name, role };
    if (avatar_url && typeof avatar_url === 'string' && avatar_url.trim() !== '') user_metadata.avatar_url = avatar_url;
    if (coordenador_id && typeof coordenador_id === 'string' && coordenador_id.trim() !== '') user_metadata.coordenador_id = coordenador_id;

    // Log temporário para debug
    console.log('Payload signup Supabase:', { email, password: '***', user_metadata });
    console.log('user_metadata detalhado:', JSON.stringify(user_metadata));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: user_metadata,
      },
    });

    if (error) {
      // Expor mensagem detalhada do erro do Supabase
      throw new Error('Supabase Auth error: ' + (error.message || JSON.stringify(error)));
    }
    return data;
  },

  // Login
  async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};

// Funções para loteamentos
export const loteamentoService = {
  // Obter todos os loteamentos
  async getLoteamentos() {
    const { data, error } = await supabase
      .from('loteamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Loteamento[];
  },

  // Obter um loteamento específico
  async getLoteamento(id: string) {
    const { data, error } = await supabase
      .from('loteamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Loteamento;
  },

  // Criar loteamento (apenas administrador)
  async createLoteamento(loteamento: Omit<Loteamento, 'id' | 'created_at' | 'created_by'>) {
    const user = await authService.getCurrentUser();

    const { data, error } = await supabase
      .from('loteamentos')
      .insert({
        ...loteamento,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Loteamento;
  },

  // Atualizar loteamento
  async updateLoteamento(id: string, loteamento: Partial<Loteamento>) {
    const { data, error } = await supabase
      .from('loteamentos')
      .update(loteamento)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Loteamento;
  },
};

// Vamos manter o código organizado com os serviços separados por funcionalidade

// Funções para lotes
export const loteService = {
  // Obter todos os lotes de um loteamento
  async getLotes(loteamentoId: string) {
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('loteamento_id', loteamentoId)
      .order('quadra')
      .order('numero');

    if (error) throw error;
    return data as Lote[];
  },

  // Obter um lote específico
  async getLote(id: string) {
    const { data, error } = await supabase
      .from('lotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Lote;
  },

  // Reservar lote
  async reservarLote(loteId: string, dataFimReserva: string) {
    const user = await authService.getCurrentUser();

    const { data, error } = await supabase
      .from('lotes')
      .update({
        status: 'reservado',
        responsavel_id: user.id,
        data_reserva: new Date().toISOString(),
        data_fim_reserva: dataFimReserva,
      })
      .eq('id', loteId)
      .eq('status', 'disponivel') // Garantir que o lote esteja disponível
      .select()
      .single();

    if (error) throw error;
    return data as Lote;
  },

  // Cancelar reserva (Coordenador ou Administrador)
  async cancelarReserva(loteId: string) {
    const { data, error } = await supabase
      .from('lotes')
      .update({
        status: 'disponivel',
        responsavel_id: null,
        data_reserva: null,
        data_fim_reserva: null,
      })
      .eq('id', loteId)
      .eq('status', 'reservado') // Garantir que o lote esteja reservado
      .select()
      .single();

    if (error) throw error;
    return data as Lote;
  },

  // Aprovar venda (Coordenador)
  async aprovarVenda(loteId: string) {
    const { data, error } = await supabase
      .from('lotes')
      .update({
        status: 'vendido',
        data_venda: new Date().toISOString(),
      })
      .eq('id', loteId)
      .eq('status', 'reservado') // Garantir que o lote esteja reservado
      .select()
      .single();

    if (error) throw error;
    return data as Lote;
  },

  // Entrar na fila
  async entrarFila(loteId: string) {
    const user = await authService.getCurrentUser();

    // Verificar posição na fila
    const { data: filaAtual, error: erroFila } = await supabase
      .from('fila_reservas')
      .select('posicao')
      .eq('lote_id', loteId)
      .order('posicao', { ascending: false })
      .limit(1);

    if (erroFila) throw erroFila;

    const novaPosicao = filaAtual && filaAtual.length > 0 ? filaAtual[0].posicao + 1 : 1;

    // Inserir na fila
    const { data, error } = await supabase
      .from('fila_reservas')
      .insert({
        lote_id: loteId,
        usuario_id: user.id,
        posicao: novaPosicao,
        data_entrada: new Date().toISOString(),
        notificado: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FilaReserva;
  },
};

// Funções para gerenciamento de usuários
export const userService = {
  // Buscar usuários por papel (role)
  async getUsersByRole(role: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as UserProfile[];
  },
  // Obter perfil do usuário
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },
  
  // Obter todos os usuários (para administrador e Coordenador)
  async getUsers({ showInactive = false }: { showInactive?: boolean } = {}) {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!showInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as UserProfile[];
  },
  
  // Atualizar perfil de usuário
  async updateProfile(id: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  // Criar um novo usuário (administrador e Coordenador podem criar)
  async createUser(email: string, password: string, userData: Omit<UserProfile, 'id' | 'email' | 'created_at'>) {
    // 0. Obter usuário logado para validação de permissão
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) throw new Error('Usuário autenticado não encontrado.');
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    if (profileError || !currentProfile) throw new Error('Perfil do usuário autenticado não encontrado.');

    // 1. Regras de criação de usuário
    // Administrador pode criar qualquer usuário, mas Corretor/Assistente devem ter coordenador_id definido
    // Coordenador só pode criar Corretor/Assistente com coordenador_id igual ao seu próprio id
    // Ninguém pode criar Administrador via app
    if (userData.role === 'administrador') {
      throw new Error('Usuário Administrador só pode ser criado diretamente pelo Supabase Studio.');
    }
    if (currentProfile.role === 'coordenador') {
      if (userData.role === 'coordenador') {
        throw new Error('Coordenador não pode criar outro Coordenador.');
      }
      if (userData.role !== 'corretor' && userData.role !== 'assistente') {
        throw new Error('Coordenador só pode criar usuários do tipo Corretor ou Assistente.');
      }
      // Força o coordenador_id ser o próprio id do coordenador logado
      userData.coordenador_id = currentProfile.id;
    }
    if (currentProfile.role === 'administrador') {
      if ((userData.role === 'corretor' || userData.role === 'assistente') && !userData.coordenador_id) {
        throw new Error('Administrador deve selecionar um Coordenador para criar usuários do tipo Corretor ou Assistente.');
      }
    }
    // (Opcional) Assistente e Corretor nunca podem criar outros usuários via app
    if (currentProfile.role === 'assistente' || currentProfile.role === 'corretor') {
      throw new Error('Você não tem permissão para criar usuários.');
    }
    // 1. Criar o usuário na autenticação
    const authResult = await authService.registerUser(email, password, userData.name, userData.role, userData.avatar_url, userData.coordenador_id);

    if (!authResult.user || !authResult.user.id) {
      throw new Error('Erro ao criar usuário: Supabase Auth não retornou usuário válido.');
    }

    // 2. Aguarde até o perfil ser criado pelo trigger do Supabase
    let profileData = null;
    for (let i = 0; i < 8; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authResult.user?.id)
        .single();
      if (!error && data) {
        profileData = data;
        break;
      }
      await new Promise(res => setTimeout(res, 400));
    }

    // 3. Se achou o perfil, faça o update dos campos extras
    if (profileData) {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: userData.avatar_url,
          coordenador_id: userData.coordenador_id,
          permissions: userData.permissions || undefined,
          is_active: userData.is_active !== undefined ? userData.is_active : true
        })
        .eq('id', authResult.user.id)
        .select();
      if (updateError) throw updateError;
      return (updated && Array.isArray(updated) && updated.length > 0 ? updated[0] : profileData) as UserProfile;
    }

    // 4. Se não achou o perfil, tente inserir manualmente
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authResult.user.id,
        email: email,
        name: userData.name,
        role: userData.role,
        avatar_url: userData.avatar_url || null,
        coordenador_id: userData.coordenador_id || null,
        permissions: userData.permissions || undefined,
        is_active: userData.is_active !== undefined ? userData.is_active : true
      })
      .select();
    if (insertError || !insertData || !Array.isArray(insertData) || insertData.length === 0) {
      throw new Error('Perfil de usuário não encontrado após criação.');
    }
    return insertData[0] as UserProfile;
  },

  // Obter usuários gerenciados por um gestor específico
  async getUsersByCoordenador(gestorId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('coordenador_id', gestorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserProfile[];
  },
  
  // Atualizar as permissões de um usuário
  async updateUserPermissions(userId: string, permissions: UserPermissions) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ permissions })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },
  
  // Suspender/reativar um usuário
  async toggleUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  },
  
  // Resetar senha (enviar email)
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    return true;
  },
  
  // Alterar senha
  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return true;
  },

  // Criação sincronizada (Auth + profiles)
  async createUserSynced(email: string, password: string, userData: Omit<UserProfile, 'id' | 'email' | 'created_at'>) {
    // 1. Cria no Auth
    const authResult = await authService.registerUser(email, password, userData.name, userData.role, userData.avatar_url, userData.coordenador_id);
    if (!authResult.user || !authResult.user.id) {
      throw new Error('Erro ao criar usuário: Supabase Auth não retornou usuário válido.');
    }
    // 2. Cria ou atualiza no profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authResult.user.id,
        email,
        name: userData.name,
        role: userData.role,
        avatar_url: userData.avatar_url || null,
        coordenador_id: userData.coordenador_id || null,
        permissions: userData.permissions || undefined,
        is_active: userData.is_active !== undefined ? userData.is_active : true
      })
      .select()
      .single();
    if (profileError) throw profileError;
    return profile;
  },

  // Edição sincronizada (Auth + profiles)
  async updateUserSynced(userId: string, update: Partial<UserProfile> & { email?: string; password?: string }) {
    // 1. Atualiza no Auth (nome, email ou senha)
    const authUpdate: any = {};
    if (update.email) authUpdate.email = update.email;
    if (update.password) authUpdate.password = update.password;
    if (update.name) authUpdate.data = { ...(authUpdate.data || {}), name: update.name };
    if (update.role) authUpdate.data = { ...(authUpdate.data || {}), role: update.role };
    if (update.avatar_url) authUpdate.data = { ...(authUpdate.data || {}), avatar_url: update.avatar_url };
    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, authUpdate);
      if (authError) throw authError;
    }
    // 2. Atualiza no profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId)
      .select()
      .single();
    if (profileError) throw profileError;
    return profile;
  },

  // Deleção sincronizada (Auth + profiles)
  async deleteUserSynced(userId: string) {
    // 1. Remove do Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
    // 2. Remove do profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;
    return true;
  },
};
