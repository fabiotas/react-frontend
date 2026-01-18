# 🚀 Configurar GitHub Actions para Build e Deploy

Este guia mostra como configurar as variáveis de ambiente no GitHub Actions para build do Docker.

## 📋 Pré-requisitos

1. Repositório no GitHub
2. Variáveis de ambiente do Supabase configuradas
3. (Opcional) Conta no Docker Hub se usar o workflow `docker-build-dockerhub.yml`

## 🔑 Configurar Secrets no GitHub

As variáveis de ambiente precisam ser configuradas como **Secrets** no GitHub para serem usadas durante o build.

### Passo 1: Acessar Settings do Repositório

1. Acesse seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### Passo 2: Adicionar Secrets

Clique em **New repository secret** e adicione cada uma das seguintes variáveis:

#### 1. VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Secret**: `https://qfejwszknwvqlbgwedds.supabase.co` (sua URL do Supabase)
- Clique em **Add secret**

#### 2. VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (sua Anon Key completa)
- Clique em **Add secret**

#### 3. VITE_API_URL (Opcional)
- **Name**: `VITE_API_URL`
- **Secret**: `/api` (padrão) ou URL absoluta como `https://seu-backend.onrender.com/api`
- Clique em **Add secret**

**Nota**: Se não configurar `VITE_API_URL`, o padrão será `/api`

## 📦 Workflows Disponíveis

### 1. GitHub Container Registry (Recomendado)

O workflow `docker-build.yml` faz push para o **GitHub Container Registry** (ghcr.io).

**Vantagens**:
- ✅ Integrado ao GitHub
- ✅ Grátis para repositórios públicos
- ✅ Não precisa de credenciais adicionais

**Como usar**:
1. O workflow já está configurado
2. Faça push para `main` ou `master`
3. A imagem será criada automaticamente em `ghcr.io/seu-usuario/react-frontend`

**Para usar a imagem**:
```bash
docker pull ghcr.io/seu-usuario/react-frontend:latest
```

### 2. Docker Hub (Alternativa)

O workflow `docker-build-dockerhub.yml` faz push para o **Docker Hub**.

**Configuração adicional necessária**:

1. **Adicionar Secrets**:
   - `DOCKERHUB_USERNAME`: Seu nome de usuário do Docker Hub
   - `DOCKERHUB_PASSWORD`: Seu token de acesso do Docker Hub (não a senha!)

2. **Obter Token do Docker Hub**:
   - Acesse: https://hub.docker.com/settings/security
   - Clique em **New Access Token**
   - Dê um nome e copie o token
   - Use esse token como `DOCKERHUB_PASSWORD`

3. **Usar o workflow**:
   - O workflow já está configurado
   - A imagem será enviada para `seu-usuario/react-frontend`

## 🎯 Como Funciona

### Durante o Build

1. **GitHub Actions** executa o workflow
2. **Secrets** são passados como `build-args` para o Docker
3. **Dockerfile** recebe os `ARG` e os define como `ENV`
4. **Vite** incorpora as variáveis `VITE_*` no build
5. **Imagem** é criada com o build otimizado
6. **Push** é feito para o registry configurado

### Variáveis no Build

```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL=/api

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build  # Variáveis são incorporadas aqui
```

## 📝 Checklist de Configuração

- [ ] Secrets configurados no GitHub:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_API_URL` (opcional)
- [ ] Workflow escolhido:
  - [ ] GitHub Container Registry (`docker-build.yml`)
  - [ ] Docker Hub (`docker-build-dockerhub.yml`)
- [ ] Se Docker Hub, adicionar:
  - [ ] `DOCKERHUB_USERNAME`
  - [ ] `DOCKERHUB_PASSWORD` (token)
- [ ] Testar workflow fazendo push para `main`

## 🔍 Verificar se Funcionou

1. **Fazer push** para `main` ou `master`
2. **Acompanhar** na aba **Actions** do GitHub
3. **Verificar** se o build foi bem-sucedido (verde ✓)
4. **Verificar** se a imagem foi criada:
   - GitHub Container Registry: https://github.com/seu-usuario/seu-repo/pkgs/container/react-frontend
   - Docker Hub: https://hub.docker.com/r/seu-usuario/react-frontend

## 🆘 Problemas Comuns

### Erro: "Secret not found"

**Solução**: Verifique se os secrets foram criados corretamente em **Settings** → **Secrets and variables** → **Actions**

### Erro: "Build failed" durante npm run build

**Solução**: 
- Verifique se as variáveis `VITE_*` estão sendo passadas corretamente
- Veja os logs do GitHub Actions para mais detalhes
- Verifique se os secrets não têm espaços extras

### Imagem não aparece no registry

**Solução**:
- Verifique se o push foi habilitado (não faz push em Pull Requests)
- Verifique se as credenciais estão corretas (para Docker Hub)
- Verifique os logs do workflow para erros

## 🚀 Uso da Imagem

Depois do build, você pode usar a imagem assim:

```bash
# GitHub Container Registry
docker pull ghcr.io/seu-usuario/react-frontend:latest
docker run -p 80:80 ghcr.io/seu-usuario/react-frontend:latest

# Docker Hub
docker pull seu-usuario/react-frontend:latest
docker run -p 80:80 seu-usuario/react-frontend:latest
```

## 📚 Referências

- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Hub](https://hub.docker.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
