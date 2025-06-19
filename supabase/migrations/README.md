# Migrações do Banco de Dados

Este diretório contém os scripts de migração do banco de dados para o sistema Ok Loteamentos.

## Estrutura

- `20240525214500_update_user_management.sql`: Atualiza o gerenciamento de usuários e políticas de segurança

## Como aplicar as migrações

### Método 1: Usando o script PowerShell

1. Certifique-se de ter as seguintes variáveis de ambiente configuradas:
   - `SUPABASE_URL`: URL da sua instância do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase (com permissões de administrador)

2. Execute o script de migração:
   ```powershell
   cd scripts
   .\apply_migrations.ps1
   ```

### Método 2: Aplicando manualmente

1. Acesse o painel do Supabase
2. Vá até SQL Editor
3. Copie o conteúdo do arquivo de migração desejado
4. Cole no editor SQL e execute

## Boas práticas

- Sempre faça backup do banco de dados antes de aplicar migrações
- Teste as migrações em um ambiente de desenvolvimento antes de aplicar em produção
- As migrações devem ser idempotentes (podem ser executadas várias vezes sem causar erros)
- Documente todas as alterações de esquema nos arquivos de migração
