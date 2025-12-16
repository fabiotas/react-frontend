# 🔧 Como Corrigir o Erro "sub claim must be a UUID" no Backend

## ❌ Problema

O erro `invalid claim: sub claim must be a UUID` ocorre porque o backend está gerando um token JWT do Supabase com um `sub` (subject) que não é um UUID válido.

O Supabase **requer** que o campo `sub` seja um UUID válido (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

## ✅ Solução

Você precisa modificar o endpoint `/api/auth/supabase-token` no seu backend para gerar um UUID válido no campo `sub`.

### Opção 1: Gerar um UUID a partir do ID do usuário (Recomendado)

Se o ID do usuário não é um UUID, você pode gerar um UUID determinístico a partir do ID:

**Node.js/Express:**
```javascript
const { v5: uuidv5 } = require('uuid');
const crypto = require('crypto');

// Namespace UUID para gerar UUIDs determinísticos
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

router.get('/supabase-token', authenticateToken, async (req, res) => {
  try {
    if (!SUPABASE_JWT_SECRET) {
      return res.status(500).json({ 
        error: 'Configuração do Supabase não encontrada' 
      });
    }

    const userId = req.user.id || req.user._id || req.user.userId;
    const userEmail = req.user.email;

    if (!userId || !userEmail) {
      return res.status(400).json({ 
        error: 'Informações do usuário incompletas' 
      });
    }

    // Gerar UUID determinístico a partir do ID do usuário
    // Isso garante que o mesmo usuário sempre terá o mesmo UUID
    const userUuid = uuidv5(userId.toString(), NAMESPACE);

    const payload = {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
      sub: userUuid, // UUID válido
      email: userEmail,
      role: 'authenticated',
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        original_user_id: userId.toString(), // Manter o ID original nos metadados
      },
      iat: Math.floor(Date.now() / 1000)
    };

    const supabaseToken = jwt.sign(payload, SUPABASE_JWT_SECRET, {
      algorithm: 'HS256'
    });

    res.json({ 
      success: true,
      supabaseToken 
    });

  } catch (error) {
    console.error('Erro ao gerar token do Supabase:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar token do Supabase',
      message: error.message 
    });
  }
});
```

**Instalar dependência:**
```bash
npm install uuid
```

### Opção 2: Usar um UUID aleatório (Não recomendado)

Se você não se importa com consistência, pode gerar um UUID aleatório:

```javascript
const { v4: uuidv4 } = require('uuid');

// ...
const userUuid = uuidv4(); // UUID aleatório
// ...
```

⚠️ **Problema**: Cada vez que o usuário fizer login, terá um UUID diferente, o que pode causar problemas.

### Opção 3: Criar usuário no Supabase Auth (Melhor para produção)

A melhor solução é criar o usuário no Supabase Auth e usar o UUID gerado pelo Supabase:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

router.get('/supabase-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const userEmail = req.user.email;

    if (!userId || !userEmail) {
      return res.status(400).json({ 
        error: 'Informações do usuário incompletas' 
      });
    }

    // Verificar se o usuário já existe no Supabase Auth
    let supabaseUser;
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(userEmail);
    
    if (existingUser?.user) {
      // Usuário já existe, usar o UUID dele
      supabaseUser = existingUser.user;
    } else {
      // Criar novo usuário no Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          original_user_id: userId.toString(),
        }
      });
      
      if (createError) {
        throw createError;
      }
      
      supabaseUser = newUser.user;
    }

    // Gerar token JWT usando o UUID do Supabase
    const payload = {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
      sub: supabaseUser.id, // UUID do Supabase (sempre válido)
      email: userEmail,
      role: 'authenticated',
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        original_user_id: userId.toString(),
      },
      iat: Math.floor(Date.now() / 1000)
    };

    const supabaseToken = jwt.sign(payload, SUPABASE_JWT_SECRET, {
      algorithm: 'HS256'
    });

    res.json({ 
      success: true,
      supabaseToken 
    });

  } catch (error) {
    console.error('Erro ao gerar token do Supabase:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar token do Supabase',
      message: error.message 
    });
  }
});
```

**Instalar dependência:**
```bash
npm install @supabase/supabase-js
```

**Variáveis de ambiente necessárias:**
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_JWT_SECRET=seu-jwt-secret
```

## 🧪 Testar

Após corrigir o backend:

1. Reinicie o servidor backend
2. Faça login na aplicação
3. Tente fazer upload de uma imagem
4. O erro "sub claim must be a UUID" não deve mais aparecer

## 📝 Notas

- A **Opção 1** (UUID determinístico) é a mais simples e funciona bem para a maioria dos casos
- A **Opção 3** (criar usuário no Supabase) é a melhor para produção, mas requer configuração adicional
- O UUID deve estar no formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- O mesmo usuário deve sempre ter o mesmo UUID (por isso UUID determinístico é melhor que aleatório)

