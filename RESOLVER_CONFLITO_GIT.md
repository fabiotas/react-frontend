# 🔧 Resolver Conflito ao Fazer Push no Git

## Problema

```
! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'github.com:fabiotas/react-frontend.git'
```

Isso acontece quando o repositório remoto tem commits que você não tem localmente.

## ✅ Solução

### Opção 1: Pull e Merge (Recomendado)

1. **Baixar e integrar as mudanças remotas**:
   ```bash
   git pull origin main
   ```

2. **Resolver conflitos (se houver)**:
   - Se aparecerem conflitos, o Git vai avisar quais arquivos têm conflito
   - Abra os arquivos com conflito e resolva manualmente
   - Procure por marcadores `<<<<<<<`, `=======`, `>>>>>>>`
   - Depois de resolver, adicione os arquivos:
     ```bash
     git add .
     git commit -m "Merge remote changes"
     ```

3. **Fazer push novamente**:
   ```bash
   git push origin main
   ```

### Opção 2: Pull com Rebase (História mais limpa)

Se você quer uma história linear sem merge commits:

```bash
# Baixar e aplicar suas mudanças locais em cima das remotas
git pull --rebase origin main

# Se houver conflitos, resolver e continuar:
git add .
git rebase --continue

# Depois fazer push:
git push origin main
```

### Opção 3: Forçar Push (⚠️ CUIDADO - Só se você tiver certeza!)

**ATENÇÃO**: Isso vai **sobrescrever** as mudanças no remoto. Use apenas se:
- Você tem certeza que não precisa das mudanças remotas
- Você está trabalhando sozinho no branch
- Você sabe exatamente o que está fazendo

```bash
# Força o push (sobrescreve o remoto)
git push --force origin main

# Ou de forma mais segura (força apenas se o remote não avançou):
git push --force-with-lease origin main
```

## 📋 Passo a Passo Recomendado

Execute estes comandos na ordem:

```bash
# 1. Ver o status atual
git status

# 2. Ver diferenças entre local e remoto
git fetch origin
git log HEAD..origin/main --oneline

# 3. Baixar e integrar mudanças
git pull origin main

# 4. Se tudo foi bem, fazer push
git push origin main
```

## 🔍 Verificar o que Mudou no Remoto

Antes de fazer pull, você pode ver o que há no remoto:

```bash
# Baixar informações do remoto (sem integrar)
git fetch origin

# Ver commits que estão no remoto mas não localmente
git log HEAD..origin/main --oneline

# Ver diferenças
git diff HEAD origin/main
```

## 🆘 Se Houver Conflitos

Se o `git pull` mostrar conflitos:

1. **Ver quais arquivos têm conflito**:
   ```bash
   git status
   ```

2. **Abrir os arquivos com conflito** e procurar por:
   ```
   <<<<<<< HEAD
   Seu código local
   =======
   Código do remoto
   >>>>>>> origin/main
   ```

3. **Resolver manualmente**: Escolha qual código manter ou combine ambos

4. **Adicionar arquivos resolvidos**:
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   ```

5. **Fazer push**:
   ```bash
   git push origin main
   ```

## 💡 Dica: Evitar Problemas no Futuro

Sempre antes de fazer push, faça:

```bash
git pull origin main
git push origin main
```

Ou configure um alias:

```bash
# Adicionar ao ~/.gitconfig
git config --global alias.sync '!git pull origin main && git push origin main'
```

Depois é só usar:
```bash
git sync
```
