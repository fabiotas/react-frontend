import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { existsSync } from 'fs'

// Detectar se está rodando em Docker
const isDocker = existsSync('/.dockerenv') || process.env.DOCKER_ENV === 'true'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        // Detecta automaticamente se está em Docker ou local
        // Em Docker: usa o nome do serviço 'api'
        // Localmente: usa 'localhost'
        target: process.env.VITE_API_TARGET || (isDocker ? 'http://api:3000' : 'http://localhost:3000'),
        changeOrigin: true,
        // Configurações adicionais para melhor tratamento de erros
        timeout: 10000,
        proxyTimeout: 10000,
        // Configuração para funcionar em Docker
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, res) => {
            // Não logar erros de conexão - são esperados se a API não estiver rodando
            if (res && !res.headersSent) {
              res.writeHead(502, {
                'Content-Type': 'text/plain',
              });
              res.end('API não disponível');
            }
          });
          
          // Log de requisições para debug (apenas em desenvolvimento)
          if (process.env.NODE_ENV === 'development') {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
            });
            
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`[Proxy] ${req.method} ${req.url} <- ${proxyRes.statusCode}`);
            });
          }
        },
      },
    },
  },
})


