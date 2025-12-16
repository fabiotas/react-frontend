#!/bin/bash

# Script para corrigir o endpoint supabase-token no backend
# Execute este script no diretório do seu backend

echo "🔧 Corrigindo endpoint supabase-token do backend..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "   Execute este script no diretório raiz do seu backend"
    exit 1
fi

# 1. Instalar dependência uuid
echo "📦 Instalando dependência 'uuid'..."
npm install uuid

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar uuid"
    exit 1
fi

echo "✅ Dependência instalada com sucesso!"
echo ""

# 2. Procurar arquivo do endpoint
echo "🔍 Procurando arquivo do endpoint supabase-token..."

# Possíveis locais do arquivo
POSSIBLE_FILES=(
    "routes/auth.js"
    "routes/auth.ts"
    "controllers/authController.js"
    "controllers/authController.ts"
    "api/auth/supabase-token.js"
    "api/auth/supabase-token.ts"
    "src/routes/auth.js"
    "src/routes/auth.ts"
    "src/controllers/authController.js"
    "src/controllers/authController.ts"
)

FOUND_FILE=""

for file in "${POSSIBLE_FILES[@]}"; do
    if [ -f "$file" ]; then
        FOUND_FILE="$file"
        echo "✅ Arquivo encontrado: $file"
        break
    fi
done

if [ -z "$FOUND_FILE" ]; then
    echo "⚠️  Arquivo do endpoint não encontrado automaticamente"
    echo ""
    echo "Por favor, encontre manualmente o arquivo que contém:"
    echo "  - router.get('/supabase-token'"
    echo "  - ou app.get('/api/auth/supabase-token'"
    echo ""
    echo "E aplique as seguintes alterações:"
    echo ""
    echo "1. Adicione no topo do arquivo:"
    echo "   const { v5: uuidv5 } = require('uuid');"
    echo "   const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';"
    echo ""
    echo "2. Substitua:"
    echo "   sub: userId.toString(),"
    echo "   por:"
    echo "   sub: uuidv5(userId.toString(), NAMESPACE),"
    echo ""
    echo "Veja o arquivo 'backend-supabase-token-corrected.js' para referência completa"
    exit 0
fi

# 3. Fazer backup
BACKUP_FILE="${FOUND_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Criando backup: $BACKUP_FILE"
cp "$FOUND_FILE" "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar backup"
    exit 1
fi

echo "✅ Backup criado com sucesso!"
echo ""

# 4. Aplicar correções
echo "🔨 Aplicando correções..."

# Verificar se já tem uuid importado
if ! grep -q "require('uuid')" "$FOUND_FILE" && ! grep -q "from 'uuid'" "$FOUND_FILE"; then
    # Adicionar import do uuid (após outros requires)
    if grep -q "require('jsonwebtoken')" "$FOUND_FILE"; then
        # Adicionar após jsonwebtoken
        sed -i "/require('jsonwebtoken')/a const { v5: uuidv5 } = require('uuid');" "$FOUND_FILE"
    elif grep -q "from 'jsonwebtoken'" "$FOUND_FILE"; then
        # TypeScript/ES6
        sed -i "/from 'jsonwebtoken'/a import { v5 as uuidv5 } from 'uuid';" "$FOUND_FILE"
    else
        # Adicionar no topo
        if grep -q "require(" "$FOUND_FILE"; then
            sed -i "1a const { v5: uuidv5 } = require('uuid');" "$FOUND_FILE"
        else
            sed -i "1a import { v5 as uuidv5 } from 'uuid';" "$FOUND_FILE"
        fi
    fi
    
    # Adicionar NAMESPACE
    if grep -q "require('uuid')" "$FOUND_FILE" || grep -q "from 'uuid'" "$FOUND_FILE"; then
        sed -i "/uuid/a const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';" "$FOUND_FILE"
    fi
fi

# Substituir sub: userId.toString() por sub: uuidv5(userId.toString(), NAMESPACE)
if grep -q "sub: userId.toString()" "$FOUND_FILE"; then
    sed -i "s/sub: userId.toString(),/sub: uuidv5(userId.toString(), NAMESPACE),/" "$FOUND_FILE"
    echo "✅ Correção aplicada: sub agora usa UUID"
elif grep -q "sub: req.user.id" "$FOUND_FILE"; then
    # Tentar outras variações
    sed -i "s/sub: req.user.id,/sub: uuidv5(req.user.id.toString(), NAMESPACE),/" "$FOUND_FILE"
    echo "✅ Correção aplicada: sub agora usa UUID"
else
    echo "⚠️  Não foi possível aplicar a correção automaticamente"
    echo "   Por favor, edite manualmente o arquivo $FOUND_FILE"
    echo "   Veja o arquivo 'backend-supabase-token-corrected.js' para referência"
fi

echo ""
echo "✅ Correções aplicadas!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Revise o arquivo $FOUND_FILE"
echo "   2. Reinicie o servidor backend"
echo "   3. Teste o upload de imagens"
echo ""
echo "💡 Backup salvo em: $BACKUP_FILE"

