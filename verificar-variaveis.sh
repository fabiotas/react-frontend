#!/bin/bash

echo "=========================================="
echo "🔍 Verificando Variáveis de Ambiente"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "1️⃣ Verificando arquivo .env na pasta react-frontend:"
echo "----------------------------------------"
if [ -f "/home/fabiot/projetos/react-frontend/.env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
    echo ""
    echo "Conteúdo do arquivo .env:"
    echo "----------------------------------------"
    cat /home/fabiot/projetos/react-frontend/.env | grep -E "VITE_SUPABASE|VITE_API" || echo "Nenhuma variável VITE encontrada"
    echo ""
else
    echo -e "${RED}❌ Arquivo .env não encontrado em /home/fabiot/projetos/react-frontend/.env${NC}"
    echo ""
fi

echo ""
echo "2️⃣ Verificando se o container está rodando:"
echo "----------------------------------------"
if docker ps --format "{{.Names}}" | grep -q "react-frontend"; then
    echo -e "${GREEN}✅ Container react-frontend está rodando${NC}"
    echo ""
    
    echo "3️⃣ Variáveis de ambiente dentro do container:"
    echo "----------------------------------------"
    echo "Variáveis VITE encontradas no container:"
    docker exec react-frontend env | grep "^VITE" | sort
    echo ""
    
    echo "4️⃣ Verificando valores específicos do Supabase:"
    echo "----------------------------------------"
    SUPABASE_URL=$(docker exec react-frontend sh -c 'echo $VITE_SUPABASE_URL')
    SUPABASE_KEY=$(docker exec react-frontend sh -c 'echo $VITE_SUPABASE_ANON_KEY')
    
    if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "" ]; then
        echo -e "${RED}❌ VITE_SUPABASE_URL está vazia ou não definida${NC}"
    else
        echo -e "${GREEN}✅ VITE_SUPABASE_URL está definida${NC}"
        echo "   Valor: ${SUPABASE_URL:0:50}..." # Mostra apenas os primeiros 50 caracteres
    fi
    
    if [ -z "$SUPABASE_KEY" ] || [ "$SUPABASE_KEY" = "" ]; then
        echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY está vazia ou não definida${NC}"
    else
        echo -e "${GREEN}✅ VITE_SUPABASE_ANON_KEY está definida${NC}"
        echo "   Valor: ${SUPABASE_KEY:0:50}..." # Mostra apenas os primeiros 50 caracteres
    fi
else
    echo -e "${YELLOW}⚠️ Container react-frontend não está rodando${NC}"
    echo "   Execute: docker-compose up -d"
    echo ""
fi

echo ""
echo "5️⃣ Verificando arquivo .env na pasta pai (se existir):"
echo "----------------------------------------"
if [ -f "/home/fabiot/projetos/.env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado na pasta pai${NC}"
    echo "Conteúdo:"
    cat /home/fabiot/projetos/.env | grep -E "VITE_SUPABASE|VITE_API" || echo "Nenhuma variável VITE encontrada"
else
    echo -e "${YELLOW}ℹ️ Nenhum arquivo .env na pasta pai (isso é normal)${NC}"
fi

echo ""
echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="

