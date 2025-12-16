# 🚀 Quick Start - Configurar Supabase em 5 Minutos

## Passo 1: Obter Credenciais (2 minutos)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## Passo 2: Criar Arquivo .env (1 minuto)

1. Na raiz do projeto, crie o arquivo `.env`:

```bash
# Copie o exemplo
cp .env.example .env
```

2. Edite o arquivo `.env` e cole suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

## Passo 3: Criar Bucket no Supabase (1 minuto)

1. No painel do Supabase, vá em **Storage**
2. Clique em **New bucket**
3. Nome: `area-images`
4. Marque **Public bucket**
5. Clique em **Create**

## Passo 4: Reiniciar Servidor (1 minuto)

### Se estiver rodando localmente:
```bash
# Pare o servidor (Ctrl+C) e inicie novamente
npm run dev
```

### Se estiver usando Docker:
```bash
docker-compose restart frontend
```

## ✅ Pronto!

Agora você pode fazer upload de imagens! 

Para mais detalhes, veja o arquivo `CONFIGURAR_SUPABASE.md`

