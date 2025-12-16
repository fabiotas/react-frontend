import api from './api';
import { Area, ApiResponse, CreateAreaData, UpdateAreaData } from '../types';

interface AreasResponse {
  success: boolean;
  count: number;
  data: Area[];
}

export const areaService = {
  // Obter todas as áreas (público)
  async getAllAreas(): Promise<AreasResponse> {
    const response = await api.get<AreasResponse>('/areas');
    return response.data;
  },

  // Obter áreas do usuário logado
  async getMyAreas(): Promise<AreasResponse> {
    const response = await api.get<AreasResponse>('/areas/my');
    return response.data;
  },

  // Obter área por ID
  async getAreaById(id: string): Promise<ApiResponse<Area>> {
    const response = await api.get<ApiResponse<Area>>(`/areas/${id}`);
    return response.data;
  },

  // Criar nova área
  async createArea(data: CreateAreaData): Promise<ApiResponse<Area>> {
    const response = await api.post<ApiResponse<Area>>('/areas', data);
    return response.data;
  },

  // Atualizar área
  async updateArea(id: string, data: UpdateAreaData): Promise<ApiResponse<Area>> {
    const response = await api.put<ApiResponse<Area>>(`/areas/${id}`, data);
    return response.data;
  },

  // Excluir área
  async deleteArea(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/areas/${id}`);
    return response.data;
  },

  // Verificar disponibilidade
  async checkAvailability(id: string, checkIn: string, checkOut: string): Promise<ApiResponse<{ available: boolean }>> {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/areas/${id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`
    );
    return response.data;
  },
};

