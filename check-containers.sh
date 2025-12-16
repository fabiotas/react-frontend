#!/bin/bash
echo "=== Status dos Containers ==="
docker ps --filter "name=react-frontend" --filter "name=node-user-api" --filter "name=mongodb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Logs do Frontend (últimas 30 linhas) ==="
docker logs --tail=30 react-frontend

echo ""
echo "=== Logs da API (últimas 30 linhas) ==="
docker logs --tail=30 node-user-api

echo ""
echo "=== Testando conectividade ==="
docker exec react-frontend ping -c 2 api 2>/dev/null || echo "Não conseguiu fazer ping no serviço 'api'"

echo ""
echo "=== Variáveis de ambiente do Frontend ==="
docker exec react-frontend env | grep VITE

