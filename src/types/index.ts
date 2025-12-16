export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  active?: boolean;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Area Types
export interface FAQ {
  question: string;
  answer: string;
}

export interface Area {
  _id: string;
  name: string;
  description: string;
  address: string;
  pricePerDay: number;
  maxGuests: number;
  amenities: string[];
  images: string[];
  faqs?: FAQ[]; // Adicionar FAQs
  owner: string | User;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaData {
  name: string;
  description: string;
  address: string;
  pricePerDay: number;
  maxGuests: number;
  amenities?: string[];
  images?: string[];
  faqs?: FAQ[]; // Adicionar FAQs
}

export interface UpdateAreaData {
  name?: string;
  description?: string;
  address?: string;
  pricePerDay?: number;
  maxGuests?: number;
  amenities?: string[];
  images?: string[];
  faqs?: FAQ[]; // Adicionar FAQs
  active?: boolean;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  area: string | Area;
  guest: string | User;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  guests: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  areaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface UpdateBookingData {
  status?: BookingStatus;
}
