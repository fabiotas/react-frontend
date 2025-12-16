import api from './api';
import { Booking, ApiResponse, CreateBookingData, UpdateBookingData } from '../types';

interface BookingsResponse {
  success: boolean;
  count: number;
  data: Booking[];
}

export const bookingService = {
  // Obter minhas reservas (como hóspede)
  async getMyBookings(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/my');
    return response.data;
  },

  // Obter reservas das minhas áreas (como proprietário)
  async getBookingsForMyAreas(): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>('/bookings/owner');
    return response.data;
  },

  // Obter reservas de uma área específica
  async getBookingsByArea(areaId: string): Promise<BookingsResponse> {
    const response = await api.get<BookingsResponse>(`/bookings/area/${areaId}`);
    return response.data;
  },

  // Obter reserva por ID
  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return response.data;
  },

  // Criar nova reserva
  async createBooking(data: CreateBookingData): Promise<ApiResponse<Booking>> {
    const response = await api.post<ApiResponse<Booking>>('/bookings', data);
    return response.data;
  },

  // Atualizar status da reserva (confirmar, cancelar, etc)
  async updateBookingStatus(id: string, data: UpdateBookingData): Promise<ApiResponse<Booking>> {
    const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, data);
    return response.data;
  },

  // Cancelar reserva
  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`);
    return response.data;
  },
};

