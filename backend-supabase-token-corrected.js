/**
 * ENDPOINT CORRIGIDO: /api/auth/supabase-token
 * 
 * Este arquivo está CORRIGIDO e pronto para uso.
 * Copie este código para o seu backend.
 * 
 * CORREÇÕES APLICADAS:
 * ✅ Gera UUID válido no campo 'sub' usando uuidv5
 * ✅ O mesmo usuário sempre terá o mesmo UUID (determinístico)
 * ✅ Mantém o ID original do usuário nos metadados
 * ✅ Resolve o erro "sub claim must be a UUID"
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { v5: uuidv5 } = require('uuid');

const router = express.Router();

// ============================================
// CONFIGURAÇÕES (use variáveis de ambiente)
// ============================================
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // JWT Secret do Supabase
// Para obter: 
// 1. Acesse https://app.supabase.com
// 2. Selecione SEU PROJETO (onde está o bucket area-images)
// 3. Dentro do projeto → Settings → API → JWT Settings → JWT Secret
// IMPORTANTE: O JWT Secret é específico de cada projeto!

// Namespace UUID para gerar UUIDs determinísticos
// O mesmo usuário sempre terá o mesmo UUID
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
// Substitua por seu middleware de autenticação existente
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // TODO: Substitua pela sua lógica de verificação de token
    // Exemplo:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    // Por enquanto, assumindo que você já tem req.user após autenticação
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ============================================
// ENDPOINT: GET /api/auth/supabase-token
// ============================================
router.get('/supabase-token', authenticateToken, async (req, res) => {
  try {
    // Validar configuração
    if (!SUPABASE_JWT_SECRET) {
      console.error('SUPABASE_JWT_SECRET não configurado');
      return res.status(500).json({ 
        success: false,
        error: 'Configuração do Supabase não encontrada' 
      });
    }

    // Obter informações do usuário autenticado
    const userId = req.user.id || req.user._id || req.user.userId;
    const userEmail = req.user.email;

    if (!userId || !userEmail) {
      return res.status(400).json({ 
        success: false,
        error: 'Informações do usuário incompletas' 
      });
    }

    // ✅ CORREÇÃO: Gerar UUID determinístico a partir do ID do usuário
    // Isso garante que o mesmo usuário sempre terá o mesmo UUID
    // O Supabase requer que o campo 'sub' seja um UUID válido
    const userUuid = uuidv5(userId.toString(), NAMESPACE);

    // Gerar token JWT do Supabase
    // O token deve seguir a estrutura do Supabase Auth
    const payload = {
      aud: 'authenticated',           // Audience
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expira em 1 hora
      sub: userUuid,                  // ✅ CORRIGIDO: UUID válido (OBRIGATÓRIO)
      email: userEmail,               // Email do usuário
      role: 'authenticated',          // Role
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        original_user_id: userId.toString(), // Manter o ID original nos metadados
        // Adicione outros metadados se necessário
        // Exemplo: name: req.user.name
      },
      iat: Math.floor(Date.now() / 1000) // Issued at
    };

    // Gerar o token JWT
    const supabaseToken = jwt.sign(payload, SUPABASE_JWT_SECRET, {
      algorithm: 'HS256'
    });

    // Retornar o token
    res.json({ 
      success: true,
      supabaseToken 
    });

  } catch (error) {
    console.error('Erro ao gerar token do Supabase:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao gerar token do Supabase',
      message: error.message 
    });
  }
});

module.exports = router;

// ============================================
// COMO USAR:
// ============================================
// 
// 1. Instale as dependências:
//    npm install jsonwebtoken uuid
//
// 2. Adicione ao seu arquivo .env:
//    SUPABASE_JWT_SECRET=seu-jwt-secret-aqui
//
// 3. Importe e use no seu app principal (ex: app.js ou server.js):
//    const supabaseTokenRouter = require('./routes/supabase-token');
//    app.use('/api/auth', supabaseTokenRouter);
//
// 4. O endpoint estará disponível em:
//    GET /api/auth/supabase-token
//    Headers: Authorization: Bearer {seu-token-jwt}
//
// 5. Resposta esperada:
//    {
//      "success": true,
//      "supabaseToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//    }
//
// ============================================
// DIFERENÇAS DO CÓDIGO ANTERIOR:
// ============================================
// 
// ❌ ANTES: sub: userId.toString()  (não era UUID válido)
// ✅ AGORA: sub: uuidv5(userId.toString(), NAMESPACE)  (UUID válido)
//
// Isso resolve o erro: "invalid claim: sub claim must be a UUID"
//
// ============================================

