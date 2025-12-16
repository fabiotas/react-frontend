# Diagnóstico - API não está acessível (Erro 500)

## Problema
A API está retornando erro 500 (Internal Server Error) quando o frontend tenta acessá-la.

## Possíveis Causas

### 1. API não está rodando
A API pode não estar iniciada ou pode ter parado.

### 2. Proxy do Vite configurado incorretamente
O proxy pode estar apontando para o host errado (localhost vs Docker).

### 3. API está com problemas internos
A API pode estar rodando mas com erros no código ou configuração.

## Passos para Diagnosticar

### Passo 1: Verificar se a API está rodando

#### Se estiver usando Docker:
```bash
# Verificar containers rodando
docker ps

# Verificar se o container da API está rodando
docker ps | grep -E "api|node-user-api"

# Ver logs da API
docker logs node-user-api
# ou
docker-compose logs api
```

#### Se estiver rodando localmente:
```bash
# Verificar se há processo na porta 3000
netstat -ano | findstr :3000
# ou no Linux/Mac
lsof -i :3000
```

### Passo 2: Testar acesso direto à API

#### Se estiver usando Docker:
```bash
# Testar de dentro do container do frontend
docker exec react-frontend curl http://api:3000/api

# Testar do host
curl http://localhost:3000/api
```

#### Se estiver rodando localmente:
```bash
# Testar diretamente
curl http://localhost:3000/api
```

### Passo 3: Verificar configuração do proxy

O proxy do Vite está configurado em `vite.config.ts`:

- **Em Docker**: deve usar `http://api:3000` (nome do serviço Docker)
- **Localmente**: deve usar `http://localhost:3000`

Para forçar um target específico, defina a variável de ambiente:
```bash
export VITE_API_TARGET=http://api:3000  # Docker
# ou
export VITE_API_TARGET=http://localhost:3000  # Local
```

### Passo 4: Verificar logs da API

Os logs da API podem mostrar o erro específico:

```bash
# Docker
docker logs -f node-user-api

# Ou se estiver usando docker-compose
docker-compose logs -f api
```

Procure por:
- Erros de conexão com banco de dados
- Erros de autenticação
- Erros de variáveis de ambiente faltando
- Stack traces de erros

### Passo 5: Verificar variáveis de ambiente da API

A API pode precisar de variáveis de ambiente configuradas:

```bash
# Ver variáveis do container da API
docker exec node-user-api env

# Verificar se há arquivo .env
cat .env
```

## Soluções Comuns

### Solução 1: Iniciar a API

Se a API não estiver rodando:

```bash
# Docker
docker-compose up -d api

# Ou localmente
cd ../backend  # ou onde está o código da API
npm start
# ou
node server.js
```

### Solução 2: Corrigir configuração do proxy

Se o proxy estiver apontando para o lugar errado:

1. **Em Docker**: Certifique-se de que o `vite.config.ts` está usando `http://api:3000`
2. **Localmente**: Certifique-se de que está usando `http://localhost:3000`

Você pode forçar o target definindo a variável de ambiente antes de iniciar o Vite:

```bash
# Docker
VITE_API_TARGET=http://api:3000 npm run dev

# Local
VITE_API_TARGET=http://localhost:3000 npm run dev
```

### Solução 3: Verificar rede Docker

Se estiver usando Docker, verifique se os containers estão na mesma rede:

```bash
# Verificar rede
docker network ls

# Verificar se os containers estão na mesma rede
docker network inspect app-network
```

### Solução 4: Reiniciar containers

Às vezes, reiniciar resolve problemas de conectividade:

```bash
# Reiniciar todos os containers
docker-compose restart

# Ou apenas a API
docker-compose restart api

# Ou apenas o frontend
docker-compose restart frontend
```

### Solução 5: Verificar porta da API

Certifique-se de que a API está escutando na porta correta:

```bash
# Verificar portas expostas
docker ps --format "table {{.Names}}\t{{.Ports}}"

# A API deve estar exposta na porta 3000
```

## Verificação Rápida

Execute este script para verificar tudo de uma vez:

```bash
#!/bin/bash
echo "=== Status dos Containers ==="
docker ps --filter "name=react-frontend" --filter "name=api" --filter "name=node-user-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Testando API diretamente ==="
curl -v http://localhost:3000/api 2>&1 | head -20

echo ""
echo "=== Testando de dentro do container ==="
docker exec react-frontend curl -v http://api:3000/api 2>&1 | head -20

echo ""
echo "=== Logs recentes da API ==="
docker logs --tail=20 node-user-api 2>&1 | tail -20
```

## Próximos Passos

1. ✅ Verificar se a API está rodando
2. ✅ Verificar logs da API para identificar o erro específico
3. ✅ Verificar configuração do proxy
4. ✅ Verificar variáveis de ambiente da API
5. ✅ Testar acesso direto à API

Se após seguir estes passos o problema persistir, compartilhe:
- Os logs da API
- A configuração do docker-compose
- O resultado dos testes de conectividade

