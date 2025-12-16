# Diagnóstico - Página não carrega

## Problemas comuns e soluções

### 1. Verificar se os containers estão rodando
```bash
cd ..
docker-compose -f docker-compose.full.yml ps
```

Todos devem estar com status "Up" ou "Running".

### 2. Ver logs do frontend
```bash
docker-compose -f docker-compose.full.yml logs -f frontend
```

Procure por:
- Erros de compilação
- Erros de importação de módulos
- Mensagens sobre porta já em uso
- Erros de conexão

### 3. Ver logs da API
```bash
docker-compose -f docker-compose.full.yml logs -f api
```

### 4. Testar acesso direto
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Mongo Express: http://localhost:8081

### 5. Verificar se o Vite está escutando
```bash
docker exec react-frontend netstat -tuln | grep 5173
```

Ou verificar os logs para ver se apareceu:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://0.0.0.0:5173/
```

### 6. Verificar variáveis de ambiente no container
```bash
docker exec react-frontend env | grep VITE
```

### 7. Verificar se as dependências foram instaladas
```bash
docker exec react-frontend ls -la node_modules | head -20
docker exec react-frontend ls node_modules/@supabase
```

### 8. Reconstruir completamente (se necessário)
```bash
cd ..
docker-compose -f docker-compose.full.yml down
docker-compose -f docker-compose.full.yml build --no-cache frontend
docker-compose -f docker-compose.full.yml up -d
```

## Correções aplicadas

1. ✅ Corrigido `VITE_API_URL` para usar `/api` (caminho relativo) em vez de `http://localhost:3000/api`
   - Isso faz com que o proxy do Vite funcione corretamente
   - O Vite redireciona `/api` para `http://api:3000` automaticamente

## Próximos passos

Após aplicar a correção do `VITE_API_URL`, reinicie o container do frontend:

```bash
cd ..
docker-compose -f docker-compose.full.yml restart frontend
```

Ou reconstrua:

```bash
docker-compose -f docker-compose.full.yml up -d --build frontend
```

