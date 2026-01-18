import api from './api';
import { isNetworkError } from './api';
import { AuthResponse, LoginCredentials, RegisterData, User, ApiResponse, UpdateUserData } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      if (isNetworkError(error)) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      // Re-throw para que o componente possa tratar
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      if (isNetworkError(error)) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      // Re-throw para que o componente possa tratar
      throw error;
    }
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  async updateMe(data: UpdateUserData): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>('/auth/me', data);
    return response.data;
  },

  async getSupabaseToken(): Promise<string> {
    try {
      const response = await api.get<{ success: boolean; supabaseToken: string }>('/auth/supabase-token');
      if (response.data.success && response.data.supabaseToken) {
        return response.data.supabaseToken;
      }
      throw new Error('Token do Supabase não retornado');
    } catch (error: any) {
      // Log detalhado do erro
      console.error('[Supabase Token] Erro ao obter token:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Se for erro 500, adicionar mensagem mais útil
      if (error.response?.status === 500) {
        throw new Error(
          'Erro 500: O servidor não conseguiu gerar o token do Supabase. ' +
          'Verifique se o backend está configurado corretamente (SUPABASE_JWT_SECRET). ' +
          `Detalhes: ${error.response?.data?.error || error.message}`
        );
      }
      
      throw error;
    }
  },
};


