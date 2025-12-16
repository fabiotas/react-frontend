# Implementação do Endpoint Supabase Token no Backend

Este documento contém exemplos de implementação do endpoint `/api/auth/supabase-token` para diferentes frameworks.

## Endpoint Esperado

```
GET /api/auth/supabase-token
Headers: Authorization: Bearer {token-do-usuário}

Resposta:
{
  "supabaseToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Opção 1: Node.js/Express

### Instalação de dependências

```bash
npm install jsonwebtoken @supabase/supabase-js
# ou
yarn add jsonwebtoken @supabase/supabase-js
```

### Implementação

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Configurações do Supabase (use variáveis de ambiente)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de serviço, não a anon key
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // JWT Secret do Supabase

// Middleware de autenticação (ajuste conforme seu código)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // Verificar token do seu sistema de autenticação
  // ... seu código de verificação de token ...
  
  req.user = decoded; // Assumindo que você decodifica o token
  next();
};

// Endpoint para obter token do Supabase
router.get('/supabase-token', authenticateToken, async (req, res) => {
  try {
    // Opção A: Gerar token JWT manualmente usando o JWT Secret do Supabase
    const supabaseToken = jwt.sign(
      {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hora
        sub: req.user.id, // ID do usuário do seu sistema
        email: req.user.email,
        role: 'authenticated',
        app_metadata: {
          provider: 'email',
          providers: ['email']
        },
        user_metadata: {
          // Metadados adicionais do usuário
        },
        iat: Math.floor(Date.now() / 1000)
      },
      SUPABASE_JWT_SECRET,
      { algorithm: 'HS256' }
    );

    res.json({ supabaseToken });
  } catch (error) {
    console.error('Erro ao gerar token do Supabase:', error);
    res.status(500).json({ error: 'Erro ao gerar token do Supabase' });
  }
});

module.exports = router;
```

### Alternativa: Usando Supabase Admin Client

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

router.get('/supabase-token', authenticateToken, async (req, res) => {
  try {
    // Criar ou obter usuário no Supabase Auth
    // Se o usuário já existe, obter o token
    // Se não existe, criar e obter o token
    
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(req.user.email);
    
    let userId;
    if (existingUser?.user) {
      userId = existingUser.user.id;
    } else {
      // Criar usuário no Supabase Auth
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: req.user.email,
        email_confirm: true,
        user_metadata: {
          // Metadados do usuário
        }
      });
      
      if (error) throw error;
      userId = newUser.user.id;
    }
    
    // Gerar token de sessão para o usuário
    const { data: session, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: req.user.email,
    });
    
    // Ou gerar token JWT manualmente
    const supabaseToken = jwt.sign(
      {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        sub: userId,
        email: req.user.email,
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000)
      },
      SUPABASE_JWT_SECRET,
      { algorithm: 'HS256' }
    );

    res.json({ supabaseToken });
  } catch (error) {
    console.error('Erro ao gerar token do Supabase:', error);
    res.status(500).json({ error: 'Erro ao gerar token do Supabase' });
  }
});
```

## Opção 2: NestJS

### Instalação

```bash
npm install @nestjs/jwt @supabase/supabase-js
```

### Implementação

```typescript
// auth.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SupabaseService } from './supabase.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('supabase-token')
  @UseGuards(JwtAuthGuard)
  async getSupabaseToken(@Request() req) {
    const supabaseToken = await this.supabaseService.generateToken(req.user);
    return { supabaseToken };
  }
}

// supabase.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SupabaseService {
  private readonly jwtSecret: string;
  private readonly supabaseUrl: string;

  constructor(private configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL');
  }

  async generateToken(user: any): Promise<string> {
    return jwt.sign(
      {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        sub: user.id,
        email: user.email,
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000)
      },
      this.jwtSecret,
      { algorithm: 'HS256' }
    );
  }
}
```

## Opção 3: Python (FastAPI)

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()
security = HTTPBearer()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Seu código de verificação de token
    token = credentials.credentials
    # ... verificar token ...
    return decoded_user

@router.get("/supabase-token")
async def get_supabase_token(user = Depends(verify_token)):
    try:
        payload = {
            "aud": "authenticated",
            "exp": int((datetime.now() + timedelta(hours=1)).timestamp()),
            "sub": user["id"],
            "email": user["email"],
            "role": "authenticated",
            "iat": int(datetime.now().timestamp())
        }
        
        supabase_token = jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm="HS256")
        return {"supabaseToken": supabase_token}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao gerar token do Supabase")
```

## Variáveis de Ambiente Necessárias

Adicione ao seu arquivo `.env` do backend:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_JWT_SECRET=seu-jwt-secret
```

## Como Obter o JWT Secret do Supabase

1. Acesse o painel do Supabase: https://app.supabase.com
2. **Selecione seu projeto** (o projeto onde está configurado o bucket `area-images`)
3. **Dentro do projeto**, vá em **Settings** (⚙️ Configurações) → **API**
4. Role até a seção **JWT Settings**
5. Copie o **JWT Secret** (é uma string longa)

⚠️ **IMPORTANTE**: 
- O JWT Secret é **específico de cada projeto** no Supabase
- Você precisa estar **dentro do projeto correto** para obter o JWT Secret correto
- Nunca exponha o JWT Secret no frontend! Ele deve estar apenas no backend
- Mantenha o JWT Secret seguro e nunca commite no Git (use variáveis de ambiente)

## Notas Importantes

1. O token gerado deve ter a estrutura correta do JWT do Supabase
2. O campo `sub` deve conter um UUID válido (pode ser o ID do usuário do seu sistema)
3. O token expira em 1 hora (ajuste conforme necessário)
4. Use sempre HTTPS em produção
5. Valide sempre o token do usuário antes de gerar o token do Supabase

## Testando o Endpoint

```bash
curl -X GET http://localhost:3000/api/auth/supabase-token \
  -H "Authorization: Bearer seu-token-jwt"
```

Resposta esperada:
```json
{
  "supabaseToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

