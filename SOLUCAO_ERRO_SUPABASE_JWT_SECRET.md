# ✅ Solução: SUPABASE_JWT_SECRET não está definido

## 🔴 Problema Identificado

O erro no console mostra claramente:
```
error: "SUPABASE_JWT_SECRET não está definido nas variáveis de ambiente"
status: 500
```

**O problema está no BACKEND**, não no frontend! O frontend está configurado corretamente ✅

## 📋 O que fazer

### Passo 1: Obter o JWT Secret do Supabase

1. Acesse: **https://app.supabase.com**
2. Faça login e selecione seu projeto
3. Vá em **Settings** (⚙️) → **API**
4. Na seção **JWT Settings**, procure por **JWT Secret**
5. Clique em **Reveal** ou **Show** para revelar o secret
6. **Copie o valor completo**

⚠️ **IMPORTANTE**: 
- `SUPABASE_JWT_SECRET` é **DIFERENTE** de `VITE_SUPABASE_ANON_KEY`
- O JWT Secret é usado pelo **backend** para gerar tokens
- A Anon Key é usada pelo **frontend** para conectar ao Supabase

### Passo 2: Configurar no Backend

Você precisa adicionar a variável `SUPABASE_JWT_SECRET` no seu backend. Dependendo de como o backend está configurado:

#### Opção A: Se o backend usa Docker Compose

1. Localize o arquivo `docker-compose.yml` do backend
2. Adicione a variável no serviço do backend:

```yaml
services:
  api:  # ou node-app, backend, etc.
    environment:
      - SUPABASE_JWT_SECRET=<cole-o-jwt-secret-aqui>
    # ou use env_file:
    env_file:
      - .env
```

3. Crie/edite o arquivo `.env` na pasta do backend:

```env
SUPABASE_JWT_SECRET=<cole-o-jwt-secret-aqui>
```

4. Reinicie o container do backend:
```bash
cd /caminho/para/backend
docker-compose restart api  # ou o nome do serviço do backend
```

#### Opção B: Se o backend roda localmente (sem Docker)

1. Crie/edite o arquivo `.env` na pasta do backend:

```env
SUPABASE_JWT_SECRET=<cole-o-jwt-secret-aqui>
```

2. Reinicie o servidor do backend:
```bash
cd /caminho/para/backend
npm start  # ou npm run dev, node server.js, etc.
```

#### Opção C: Se o backend está no Render.com (Produção)

⚠️ **VEJA O GUIA COMPLETO**: `CONFIGURAR_RENDER_COM.md`

1. Acesse: **https://dashboard.render.com**
2. Encontre seu serviço de backend (ex: `node-app-main-e884f96`)
3. Clique no serviço → **Environment**
4. Clique em **Add Environment Variable**
5. **Key**: `SUPABASE_JWT_SECRET`
6. **Value**: Cole o JWT Secret do Supabase
7. Clique em **Save Changes**
8. Aguarde o redeploy automático (pode levar alguns minutos)

**Guia completo com screenshots**: Veja `CONFIGURAR_RENDER_COM.md`

### Passo 3: Verificar se Funcionou

1. **Reinicie o backend** (se ainda não fez)
2. **Teste o endpoint**:
   ```bash
   # Com autenticação (precisa estar logado)
   curl -H "Authorization: Bearer <seu-token>" http://localhost:3000/api/auth/supabase-token
   ```

   Deve retornar:
   ```json
   {
     "success": true,
     "supabaseToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **Teste no frontend**:
   - Abra o navegador (http://localhost:5173)
   - Tente fazer upload de uma imagem
   - O erro 500 não deve mais aparecer
   - Verifique o console (F12) - não deve ter mais erros relacionados a SUPABASE_JWT_SECRET

## 📝 Exemplo de Configuração Completa

Se você estiver usando Docker Compose para o backend, seu `docker-compose.yml` deve ter algo assim:

```yaml
services:
  api:
    image: node:20
    environment:
      - NODE_ENV=production
      - PORT=3000
      - SUPABASE_JWT_SECRET=<seu-jwt-secret-aqui>
      # ... outras variáveis
    ports:
      - "3000:3000"
```

Ou use `env_file`:

```yaml
services:
  api:
    image: node:20
    env_file:
      - .env
    ports:
      - "3000:3000"
```

E o arquivo `.env` na pasta do backend:

```env
NODE_ENV=production
PORT=3000
SUPABASE_JWT_SECRET=<seu-jwt-secret-aqui>
# ... outras variáveis
```

## 🔍 Como Verificar se Está Configurado

### No Backend (Docker):

```bash
# Ver variáveis do container do backend
docker exec <nome-do-container-backend> printenv | grep SUPABASE

# Deve mostrar:
# SUPABASE_JWT_SECRET=<valor-do-secret>
```

### No Backend (Local):

```bash
# No terminal onde o backend está rodando
# Deve mostrar a variável se estiver configurada
echo $SUPABASE_JWT_SECRET
```

## ✅ Resumo Rápido

1. ✅ Frontend está OK (já tem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
2. ❌ Backend precisa de `SUPABASE_JWT_SECRET`
3. 🔑 Obter JWT Secret do Supabase Dashboard
4. ⚙️ Adicionar no backend (`.env` ou `docker-compose.yml`)
5. 🔄 Reiniciar o backend
6. ✅ Testar upload de imagem

## 🆘 Ainda não funcionou?

Se após seguir todos os passos ainda houver erro:

1. **Verifique se copiou o JWT Secret correto**:
   - Não é a Anon Key
   - Não é a Service Role Key
   - É o JWT Secret (bem no final da página de API)

2. **Verifique se o backend leu a variável**:
   - Reinicie o backend após adicionar
   - Verifique os logs do backend para erros

3. **Verifique o código do backend**:
   - O endpoint `/api/auth/supabase-token` deve existir
   - Deve ler `process.env.SUPABASE_JWT_SECRET`
   - Deve gerar um JWT válido com esse secret

4. **Consulte o arquivo `backend-supabase-token-corrected.js`** neste projeto para ver um exemplo correto de implementação
