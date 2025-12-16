# Script PowerShell para corrigir o endpoint supabase-token no backend
# Execute este script no diretório do seu backend

Write-Host "🔧 Corrigindo endpoint supabase-token do backend..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "   Execute este script no diretório raiz do seu backend" -ForegroundColor Yellow
    exit 1
}

# 1. Instalar dependência uuid
Write-Host "📦 Instalando dependência 'uuid'..." -ForegroundColor Cyan
npm install uuid

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar uuid" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependência instalada com sucesso!" -ForegroundColor Green
Write-Host ""

# 2. Procurar arquivo do endpoint
Write-Host "🔍 Procurando arquivo do endpoint supabase-token..." -ForegroundColor Cyan

# Possíveis locais do arquivo
$possibleFiles = @(
    "routes\auth.js",
    "routes\auth.ts",
    "controllers\authController.js",
    "controllers\authController.ts",
    "api\auth\supabase-token.js",
    "api\auth\supabase-token.ts",
    "src\routes\auth.js",
    "src\routes\auth.ts",
    "src\controllers\authController.js",
    "src\controllers\authController.ts"
)

$foundFile = $null

foreach ($file in $possibleFiles) {
    if (Test-Path $file) {
        $foundFile = $file
        Write-Host "✅ Arquivo encontrado: $file" -ForegroundColor Green
        break
    }
}

if (-not $foundFile) {
    Write-Host "⚠️  Arquivo do endpoint não encontrado automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, encontre manualmente o arquivo que contém:" -ForegroundColor Yellow
    Write-Host "  - router.get('/supabase-token'" -ForegroundColor White
    Write-Host "  - ou app.get('/api/auth/supabase-token'" -ForegroundColor White
    Write-Host ""
    Write-Host "E aplique as seguintes alterações:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Adicione no topo do arquivo:" -ForegroundColor Cyan
    Write-Host "   const { v5: uuidv5 } = require('uuid');" -ForegroundColor White
    Write-Host "   const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Substitua:" -ForegroundColor Cyan
    Write-Host "   sub: userId.toString()," -ForegroundColor White
    Write-Host "   por:" -ForegroundColor Cyan
    Write-Host "   sub: uuidv5(userId.toString(), NAMESPACE)," -ForegroundColor White
    Write-Host ""
    Write-Host "Veja o arquivo 'backend-supabase-token-corrected.js' para referência completa" -ForegroundColor Yellow
    exit 0
}

# 3. Fazer backup
$backupFile = "$foundFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "💾 Criando backup: $backupFile" -ForegroundColor Cyan
Copy-Item $foundFile $backupFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar backup" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backup criado com sucesso!" -ForegroundColor Green
Write-Host ""

# 4. Aplicar correções
Write-Host "🔨 Aplicando correções..." -ForegroundColor Cyan

$content = Get-Content $foundFile -Raw

# Verificar se já tem uuid importado
if ($content -notmatch "require\('uuid'\)" -and $content -notmatch "from 'uuid'") {
    # Adicionar import do uuid
    if ($content -match "require\('jsonwebtoken'\)") {
        $content = $content -replace "(require\('jsonwebtoken'\))", "`$1`nconst { v5: uuidv5 } = require('uuid');"
    } elseif ($content -match "from 'jsonwebtoken'") {
        $content = $content -replace "(from 'jsonwebtoken')", "`$1`nimport { v5 as uuidv5 } from 'uuid';"
    } else {
        # Adicionar no topo
        if ($content -match "require\(") {
            $content = "const { v5: uuidv5 } = require('uuid');`n" + $content
        } else {
            $content = "import { v5 as uuidv5 } from 'uuid';`n" + $content
        }
    }
    
    # Adicionar NAMESPACE
    if ($content -match "uuid") {
        $content = $content -replace "(uuid[^`n]*)", "`$1`nconst NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';"
    }
}

# Substituir sub: userId.toString() por sub: uuidv5(userId.toString(), NAMESPACE)
if ($content -match "sub:\s*userId\.toString\(\)") {
    $content = $content -replace "sub:\s*userId\.toString\(\)", "sub: uuidv5(userId.toString(), NAMESPACE)"
    Write-Host "✅ Correção aplicada: sub agora usa UUID" -ForegroundColor Green
} elseif ($content -match "sub:\s*req\.user\.id") {
    $content = $content -replace "sub:\s*req\.user\.id", "sub: uuidv5(req.user.id.toString(), NAMESPACE)"
    Write-Host "✅ Correção aplicada: sub agora usa UUID" -ForegroundColor Green
} else {
    Write-Host "⚠️  Não foi possível aplicar a correção automaticamente" -ForegroundColor Yellow
    Write-Host "   Por favor, edite manualmente o arquivo $foundFile" -ForegroundColor Yellow
    Write-Host "   Veja o arquivo 'backend-supabase-token-corrected.js' para referência" -ForegroundColor Yellow
}

Set-Content -Path $foundFile -Value $content

Write-Host ""
Write-Host "✅ Correções aplicadas!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Revise o arquivo $foundFile" -ForegroundColor White
Write-Host "   2. Reinicie o servidor backend" -ForegroundColor White
Write-Host "   3. Teste o upload de imagens" -ForegroundColor White
Write-Host ""
Write-Host "💡 Backup salvo em: $backupFile" -ForegroundColor Green

