# 🔧 Como Corrigir as Políticas RLS do Supabase Storage

## ❌ Problema Atual

As políticas atuais estão configuradas incorretamente:
- ✅ São muito restritivas (só permitem pastas específicas)
- ✅ São para usuários "anon" (públicos), mas o código usa autenticação
- ✅ Não há política geral para INSERT de usuários autenticados

## ✅ Solução Passo a Passo

### Passo 1: Acessar o Painel de Políticas

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Storage** → **area-images** → **Policies**

### Passo 2: Remover Políticas Antigas (Opcional)

Você pode remover as políticas antigas que são muito específicas:
- "Give anon users access to JPG images in folder 5osu60_0" (SELECT)
- "Give anon users access to JPG images in folder 5osu60_1" (INSERT)
- "Give anon users access to JPG images in folder 5osu60_2" (UPDATE)
- "Give anon users access to JPG images in folder 5osu60_3" (DELETE)

**Como remover:**
- Clique no ícone de três pontos (⋮) ao lado de cada política
- Selecione "Delete"

### Passo 3: Criar Nova Política de INSERT (Upload)

1. Clique em **"New policy"** no bucket AREA-IMAGES
2. Selecione **"Create a policy from scratch"** ou **"For full customization"**
3. Configure:
   - **Policy name:** `Allow authenticated uploads`
   - **Allowed operation:** `INSERT`
   - **Target roles:** Selecione `authenticated` (NÃO "public")
   - **Policy definition:** Cole este código:
   ```sql
   bucket_id = 'area-images'::text
   ```
4. Clique em **"Review"** e depois em **"Save policy"**

### Passo 4: Criar Política de SELECT (Leitura)

1. Clique em **"New policy"** novamente
2. Configure:
   - **Policy name:** `Allow public read`
   - **Allowed operation:** `SELECT`
   - **Target roles:** Selecione `public`
   - **Policy definition:**
   ```sql
   bucket_id = 'area-images'::text
   ```
3. Clique em **"Review"** e depois em **"Save policy"**

### Passo 5: Criar Política de DELETE

1. Clique em **"New policy"** novamente
2. Configure:
   - **Policy name:** `Allow authenticated delete`
   - **Allowed operation:** `DELETE`
   - **Target roles:** Selecione `authenticated`
   - **Policy definition:**
   ```sql
   bucket_id = 'area-images'::text
   ```
3. Clique em **"Review"** e depois em **"Save policy"**

### Passo 6: Criar Política de UPDATE (Opcional)

Se você precisar atualizar arquivos:

1. Clique em **"New policy"** novamente
2. Configure:
   - **Policy name:** `Allow authenticated update`
   - **Allowed operation:** `UPDATE`
   - **Target roles:** Selecione `authenticated`
   - **Policy definition:**
   ```sql
   bucket_id = 'area-images'::text
   ```
3. Clique em **"Review"** e depois em **"Save policy"**

## ✅ Resultado Final

Após configurar, você deve ter estas políticas:

| Nome | Operação | Target Role | Status |
|------|----------|-------------|--------|
| Allow authenticated uploads | INSERT | authenticated | ✅ |
| Allow public read | SELECT | public | ✅ |
| Allow authenticated delete | DELETE | authenticated | ✅ |
| Allow authenticated update | UPDATE | authenticated | ✅ (opcional) |

## 🧪 Testar

1. Faça login na aplicação
2. Tente fazer upload de uma imagem
3. O upload deve funcionar sem erros de RLS

## ⚠️ Importante

- **INSERT e DELETE** devem ser para `authenticated` (usuários logados)
- **SELECT** pode ser para `public` (todos podem ver as imagens)
- As políticas devem permitir acesso a **todo o bucket**, não apenas pastas específicas

## 🐛 Se Ainda Não Funcionar

1. Verifique se o backend está gerando o token do Supabase corretamente
2. Verifique se o token tem `role: 'authenticated'` no payload
3. Verifique os logs do console do navegador para mais detalhes
4. Tente temporariamente usar `public` em vez de `authenticated` para testar (depois volte para `authenticated` por segurança)

