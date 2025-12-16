# Multi-stage build para otimização

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development
FROM node:20-slim AS development

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 5173

# Comando para desenvolvimento (será sobrescrito pelo docker-compose se necessário)
CMD ["npm", "run", "dev"]


