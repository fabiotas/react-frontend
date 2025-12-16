# 🔧 Instruções para Corrigir o Backend

## ⚠️ Problema

O backend está gerando um token JWT do Supabase com um campo `sub` que não é um UUID válido. O Supabase **requer** que o `sub` seja um UUID no formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

## ✅ Solução Rápida

**📁 Arquivo pronto para copiar:** `backend-supabase-token-corrected.js`

Este arquivo já está corrigido e pronto para uso. Você pode copiá-lo diretamente para o seu backend.

### Opção 1: Usar o arquivo pronto (Recomendado)

1. Copie o conteúdo do arquivo `backend-supabase-token-corrected.js`
2. Cole no arquivo do seu backend que contém o endpoint `/api/auth/supabase-token`
3. Ajuste o middleware de autenticação conforme necessário
4. Instale a dependência: `npm install uuid`
5. Reinicie o servidor

### Opção 2: Fazer as alterações manualmente

Se preferir fazer as alterações manualmente, siga estes passos:

### Passo 1: Instalar a dependência `uuid`

No diretório do seu backend, execute:

```bash
npm install uuid
# ou
yarn add uuid
```

### Passo 2: Modificar o arquivo do endpoint

Encontre o arquivo que contém o endpoint `/api/auth/supabase-token` e faça estas alterações:

**ANTES (código incorreto):**
```javascript
const jwt = require('jsonwebtoken');

// ...
const payload = {
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + (60 * 60),
  sub: userId.toString(),  // ❌ ERRO: Não é um UUID válido
  email: userEmail,
  role: 'authenticated',
  // ...
};
```

**DEPOIS (código corrigido):**
```javascript
const jwt = require('jsonwebtoken');
const { v5: uuidv5 } = require('uuid');

// Namespace UUID para gerar UUIDs determinísticos
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// ...
// Gerar UUID determinístico a partir do ID do usuário
const userUuid = uuidv5(userId.toString(), NAMESPACE);

const payload = {
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + (60 * 60),
  sub: userUuid,  // ✅ CORRETO: UUID válido
  email: userEmail,
  role: 'authenticated',
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  user_metadata: {
    original_user_id: userId.toString(), // Manter o ID original
  },
  iat: Math.floor(Date.now() / 1000)
};
```

### Passo 3: Reiniciar o servidor backend

Após fazer as alterações, reinicie o servidor backend:

```bash
# Se estiver usando nodemon, ele reinicia automaticamente
# Caso contrário:
npm start
# ou
node server.js
```

## 📋 Arquivos de Referência

- **`backend-supabase-token-corrected.js`** - Código completo corrigido e pronto para uso
- **`backend-example.js`** - Exemplo corrigido com comentários explicativos

## 🧪 Testar

1. Reinicie o servidor backend
2. Faça login na aplicação frontend
3. Tente fazer upload de uma imagem
4. O erro "sub claim must be a UUID" não deve mais aparecer

## 📝 Notas Importantes

- O UUID é **determinístico**: o mesmo usuário sempre terá o mesmo UUID
- O ID original do usuário é mantido em `user_metadata.original_user_id`
- O namespace UUID usado garante que os UUIDs gerados sejam consistentes

## 🔍 Onde Encontrar o Código do Backend?

O código do backend geralmente está em:
- `routes/auth.js` ou `routes/auth.ts`
- `controllers/authController.js` ou `controllers/authController.ts`
- `api/auth/supabase-token.js` ou similar

Procure por:
- `router.get('/supabase-token'`
- `app.get('/api/auth/supabase-token'`
- Função que contém `jwt.sign` com `sub: userId`

## ❓ Precisa de Ajuda?

Se você não encontrar o arquivo do backend ou tiver dúvidas, me avise e posso ajudar a localizar o código correto.

