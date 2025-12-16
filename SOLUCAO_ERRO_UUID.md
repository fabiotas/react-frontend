# ✅ Solução: Erro "Cannot find module 'uuid'"

## 🔍 Problema

O backend está tentando usar o módulo `uuid`, mas ele não está instalado.

## ✅ Solução Rápida

Você precisa instalar a dependência `uuid` no diretório do backend.

### Passo 1: Navegar até o diretório do backend

```bash
cd /caminho/para/seu/backend
```

**Nota:** Baseado no erro, o backend parece estar em `/app`. Se você estiver usando Docker, pode ser que precise instalar dentro do container.

### Passo 2: Instalar a dependência

```bash
npm install uuid
```

Ou se estiver usando yarn:

```bash
yarn add uuid
```

### Passo 3: Reiniciar o servidor

Após instalar, reinicie o servidor backend:

```bash
npm start
# ou
npm run dev
```

## 🐳 Se Estiver Usando Docker

Se o backend está rodando em Docker, você precisa instalar a dependência dentro do container:

### Opção 1: Instalar via Docker exec

```bash
# Encontrar o container do backend
docker ps

# Entrar no container
docker exec -it <nome-do-container-backend> bash

# Instalar a dependência
npm install uuid

# Sair do container
exit

# Reiniciar o container
docker-compose restart backend
# ou
docker restart <nome-do-container-backend>
```

### Opção 2: Adicionar ao package.json e rebuild

1. Adicione `uuid` ao `package.json` do backend:
   ```json
   {
     "dependencies": {
       "uuid": "^9.0.0"
     }
   }
   ```

2. Rebuild do container:
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

## ✅ Verificar se Funcionou

Após instalar, o servidor deve iniciar sem erros. Você deve ver algo como:

```
Server running on port 3000
```

## 📝 Nota Importante

A dependência `uuid` precisa estar instalada no **backend**, não no frontend. O frontend não precisa dessa dependência.

