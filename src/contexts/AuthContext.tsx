/* @refresh reset */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';
import { authService } from '../services/authService';
import { clearSupabaseTokenCache } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao parsear usuário do localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoading(false);
        return;
      }
      
      // Validar token com o servidor (com timeout mais curto)
      let timeoutId: NodeJS.Timeout;
      let isCancelled = false;

      // Timeout de 3 segundos para não travar a aplicação
      timeoutId = setTimeout(() => {
        if (!isCancelled) {
          console.warn('Timeout ao validar token. Continuando com usuário do localStorage.');
          isCancelled = true;
          setIsLoading(false);
        }
      }, 3000);

      authService.getMe()
        .then((response) => {
          if (!isCancelled) {
            clearTimeout(timeoutId);
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setIsLoading(false);
          }
        })
        .catch((error) => {
          if (!isCancelled) {
            clearTimeout(timeoutId);
            
            const status = error.response?.status;
            const isNetworkError = 
              !error.response || 
              error.code === 'ERR_NETWORK' || 
              error.code === 'ERR_EMPTY_RESPONSE' ||
              error.code === 'ECONNABORTED' ||
              error.message === 'Network Error';
            
            // Se for erro 401 (token inválido), limpar dados
            if (status === 401) {
              console.warn('Token inválido. Limpando dados de autenticação.');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            } 
            // Se for erro de rede (backend não disponível), manter dados do localStorage
            // para permitir uso da aplicação mesmo com backend offline
            else if (isNetworkError) {
              // Silenciar logs - backend não está disponível, mas podemos continuar
              // usando dados do localStorage
            }
            // Se for erro 500 (erro no servidor), manter dados do localStorage
            else if (status === 500) {
              // Silenciar logs de erro 500 - problema no servidor, não no cliente
            }
            // Outros erros (403, 404, etc)
            else {
              // Apenas logar se não for um erro comum de rede
              if (status) {
                console.warn(`Erro ${status} ao validar token. Mantendo dados do localStorage.`);
              }
            }
            
            setIsLoading(false);
          }
        });

      // Cleanup function
      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    
    if (response.success) {
      const { user: userData, token: userToken } = response.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(response.message);
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authService.register(data);
    
    if (response.success) {
      const { user: userData, token: userToken } = response.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      throw new Error(response.message);
    }
    
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Limpar cache do token do Supabase
    clearSupabaseTokenCache();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


