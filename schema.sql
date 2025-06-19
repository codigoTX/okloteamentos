-- Schema para o banco de dados do OK Loteamentos no Supabase
-- Para usar este arquivo:
-- 1. Acesse o painel do Supabase (https://app.supabase.io/)
-- 2. Navegue até o SQL Editor
-- 3. Cole este conteúdo e execute

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis (estendendo a tabela auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrador', 'coordenador', 'assistente', 'corretor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  coordenador_id UUID REFERENCES auth.users(id) NULL,
  permissions JSONB DEFAULT '{"view_dashboard": true, "view_loteamentos": true}'
);

-- Função para criar automaticamente um perfil quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'corretor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função após a criação de um novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Tabela de loteamentos
CREATE TABLE IF NOT EXISTS loteamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  endereco TEXT NOT NULL,
  descricao TEXT,
  infraestrutura TEXT[] DEFAULT '{}',
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de lotes
CREATE TABLE IF NOT EXISTS lotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loteamento_id UUID REFERENCES loteamentos(id) ON DELETE CASCADE NOT NULL,
  quadra TEXT NOT NULL,
  numero TEXT NOT NULL,
  area NUMERIC(10, 2) NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('disponivel', 'reservado', 'vendido')) DEFAULT 'disponivel',
  responsavel_id UUID REFERENCES auth.users(id),
  data_reserva TIMESTAMPTZ,
  data_venda TIMESTAMPTZ,
  data_fim_reserva TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (loteamento_id, quadra, numero)
);

-- Tabela de fila de reservas
CREATE TABLE IF NOT EXISTS fila_reservas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lote_id UUID REFERENCES lotes(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  posicao INTEGER NOT NULL,
  data_entrada TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notificado BOOLEAN DEFAULT FALSE,
  UNIQUE (lote_id, usuario_id)
);

-- Tabela de mensagens de chat
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remetente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('reserva', 'venda', 'fila', 'sistema', 'chat')),
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Políticas RLS (Row Level Security) para segurança

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loteamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles

-- Administradores podem ver todos os perfis
CREATE POLICY "Administradores podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
    )
  );

-- Usuários coordenador podem ver perfis relacionados aos seus loteamentos
CREATE POLICY "Gestor pode ver perfis relacionados"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'coordenador'
    )
  );

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (profiles.id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (profiles.id = auth.uid());

-- Políticas para loteamentos

-- Todos podem ver loteamentos ativos
CREATE POLICY "Todos podem ver loteamentos ativos"
  ON loteamentos FOR SELECT
  USING (is_active = TRUE);

-- Apenas administrador pode criar loteamentos
CREATE POLICY "Apenas administrador pode criar loteamentos"
  ON loteamentos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
    )
  );

-- Apenas administrador pode atualizar loteamentos
CREATE POLICY "Apenas administrador pode atualizar loteamentos"
  ON loteamentos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'administrador'
    )
  );

-- Políticas para lotes

-- Todos podem ver lotes
CREATE POLICY "Todos podem ver lotes"
  ON lotes FOR SELECT
  USING (TRUE);

-- Apenas administrador e coordenador podem criar lotes
CREATE POLICY "Apenas administrador e coordenador podem criar lotes"
  ON lotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'master' OR profiles.role = 'coordenador')
    )
  );

-- Corretores podem reservar lotes disponíveis
CREATE POLICY "Corretores podem reservar lotes disponíveis"
  ON lotes FOR UPDATE
  USING (
    status = 'disponivel' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (
        profiles.role = 'corretor' OR 
        profiles.role = 'administrador' OR 
        profiles.role = 'coordenador' OR 
        profiles.role = 'master'
      )
    )
  );

-- Coordenadores e administradores podem gerenciar lotes reservados
CREATE POLICY "Coordenadores e administradores podem gerenciar lotes reservados"
  ON lotes FOR UPDATE
  USING (
    status = 'reservado' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (
        profiles.role = 'administrador' OR 
        profiles.role = 'coordenador' OR 
        profiles.role = 'master'
      )
    )
  );

-- Políticas para fila de reservas

-- Usuários podem ver suas próprias filas
CREATE POLICY "Usuários podem ver suas próprias filas"
  ON fila_reservas FOR SELECT
  USING (
    usuario_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (
        profiles.role = 'administrador' OR 
        profiles.role = 'coordenador' OR 
        profiles.role = 'master'
      )
    )
  );

-- Usuários podem se inscrever em filas
CREATE POLICY "Usuários podem se inscrever em filas"
  ON fila_reservas FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Políticas para mensagens

-- Usuários podem ver mensagens enviadas ou recebidas por eles
CREATE POLICY "Usuários podem ver mensagens relacionadas a eles"
  ON mensagens FOR SELECT
  USING (remetente_id = auth.uid() OR destinatario_id = auth.uid());

-- Usuários podem enviar mensagens
CREATE POLICY "Usuários podem enviar mensagens"
  ON mensagens FOR INSERT
  WITH CHECK (remetente_id = auth.uid());

-- Usuários podem marcar mensagens como lidas
CREATE POLICY "Usuários podem marcar mensagens como lidas"
  ON mensagens FOR UPDATE
  USING (destinatario_id = auth.uid());

-- Políticas para notificações

-- Usuários podem ver suas próprias notificações
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON notificacoes FOR SELECT
  USING (usuario_id = auth.uid());

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "Usuários podem marcar suas notificações como lidas"
  ON notificacoes FOR UPDATE
  USING (usuario_id = auth.uid());

-- Master e coordenadores podem criar notificações para qualquer usuário
CREATE POLICY "Master e coordenadores podem criar notificações"
  ON notificacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'master' OR profiles.role = 'coordenador')
    )
  );

-- Inserir dados iniciais

-- Inserir o usuário master inicial (substitua com seus dados)
-- O usuário deve ser criado pelo auth.signup ou pelo painel do Supabase
-- Após criar o usuário, substitua o ID correto:
/*
INSERT INTO profiles (id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- Substitua pelo ID do usuário criado
  'master@oklotes.com',
  'Administrador Master',
  'master'
);
*/
