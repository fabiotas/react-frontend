import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL = rawApiUrl
  ? rawApiUrl.endsWith('/api')
    ? rawApiUrl
    : `${rawApiUrl}/api`
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout de 10 segundos para todas as requisições
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Função auxiliar para detectar erros de conexão/rede
export function isNetworkError(error: any): boolean {
  return (
    !error.response || 
    error.code === 'ERR_NETWORK' || 
    error.code === 'ERR_EMPTY_RESPONSE' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message === 'Network Error' ||
    error.message?.includes('timeout') ||
    error.message?.includes('ECONNREFUSED') ||
    (error.response?.status >= 502 && error.response?.status <= 504)
  );
}

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isNetError = isNetworkError(error);
    const approvalStatus = error.response?.data?.approvalStatus;
    
    // Adicionar flag para indicar que é erro de conexão
    if (isNetError) {
      error.isConnectionError = true;
      error.connectionErrorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
    }
    
    // Só redirecionar para login se for erro 401 e não estiver já na página de login
    if (status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Usar replace para evitar loop de redirecionamento
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Conta sem aprovação não pode usar rotas autenticadas
    if (status === 403 && approvalStatus && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const encodedStatus = encodeURIComponent(approvalStatus);
      window.location.href = `/login?approvalStatus=${encodedStatus}`;
    }
    
    return Promise.reject(error);
  }
);

export default api;


