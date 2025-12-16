import api from './api';
import { User, ApiResponse, UpdateUserData, UpdatePasswordData } from '../types';

interface UsersResponse {
  success: boolean;
  count: number;
  data: User[];
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export const userService = {
  async getAllUsers(): Promise<UsersResponse> {
    const response = await api.get<UsersResponse>('/users');
    return response.data;
  },

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  },

  async updatePassword(id: string, data: UpdatePasswordData): Promise<ApiResponse<null>> {
    const response = await api.patch<ApiResponse<null>>(`/users/${id}/password`, data);
    return response.data;
  },
};


