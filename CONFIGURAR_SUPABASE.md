# Como Configurar o Supabase para Upload de Imagens

## 📋 Pré-requisitos

1. Ter uma conta no Supabase (https://supabase.com)
2. Ter um projeto criado no Supabase
3. Ter um bucket chamado `area-images` criado no Storage do Supabase

## 🔑 Passo 1: Obter as Credenciais do Supabase

### 1.1 Acesse o Painel do Supabase

1. Acesse: https://app.supabase.com
2. Faça login na sua conta
3. Selecione o projeto onde você quer fazer upload das imagens

### 1.2 Obter a URL do Projeto

1. No painel do projeto, vá em **Settings** (⚙️) → **API**
2. Na seção **Project URL**, copie a URL
   - Formato: `https://xxxxxxxxxxxxx.supabase.co`
   - Esta é a sua `VITE_SUPABASE_URL`

### 1.3 Obter a Chave Anônima (Anon Key)

1. Ainda na página **Settings** → **API**
2. Na seção **Project API keys**, encontre a chave **`anon` `public`**
3. Clique em **Reveal** para mostrar a chave
4. Copie a chave completa
   - Esta é a sua `VITE_SUPABASE_ANON_KEY`

⚠️ **IMPORTANTE**: Use apenas a chave `anon public`, nunca a `service_role` no frontend!

## 📝 Passo 2: Configurar Variáveis de Ambiente

### Opção A: Desenvolvimento Local (sem Docker)

1. Crie um arquivo `.env` na raiz do projeto:

```bash
# Na raiz do projeto react-frontend
touch .env
```

2. Adicione as variáveis no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Exemplo real:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTIwMDAwMCwiZXhwIjoxOTYwNzg2MDAwfQ.exemplo...
```

3. Reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

### Opção B: Usando Docker

1. Crie um arquivo `.env` na raiz do projeto (mesmo que a Opção A)

2. Adicione as variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

3. O `docker-compose.yml` já está configurado para ler essas variáveis

4. Reinicie o container:

```bash
docker-compose restart frontend
# ou
docker-compose up -d --build frontend
```

## 🗂️ Passo 3: Configurar o Bucket no Supabase

### 3.1 Criar o Bucket

1. No painel do Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome do bucket: `area-images`
4. Marque como **Public bucket** (para permitir acesso público às imagens)
5. Clique em **Create bucket**

### 3.2 Configurar Políticas de Acesso (RLS)

1. No bucket `area-images`, vá em **Policies**
2. Clique em **New Policy**
3. Configure as políticas:

**Política para Upload (INSERT):**

⚠️ **IMPORTANTE**: Se você está recebendo erro "new row violates row-level security policy", tente primeiro a **Opção 1** (menos restritiva) para testar.

**Opção 1 - Política mais permissiva (para testar):**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition:
```sql
bucket_id = 'area-images'::text
```

**Opção 2 - Política com verificação de role (recomendada para produção):**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition:
```sql
(bucket_id = 'area-images'::text) AND (auth.role() = 'authenticated'::text)
```

**Nota**: A Opção 2 requer que o token JWT gerado pelo backend seja reconhecido corretamente pelo Supabase. Se você está tendo problemas, use a Opção 1 temporariamente e depois ajuste para a Opção 2 quando o token estiver funcionando corretamente.

**Política para Leitura (SELECT):**
- Policy name: `Allow public read`
- Allowed operation: `SELECT`
- Target roles: `public`
- Policy definition:
```sql
bucket_id = 'area-images'::text
```

**Política para Deletar (DELETE):**
- Policy name: `Allow authenticated delete`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy definition:
```sql
(bucket_id = 'area-images'::text) AND (auth.role() = 'authenticated'::text)
```

## ✅ Passo 4: Verificar se Está Funcionando

1. Reinicie o servidor/container
2. Abra o console do navegador (F12)
3. Você **NÃO** deve mais ver os avisos:
   - ❌ `⚠️ Variáveis de ambiente do Supabase não configuradas`
   - ❌ `⚠️ Funcionalidades de upload de imagens estarão desabilitadas`

4. Tente fazer upload de uma imagem:
   - Vá para a página de criação/edição de área
   - Tente fazer upload de uma imagem
   - Se funcionar, o Supabase está configurado corretamente!

## 🔒 Segurança

### ⚠️ IMPORTANTE - Nunca faça isso:

- ❌ NÃO commite o arquivo `.env` no Git
- ❌ NÃO compartilhe suas chaves publicamente
- ❌ NÃO use a `service_role` key no frontend
- ❌ NÃO exponha o JWT Secret do Supabase

### ✅ Boas Práticas:

- ✅ Use apenas a chave `anon public` no frontend
- ✅ Mantenha o `.env` no `.gitignore`
- ✅ Use variáveis de ambiente em produção
- ✅ Configure políticas RLS adequadas no Supabase

## 🐛 Troubleshooting

### Problema: Ainda vejo os avisos após configurar

**Solução:**
1. Verifique se o arquivo `.env` está na raiz do projeto
2. Verifique se as variáveis começam com `VITE_`
3. Reinicie o servidor completamente (pare e inicie novamente)
4. Limpe o cache do navegador (Ctrl+Shift+R)

### Problema: Erro ao fazer upload - "new row violates row-level security policy"

**Possíveis causas:**
1. Bucket não existe ou tem nome diferente
2. Políticas RLS não configuradas corretamente
3. Token de autenticação inválido ou não reconhecido pelo Supabase
4. Backend não está gerando token do Supabase corretamente
5. O token JWT gerado pelo backend não está sendo reconhecido pelo Supabase como válido

**Solução:**

1. **Verifique se o bucket `area-images` existe** no painel do Supabase

2. **Verifique e ajuste as políticas RLS do bucket:**
   
   No painel do Supabase, vá em **Storage** → **area-images** → **Policies**
   
   **Política para Upload (INSERT) - IMPORTANTE:**
   - Policy name: `Allow authenticated uploads`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition (use uma destas opções):
   
   **Opção 1 - Verificação simples (recomendada se o token não está sendo reconhecido):**
   ```sql
   bucket_id = 'area-images'::text
   ```
   
   **Opção 2 - Verificação com role (requer token válido do Supabase):**
   ```sql
   (bucket_id = 'area-images'::text) AND (auth.role() = 'authenticated'::text)
   ```
   
   ⚠️ **Se você está recebendo erro de RLS, tente a Opção 1 primeiro** (menos restritiva) para testar se o problema é o reconhecimento do token.

3. **Verifique se o backend está gerando o token corretamente:**
   - O token deve ser um JWT válido do Supabase
   - O token deve ter o campo `role: 'authenticated'`
   - O token deve ser assinado com o `SUPABASE_JWT_SECRET` correto
   - O `sub` (subject) deve ser um UUID válido

4. **Verifique os logs do console do navegador** para mais detalhes do erro

5. **Teste o token manualmente:**
   - Faça login na aplicação
   - Abra o console do navegador (F12)
   - Verifique se o endpoint `/api/auth/supabase-token` está retornando um token válido
   - Verifique se o token tem a estrutura correta (deve ser um JWT com 3 partes separadas por pontos)

### Problema: Imagens não aparecem

**Possíveis causas:**
1. Bucket não está marcado como público
2. URL da imagem está incorreta
3. Política de leitura não está configurada

**Solução:**
1. Verifique se o bucket está marcado como público
2. Verifique a URL retornada pelo upload
3. Verifique a política de SELECT no bucket

## 📚 Recursos Adicionais

- [Documentação do Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS do Supabase](https://supabase.com/docs/guides/storage/security/access-control)
- [Autenticação no Supabase](https://supabase.com/docs/guides/auth)

