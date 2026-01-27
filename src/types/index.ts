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

export type SpecialPriceType = 'date_range' | 'day_of_week' | 'holiday';

export interface SpecialPrice {
  type: SpecialPriceType;
  name: string; // Nome descritivo, ex: "Finais de Semana", "Natal", etc.
  price: number;
  // Para tipo 'date_range' (período específico)
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isPackage?: boolean; // Se true, vende apenas o pacote completo. Se false, vende por diária
  // Para tipo 'day_of_week' (0 = Domingo, 6 = Sábado)
  daysOfWeek?: number[];
  // Para tipo 'holiday'
  holidayDate?: string; // MM-DD (para feriados fixos como Natal)
  active: boolean;
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
  shareImageIndex?: number;
  shareImage?: string;
  faqs?: FAQ[];
  specialPrices?: SpecialPrice[];
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
  shareImageIndex?: number;
  shareImage?: string;
  faqs?: FAQ[];
  specialPrices?: SpecialPrice[];
}

export interface UpdateAreaData {
  name?: string;
  description?: string;
  address?: string;
  pricePerDay?: number;
  maxGuests?: number;
  amenities?: string[];
  images?: string[];
  shareImageIndex?: number;
  shareImage?: string;
  faqs?: FAQ[];
  specialPrices?: SpecialPrice[];
  active?: boolean;
}

// Guest Types
export interface Guest {
  _id: string;
  name: string;
  phone: string;
  cpf?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  area: string | Area;
  guest: string | User | Guest;
  guestModel?: 'User' | 'Guest';
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

// External Booking Types
export interface ExternalBookingRequest {
  areaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guest: {
    name: string;
    phone: string;
    cpf?: string;
    birthDate?: string;
  };
  totalPrice?: number;
  status?: BookingStatus;
}
