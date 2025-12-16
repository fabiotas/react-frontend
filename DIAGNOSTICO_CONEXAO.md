# Diagnóstico de Problemas de Conexão do Frontend

## Problemas Corrigidos

### 1. ✅ Configuração da API_URL no docker-compose.yml
- **Antes**: `VITE_API_URL=http://localhost:3000/api` (incorreto)
- **Depois**: `VITE_API_URL=/api` (usa proxy do Vite)
- **Motivo**: O proxy do Vite redireciona `/api` automaticamente para o backend

### 2. ✅ Timeout Aumentado
- **Antes**: 5 segundos
- **Depois**: 10 segundos
- **Motivo**: Dá mais tempo para a conexão ser estabelecida, especialmente em ambientes Docker

### 3. ✅ Tratamento Melhorado de Erros de Conexão
- Função `isNetworkError()` criada para detectar erros de rede
- Mensagens de erro mais claras quando o backend não está disponível
- Melhor feedback visual para o usuário

## Como Diagnosticar Problemas de Conexão

### 1. Verificar se o Backend está Rodando

#### Em Docker:
```bash
# Verificar containers
docker ps

# Ver logs do backend
docker logs node-user-api
# ou
docker-compose logs api
```

#### Localmente:
```bash
# Verificar porta 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # Linux/Mac

# Testar acesso direto
curl http://localhost:3000/api
```

### 2. Verificar Configuração do Proxy

O proxy está configurado em `vite.config.ts`:
- **Docker**: usa `http://api:3000` (nome do serviço)
- **Local**: usa `http://localhost:3000`

Para forçar um target específico:
```bash
export VITE_API_TARGET=http://api:3000  # Docker
# ou
export VITE_API_TARGET=http://localhost:3000  # Local
```

### 3. Verificar Variáveis de Ambiente

```bash
# Verificar variáveis no container
docker exec react-frontend env | grep VITE

# Deve mostrar:
# VITE_API_URL=/api
```

### 4. Verificar Console do Navegador

1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Procure por erros relacionados a:
   - `ERR_NETWORK`
   - `ERR_CONNECTION_REFUSED`
   - `ECONNABORTED`
   - `timeout`

### 5. Verificar Network Tab

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Recarregue a página (F5)
4. Procure por requisições para `/api/*`
5. Clique em uma requisição falha para ver detalhes:
   - Status code (502, 503, etc.)
   - Mensagem de erro
   - Response headers

## Mensagens de Erro Comuns

### "Não foi possível conectar ao servidor"
- **Causa**: Backend não está rodando ou não está acessível
- **Solução**: 
  1. Verificar se o backend está rodando
  2. Verificar configuração do proxy
  3. Verificar se as portas estão corretas

### "Network Error" ou "ERR_NETWORK"
- **Causa**: Problema de conexão de rede
- **Solução**:
  1. Verificar se o backend está acessível
  2. Verificar firewall/proxy
  3. Verificar se está usando o target correto (Docker vs Local)

### Timeout
- **Causa**: Backend está lento ou não responde
- **Solução**:
  1. Verificar logs do backend para erros
  2. Verificar se há processos bloqueando
  3. Aumentar timeout se necessário (atualmente 10s)

## Soluções Rápidas

### Reiniciar Containers
```bash
docker-compose restart frontend
docker-compose restart api
```

### Reconstruir Frontend
```bash
docker-compose down
docker-compose up -d --build frontend
```

### Limpar Cache do Navegador
1. Abra DevTools (F12)
2. Clique com botão direito no botão de recarregar
3. Selecione "Limpar cache e recarregar forçadamente"

### Limpar localStorage
```javascript
// No console do navegador (F12):
localStorage.clear();
location.reload();
```

## Estrutura de Conexão

```
Frontend (Vite) ──proxy──> Backend (Node.js)
     │                          │
  :5173                     :3000
     │                          │
  /api/*  ───────────────>  /api/*
```

O proxy do Vite intercepta todas as requisições para `/api/*` e as redireciona para o backend.

## Variáveis de Ambiente Importantes

- `VITE_API_URL`: URL base da API (deve ser `/api` para usar proxy)
- `VITE_API_TARGET`: Target do proxy (opcional, detecta automaticamente)
- `VITE_SUPABASE_URL`: URL do Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

## Próximos Passos

Se o problema persistir:
1. Verificar logs completos do backend
2. Verificar configuração de rede Docker
3. Testar conexão direta ao backend sem proxy
4. Verificar se há problemas de CORS (já configurado no proxy)

