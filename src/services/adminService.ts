import api from './api';
import { Area, User } from '../types';

interface AdminListParams {
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'blocked';
  active?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

interface AdminListResponse<T> {
  success: boolean;
  count: number;
  page: number;
  pages: number;
  data: T[];
}

interface ApiSimpleResponse {
  success: boolean;
  message: string;
}

function toQuery(params: AdminListParams): string {
  const query = new URLSearchParams();

  if (params.approvalStatus) query.set('approvalStatus', params.approvalStatus);
  if (typeof params.active === 'boolean') query.set('active', String(params.active));
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export const adminService = {
  async getUsers(params: AdminListParams = {}): Promise<AdminListResponse<User>> {
    const response = await api.get<AdminListResponse<User>>(`/admin/users${toQuery(params)}`);
    return response.data;
  },

  async approveUser(id: string): Promise<ApiSimpleResponse> {
    const response = await api.patch<ApiSimpleResponse>(`/admin/users/${id}/approve`);
    return response.data;
  },

  async rejectUser(id: string): Promise<ApiSimpleResponse> {
    const response = await api.patch<ApiSimpleResponse>(`/admin/users/${id}/reject`);
    return response.data;
  },

  async blockUser(id: string): Promise<ApiSimpleResponse> {
    const response = await api.patch<ApiSimpleResponse>(`/admin/users/${id}/block`);
    return response.data;
  },

  async getAreas(params: AdminListParams = {}): Promise<AdminListResponse<Area>> {
    const response = await api.get<AdminListResponse<Area>>(`/admin/areas${toQuery(params)}`);
    return response.data;
  },

  async approveArea(id: string): Promise<ApiSimpleResponse> {
    const response = await api.patch<ApiSimpleResponse>(`/admin/areas/${id}/approve`);
    return response.data;
  },

  async rejectArea(id: string): Promise<ApiSimpleResponse> {
    const response = await api.patch<ApiSimpleResponse>(`/admin/areas/${id}/reject`);
    return response.data;
  },
};
