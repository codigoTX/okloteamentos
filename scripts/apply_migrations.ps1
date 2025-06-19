# Script para aplicar migrações do banco de dados

# Configurações
$supabaseUrl = $env:SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY
$migrationsDir = "$PSScriptRoot/../supabase/migrations"

# Verificar se as variáveis de ambiente estão configuradas
if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Error "As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem ser configuradas"
    exit 1
}

# Função para executar uma consulta SQL no Supabase
function Invoke-SupabaseQuery {
    param (
        [string]$sql
    )
    
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        query = $sql
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/execute_sql" `
            -Method Post `
            -Headers $headers `
            -Body $body
            
        return $response
    } catch {
        Write-Error "Erro ao executar consulta: $_"
        Write-Error "Resposta: $($_.Exception.Response.GetResponseStream() | Select-Object -Expand Content)"
        throw $_
    }
}

# Aplicar migrações
Write-Host "Aplicando migrações..." -ForegroundColor Cyan

# Listar arquivos de migração em ordem alfabética
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name

foreach ($file in $migrationFiles) {
    Write-Host "Aplicando migração: $($file.Name)" -ForegroundColor Yellow
    $sql = Get-Content -Path $file.FullName -Raw
    
    try {
        $result = Invoke-SupabaseQuery -sql $sql
        Write-Host "Migração aplicada com sucesso: $($file.Name)" -ForegroundColor Green
    } catch {
        Write-Error "Falha ao aplicar migração $($file.Name): $_"
        exit 1
    }
}

Write-Host "Todas as migrações foram aplicadas com sucesso!" -ForegroundColor Green
