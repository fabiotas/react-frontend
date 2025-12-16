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
    const response = await api.get<{ success: boolean; supabaseToken: string }>('/auth/supabase-token');
    if (response.data.success && response.data.supabaseToken) {
      return response.data.supabaseToken;
    }
    throw new Error('Token do Supabase não retornado');
  },
};


