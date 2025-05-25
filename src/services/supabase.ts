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
  role: 'administrador' | 'gestor' | 'assistente' | 'vendedor';
  avatar_url?: string;
  created_at: string;
  is_active?: boolean;
  last_login?: string;
  gestor_id?: string | null;
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
  // Registrar um novo usuário (para o Master criar novos usuários)
  async registerUser(email: string, password: string, name: string, role: UserProfile['role']) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) throw error;
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

  // Criar loteamento (apenas Master)
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

  // Cancelar reserva (Gestor ou Administrador)
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

  // Aprovar venda (Gestor)
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
  
  // Obter todos os usuários (para Master e Gestor)
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

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

  // Criar um novo usuário (Master e Gestor podem criar)
  async createUser(email: string, password: string, userData: Omit<UserProfile, 'id' | 'email' | 'created_at'>) {
    // 1. Criar o usuário na autenticação
    const authResult = await authService.registerUser(email, password, userData.name, userData.role);
    
    // 2. Verificar se o usuário foi criado e retornar os dados
    // O perfil deve ser criado automaticamente pelo trigger no Supabase
    if (authResult.user) {
      // 3. Atualizar campos adicionais que não são definidos no trigger
      const { data, error } = await supabase
        .from('profiles')
        .update({
          avatar_url: userData.avatar_url,
          gestor_id: userData.gestor_id,
          permissions: userData.permissions || undefined,
          is_active: userData.is_active !== undefined ? userData.is_active : true
        })
        .eq('id', authResult.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    }
    
    throw new Error('Erro ao criar usuário');
  },

  // Obter usuários gerenciados por um gestor específico
  async getUsersByGestor(gestorId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('gestor_id', gestorId)
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
};
