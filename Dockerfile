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

# Argumentos de build para variáveis de ambiente do Vite
# As variáveis VITE_* são incorporadas no build time pelo Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL=/api

# Definir como variáveis de ambiente para o build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

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


