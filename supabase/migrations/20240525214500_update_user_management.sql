-- Atualização do gerenciamento de usuários e políticas de segurança

-- Atualizar a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_permissions JSONB;
  user_coordenador_id UUID;
  user_avatar_url TEXT;
  user_exists BOOLEAN;
  user_name TEXT;
BEGIN
  -- Definir um nome padrão baseado no email se não fornecido
  user_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );
  
  -- Definir função padrão se não fornecida
  user_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    'corretor' -- função padrão
  );
  
  -- Extrair permissões e outros metadados
  user_permissions := COALESCE(
    (NEW.raw_user_meta_data->'permissions')::jsonb,
    '{"view_dashboard": true, "view_loteamentos": true}'::jsonb
  );
  
  user_coordenador_id := NULLIF(NEW.raw_user_meta_data->>'coordenador_id', '')::UUID;
  user_avatar_url := NULLIF(NEW.raw_user_meta_data->>'avatar_url', '');
  
  -- Verificar se o usuário já tem um perfil
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO user_exists;
  
  -- Se já existe, atualizar em vez de inserir
  IF user_exists THEN
    -- Atualizar o perfil existente
    UPDATE public.profiles
    SET 
      email = NEW.email,
      name = user_name,
      role = user_role,
      avatar_url = user_avatar_url,
      coordenador_id = user_coordenador_id,
      permissions = user_permissions,
      is_active = TRUE,
      last_login = NOW()
    WHERE id = NEW.id;
  ELSE
    -- Inserir o perfil com todos os campos necessários
    INSERT INTO public.profiles (
      id, 
      email, 
      name, 
      role, 
      avatar_url, 
      coordenador_id, 
      permissions,
      is_active,
      created_at,
      last_login
    )
    VALUES (
      NEW.id,
      NEW.email,
      user_name,
      user_role,
      user_avatar_url,
      user_coordenador_id,
      user_permissions,
      TRUE,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro para debug
  RAISE WARNING 'Erro ao criar/atualizar perfil do usuário %: %', NEW.id, SQLERRM;
  
  -- Tenta retornar o usuário mesmo em caso de erro para não quebrar o fluxo de autenticação
  -- Mas garante que os campos obrigatórios estejam presentes
  BEGIN
    INSERT INTO public.profiles (id, email, name, role, is_active, created_at, last_login)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'corretor'),
      TRUE,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Se houver erro na inserção de fallback, apenas registra
    RAISE WARNING 'Falha ao criar perfil de fallback para o usuário %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar funções auxiliares para verificação de papéis
CREATE OR REPLACE FUNCTION public.is_role(role_name text)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Usar auth.jwt() para evitar consulta recursiva a auth.users
  SELECT (current_setting('request.jwt.claims', true)::json->>'user_metadata'->>'role')::text 
  INTO user_role;
  
  RETURN user_role = role_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_coordenador_or_above()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Usar auth.jwt() para evitar consulta recursiva a auth.users
  SELECT (current_setting('request.jwt.claims', true)::json->>'user_metadata'->>'role')::text 
  INTO user_role;
  
  RETURN user_role IN ('coordenador', 'administrador', 'master');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Atualizar políticas de segurança
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Coordenadores podem ver seus subordinados" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção de perfis pelo trigger" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON public.profiles;
DROP POLICY IF EXISTS "Coordenadores podem atualizar seus subordinados" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização de último login" ON public.profiles;

-- Políticas de seleção
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Administradores podem ver todos os perfis"
  ON profiles FOR SELECT
  USING (is_role('administrador') OR is_role('master'));

CREATE POLICY "Coordenadores podem ver seus subordinados"
  ON profiles FOR SELECT
  USING (
    is_role('coordenador') AND 
    EXISTS (
      SELECT 1 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (profiles.coordenador_id = p.id OR profiles.id = p.id)
    )
  );

-- Políticas de inserção
CREATE POLICY "Permitir inserção de perfis pelo trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Políticas de atualização
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Administradores podem atualizar qualquer perfil"
  ON profiles FOR UPDATE
  USING (is_role('administrador') OR is_role('master'))
  WITH CHECK (is_role('administrador') OR is_role('master'));

CREATE POLICY "Coordenadores podem atualizar seus subordinados"
  ON profiles FOR UPDATE
  USING (
    is_role('coordenador') AND 
    EXISTS (
      SELECT 1 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (profiles.coordenador_id = p.id OR profiles.id = p.id)
    )
  )
  WITH CHECK (
    is_role('coordenador') AND 
    EXISTS (
      SELECT 1 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND (profiles.coordenador_id = p.id OR profiles.id = p.id)
    )
  );

-- Política para atualização de último login
CREATE POLICY "Permitir atualização de último login"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND 
    profiles.email = OLD.email AND
    profiles.role = OLD.role AND
    profiles.coordenador_id IS NOT DISTINCT FROM OLD.coordenador_id
  );

-- Garantir que o RLS está ativado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Atualizar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
