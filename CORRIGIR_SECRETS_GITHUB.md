# ⚠️ IMPORTANTE: Configurar Secrets no GitHub

## Problema

O build está falhando porque os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão **vazios** no GitHub Actions.

No log do build você pode ver:
```
--build-arg VITE_SUPABASE_URL= 
--build-arg VITE_SUPABASE_ANON_KEY= 
```

Os valores estão vazios! Isso significa que os secrets não foram configurados no GitHub.

## ✅ Solução: Configurar Secrets

### Passo 1: Acessar Settings do Repositório

1. Acesse: https://github.com/fabiotas/react-frontend (ou seu repositório)
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### Passo 2: Adicionar Secrets

Clique em **New repository secret** e adicione cada uma:

#### 1. VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Secret**: `https://qfejwszknwvqlbgwedds.supabase.co`
- Clique em **Add secret**

#### 2. VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZWp3c3prbnd2cWxiZ3dlZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk1MTYsImV4cCI6MjA3OTc2NTUxNn0.5mDx0UeLvE_zEPhcCBV11LWpJdV57DEZZlxGEjuwu94`
- Clique em **Add secret**

#### 3. VITE_API_URL (Opcional)
- **Name**: `VITE_API_URL`
- **Secret**: `/api` ou `https://node-app-main-e884f96.onrender.com/api`
- Clique em **Add secret**

**Nota**: Se não configurar `VITE_API_URL`, o padrão será `/api`

## 🔍 Como Verificar

Após adicionar os secrets:

1. **Faça push** novamente ou **dispare o workflow manualmente**
2. **Veja os logs** do GitHub Actions
3. Na etapa **Verify secrets are set**, você deve ver:
   ```
   ✅ VITE_SUPABASE_URL is set
   ✅ VITE_SUPABASE_ANON_KEY is set
   ```

Se aparecerem avisos ⚠️, os secrets ainda não foram configurados corretamente.

## 📝 Checklist

- [ ] Secret `VITE_SUPABASE_URL` adicionado
- [ ] Secret `VITE_SUPABASE_ANON_KEY` adicionado
- [ ] Secret `VITE_API_URL` adicionado (opcional)
- [ ] Secrets foram verificados no próximo build
- [ ] Build passou com sucesso

## 🆘 Ainda não funciona?

1. **Verifique o nome dos secrets**: Devem ser exatamente:
   - `VITE_SUPABASE_URL` (não `VITE_SUPABASE_URL ` com espaço)
   - `VITE_SUPABASE_ANON_KEY` (case sensitive)

2. **Verifique se copiou os valores completos**:
   - A URL deve começar com `https://`
   - A Anon Key é uma string muito longa (JWT token)

3. **Aguarde alguns segundos** após adicionar antes de fazer push

4. **Veja os logs do GitHub Actions** na etapa "Verify secrets are set" para diagnóstico
