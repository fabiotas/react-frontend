import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { areaService } from '../services/areaService';
import { Booking, Area, Guest, User } from '../types';
import { useToast } from '../components/Toast';
import {
  Calendar,
  Loader2,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  X,
  Home as HomeIcon,
  Tag,
  User as UserIcon,
  Phone,
  CreditCard,
  ExternalLink,
  Eye,
  Mail,
  Calendar as CalendarIcon,
  Info,
} from 'lucide-react';

interface LocationState {
  selectedAreaId?: string;
}

export default function Bookings() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const selectedAreaIdFromNav = state?.selectedAreaId;

  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [availableAreas, setAvailableAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'owner'>('my');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    areaId: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Abrir modal automaticamente quando vier de uma área específica
  useEffect(() => {
    if (selectedAreaIdFromNav && availableAreas.length > 0) {
      const areaExists = availableAreas.some(a => a._id === selectedAreaIdFromNav);
      if (areaExists) {
        setFormData(prev => ({
          ...prev,
          areaId: selectedAreaIdFromNav,
        }));
        setIsModalOpen(true);
        // Limpar o state da navegação para não reabrir o modal
        window.history.replaceState({}, document.title);
      }
    }
  }, [selectedAreaIdFromNav, availableAreas]);

  const loadData = async () => {
    try {
      const [myRes, ownerRes, areasRes] = await Promise.all([
        bookingService.getMyBookings(),
        bookingService.getBookingsForMyAreas(),
        areaService.getAllAreas(),
      ]);
      setMyBookings(myRes.data);
      setOwnerBookings(ownerRes.data);
      setAvailableAreas(areasRes.data.filter((a) => a.active));
    } catch (error: any) {
      // Não mostrar toast para erros 500 (problema no servidor)
      if (error.response?.status !== 500) {
        showToast('Erro ao carregar reservas', 'error');
      }
      // Manter arrays vazios em caso de erro
      setMyBookings([]);
      setOwnerBookings([]);
      setAvailableAreas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validações de pacote
      if (selectedArea && formData.checkIn && formData.checkOut) {
        const packageCheck = checkPackagePeriod(formData.checkIn, formData.checkOut, selectedArea);
        
        if (packageCheck) {
          // Se é período de pacote, deve ser exatamente o período completo
          if (!packageCheck.isExactMatch) {
            showToast(
              `Este período é vendido apenas como pacote completo (${packageCheck.specialPrice.startDate} até ${packageCheck.specialPrice.endDate})`,
              'error'
            );
            setIsSubmitting(false);
            return;
          }
          
          // Verificar se já existe reserva no período
          if (checkExistingBooking(formData.checkIn, formData.checkOut, formData.areaId)) {
            showToast('Este período já está reservado. Pacotes não permitem múltiplas reservas.', 'error');
            setIsSubmitting(false);
            return;
          }
        }
      }

      await bookingService.createBooking(formData);
      showToast('Reserva criada com sucesso!', 'success');
      handleCloseModal();
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar reserva';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (booking: Booking, status: 'confirmed' | 'cancelled') => {
    const action = status === 'confirmed' ? 'confirmar' : 'cancelar';
    if (!confirm(`Tem certeza que deseja ${action} esta reserva?`)) return;

    try {
      await bookingService.updateBookingStatus(booking._id, { status });
      showToast(`Reserva ${status === 'confirmed' ? 'confirmada' : 'cancelada'} com sucesso`, 'success');
      loadData();
    } catch {
      showToast(`Erro ao ${action} reserva`, 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPhone = (phone: string) => {
    // Se já está formatado, retornar como está
    if (phone.includes('(') || phone.includes('-')) {
      return phone;
    }
    // Se não está formatado, formatar
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const formatCPF = (cpf: string) => {
    // Se já está formatado, retornar como está
    if (cpf.includes('.')) {
      return cpf;
    }
    // Se não está formatado, formatar
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    }
    return cpf;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-primary-100 text-primary-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    };

    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="w-3 h-3" />,
      confirmed: <CheckCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
    };

    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Concluída',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  // Calcula o número de diárias (dias) incluindo check-in e check-out
  const calculateDays = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    // Incluir tanto o dia de check-in quanto o dia de check-out
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos os dias
    return days;
  };

  // Função para obter o preço de um dia específico considerando preços especiais
  const getPriceForDate = (date: Date, area: Area): { price: number; reason?: string } => {
    const basePrice = area.pricePerDay;
    
    // Verificar se a área tem specialPrices carregados
    if (!area.specialPrices || area.specialPrices.length === 0) {
      return { price: basePrice };
    }
    
    const specialPrices = area.specialPrices.filter(sp => sp.active);
    
    // Se não houver preços especiais ativos, retornar preço base
    if (specialPrices.length === 0) {
      return { price: basePrice };
    }
    
    const dayOfWeek = date.getDay(); // 0 = Dom, 6 = Sáb
    // Usar formato YYYY-MM-DD para comparação
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;
    
    // Prioridade: 1. Período especial (não-pacote), 2. Dia da semana
    
    // Verificar período especial (date_range) - apenas se não for pacote
    const dateRangePrice = specialPrices.find(sp => {
      if (sp.type !== 'date_range' || !sp.startDate || !sp.endDate) return false;
      if (sp.isPackage) return false; // Pacotes são tratados separadamente
      return fullDate >= sp.startDate && fullDate <= sp.endDate;
    });
    if (dateRangePrice) {
      return { price: dateRangePrice.price, reason: dateRangePrice.name };
    }
    
    // Verificar dia da semana
    const dayOfWeekPrice = specialPrices.find(
      sp => sp.type === 'day_of_week' && sp.daysOfWeek?.includes(dayOfWeek)
    );
    if (dayOfWeekPrice) {
      return { price: dayOfWeekPrice.price, reason: dayOfWeekPrice.name };
    }
    
    return { price: basePrice };
  };

  // Calcula detalhamento de preços por dia (incluindo check-in e check-out)
  const calculatePriceBreakdown = (checkIn: string, checkOut: string, area: Area) => {
    // Criar datas no fuso horário local para evitar problemas de UTC
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    const breakdown: { date: Date; price: number; reason?: string }[] = [];
    
    const currentDate = new Date(start);
    // Incluir o dia de check-out também (<= ao invés de <)
    while (currentDate <= end) {
      const { price, reason } = getPriceForDate(currentDate, area);
      breakdown.push({
        date: new Date(currentDate),
        price,
        reason,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return breakdown;
  };

  // Verificar se o período escolhido está dentro de um período especial que é pacote
  const checkPackagePeriod = (checkIn: string, checkOut: string, area: Area) => {
    if (!checkIn || !checkOut || !area) return null;
    
    const specialPrices = area.specialPrices?.filter(sp => sp.active && sp.type === 'date_range' && sp.isPackage) || [];
    
    for (const sp of specialPrices) {
      if (!sp.startDate || !sp.endDate) continue;
      
      const periodStart = new Date(sp.startDate);
      const periodEnd = new Date(sp.endDate);
      const bookingStart = new Date(checkIn);
      const bookingEnd = new Date(checkOut);
      
      // Verificar se o período da reserva está dentro ou sobrepõe o período do pacote
      const overlaps = (bookingStart <= periodEnd && bookingEnd >= periodStart);
      
      if (overlaps) {
        return {
          specialPrice: sp,
          isExactMatch: checkIn === sp.startDate && checkOut === sp.endDate,
        };
      }
    }
    
    return null;
  };

  // Verificar se já existe reserva no período (para pacotes)
  const checkExistingBooking = (checkIn: string, checkOut: string, areaId: string) => {
    if (!checkIn || !checkOut || !areaId) return false;
    
    const allBookings = [...myBookings, ...ownerBookings];
    const bookingStart = new Date(checkIn);
    const bookingEnd = new Date(checkOut);
    
    return allBookings.some(booking => {
      const bookingAreaId = typeof booking.area === 'string' ? booking.area : booking.area._id;
      
      if (bookingAreaId !== areaId) return false;
      if (booking.status === 'cancelled') return false;
      
      const existingStart = new Date(booking.checkIn);
      const existingEnd = new Date(booking.checkOut);
      
      // Verificar sobreposição (qualquer dia dentro do período)
      return bookingStart < bookingEnd && existingStart < existingEnd &&
             bookingStart < existingEnd && bookingEnd > existingStart;
    });
  };

  const selectedArea = availableAreas.find((a) => a._id === formData.areaId);
  const days = formData.checkIn && formData.checkOut ? calculateDays(formData.checkIn, formData.checkOut) : 0;
  
  // Verificar se é período de pacote
  const packagePeriod = selectedArea && formData.checkIn && formData.checkOut
    ? checkPackagePeriod(formData.checkIn, formData.checkOut, selectedArea)
    : null;
  
  // Verificar se já existe reserva (se for pacote)
  const hasExistingBooking = packagePeriod && packagePeriod.isExactMatch
    ? checkExistingBooking(formData.checkIn, formData.checkOut, formData.areaId)
    : false;
  
  // Calcular preço detalhado
  const priceBreakdown = selectedArea && formData.checkIn && formData.checkOut
    ? calculatePriceBreakdown(formData.checkIn, formData.checkOut, selectedArea)
    : [];
  
  // Se for pacote, o preço é fixo do período especial
  const estimatedTotal = packagePeriod && packagePeriod.isExactMatch
    ? packagePeriod.specialPrice.price
    : priceBreakdown.reduce((sum, day) => sum + day.price, 0);
  
  const hasSpecialPrices = priceBreakdown.some(day => day.reason);

  const currentBookings = activeTab === 'my' ? myBookings : ownerBookings;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary-600" />
          Reservas
        </h1>
        <p className="text-neutral-500 mt-1">Gerencie suas reservas</p>
      </div>

      {/* Tabs */}
      <div className="glass rounded-xl p-2 flex gap-2 animate-slide-up delay-100">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'my'
              ? 'bg-primary-100 text-primary-800 border border-primary-200 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Minhas Reservas ({myBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('owner')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'owner'
              ? 'bg-primary-100 text-primary-800 border border-primary-200 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Reservas Recebidas ({ownerBookings.length})
        </button>
      </div>

      {/* Bookings List */}
      <div className="animate-slide-up delay-200">
        {isLoading ? (
          <div className="glass rounded-2xl flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : currentBookings.length === 0 ? (
          <div className="glass rounded-2xl text-center py-12">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">Nenhuma reserva encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentBookings.map((booking) => {
              const area = booking.area as Area;
              const isExternalBooking = booking.guestModel === 'Guest';
              // Se guest é string (ID), não podemos mostrar informações
              const guest = typeof booking.guest === 'string' ? null : (booking.guest as Guest | User);
              const isGuest = isExternalBooking && guest && typeof guest === 'object' && 'phone' in guest && !('email' in guest);
              
              return (
                <div
                  key={booking._id}
                  className="glass rounded-2xl p-6 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-display font-bold text-lg text-neutral-800">
                          {area?.name || 'Área removida'}
                        </h3>
                        {getStatusBadge(booking.status)}
                        {isExternalBooking && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            <ExternalLink className="w-3 h-3" />
                            Reserva Externa
                          </span>
                        )}
                      </div>
                      {area && (
                        <p className="text-neutral-500 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary-600" />
                          {area.address}
                        </p>
                      )}
                      
                      {/* Informações do Hóspede */}
                      <div className="mt-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-neutral-700">
                            {isExternalBooking ? 'Hóspede (Pré-Usuário)' : 'Hóspede'}
                          </span>
                        </div>
                        {!guest ? (
                          <div className="text-sm text-neutral-500 italic">
                            Informações do hóspede não disponíveis
                          </div>
                        ) : isGuest ? (
                          <div className="space-y-1 text-sm text-neutral-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{(guest as Guest).name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              <span>{formatPhone((guest as Guest).phone)}</span>
                            </div>
                            {(guest as Guest).cpf && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-3 h-3 text-neutral-400" />
                                <span>{formatCPF((guest as Guest).cpf!)}</span>
                              </div>
                            )}
                            {(guest as Guest).birthDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-neutral-400" />
                                <span>
                                  {new Date((guest as Guest).birthDate!).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-600">
                            <span className="font-medium">{(guest as User).name}</span>
                            <span className="text-neutral-400 mx-2">•</span>
                            <span>{(guest as User).email}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-neutral-600">
                          <Calendar className="w-4 h-4 text-primary-600" />
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </span>
                        <span className="flex items-center gap-1 text-neutral-600">
                          <Users className="w-4 h-4 text-primary-600" />
                          {booking.guests} hóspedes
                        </span>
                        <span className="flex items-center gap-1 text-primary-700 font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(booking.totalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 font-medium hover:bg-neutral-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </button>
                        
                        {activeTab === 'owner' && booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(booking, 'confirmed')}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-100 text-primary-700 font-medium hover:bg-primary-200 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking, 'cancelled')}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Recusar
                            </button>
                          </>
                        )}

                        {activeTab === 'my' && booking.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(booking, 'cancelled')}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancelar
                          </button>
                        )}
                      </div>

                      {/* Botão de Cancelar Reserva - aparece para reservas não canceladas/concluídas */}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(booking, 'cancelled')}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelar Reserva
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nova Reserva */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-lg p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-neutral-800">
                Nova Reserva
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card da Área Selecionada */}
              {selectedArea && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <HomeIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-lg text-neutral-800 truncate">
                        {selectedArea.name}
                      </h3>
                      <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-primary-600 flex-shrink-0" />
                        <span className="truncate">{selectedArea.address}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-primary-700 font-semibold">
                          {(() => {
                            // Se houver datas preenchidas, calcular o preço médio considerando preços especiais
                            if (formData.checkIn && formData.checkOut && days > 0) {
                              const avgPrice = estimatedTotal / days;
                              return `${formatCurrency(avgPrice)}/dia`;
                            }
                            // Caso contrário, mostrar preço padrão
                            return `${formatCurrency(selectedArea.pricePerDay)}/dia`;
                          })()}
                        </span>
                        {formData.checkIn && formData.checkOut && hasSpecialPrices && (
                          <>
                            <span className="text-neutral-400">•</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary-200 text-primary-700 font-medium">
                              Preço especial
                            </span>
                          </>
                        )}
                        <span className="text-neutral-400">•</span>
                        <span className="text-sm text-neutral-600 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          até {selectedArea.maxGuests} hóspedes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) =>
                      setFormData({ ...formData, checkIn: e.target.value })
                    }
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOut: e.target.value })
                    }
                    required
                    min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Avisos de período especial */}
              {packagePeriod && (
                <div className={`p-3 rounded-xl border ${
                  packagePeriod.isExactMatch && !hasExistingBooking
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  {packagePeriod.isExactMatch ? (
                    <>
                      {hasExistingBooking ? (
                        <div className="flex items-start gap-2">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                              Período já reservado
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Este período é vendido apenas como pacote completo e já possui uma reserva. Pacotes não permitem múltiplas reservas.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <Tag className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">
                              Período Especial - Pacote Completo
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Este período é vendido apenas como pacote completo. O preço é fixo para todo o período.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">
                          Período inválido
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Este período é vendido apenas como pacote completo de{' '}
                          {packagePeriod.specialPrice.startDate && packagePeriod.specialPrice.endDate && (
                            <>
                              {new Date(packagePeriod.specialPrice.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
                              {new Date(packagePeriod.specialPrice.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </>
                          )}. Você deve reservar o período completo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Número de Hóspedes
                </label>
                <input
                  type="number"
                  value={formData.guests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guests: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                  min="1"
                  max={selectedArea?.maxGuests || 10}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                />
                {selectedArea && (
                  <p className="text-xs text-neutral-500">
                    Máximo: {selectedArea.maxGuests} hóspedes
                  </p>
                )}
              </div>

              {/* Resumo do preço */}
              {selectedArea && days > 0 && (
                <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
                  <h4 className="font-medium text-neutral-800 mb-3">Resumo</h4>
                  <div className="space-y-2 text-sm">
                    {/* Se for pacote, mostrar preço fixo */}
                    {packagePeriod && packagePeriod.isExactMatch ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 text-primary-600" />
                          <span className="text-xs font-medium text-primary-700">Pacote Completo</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span>
                            {packagePeriod.specialPrice.name} ({days} diária{days !== 1 ? 's' : ''})
                          </span>
                          <span className="font-medium text-primary-700">
                            {formatCurrency(estimatedTotal)}
                          </span>
                        </div>
                      </div>
                    ) : hasSpecialPrices ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {priceBreakdown.map((day, idx) => (
                          <div key={idx} className="flex justify-between text-neutral-600">
                            <span className="flex items-center gap-2">
                              {day.date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              {day.reason && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary-200 text-primary-700">
                                  {day.reason}
                                </span>
                              )}
                            </span>
                            <span className={day.reason ? 'font-medium text-primary-700' : ''}>
                              {formatCurrency(day.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between text-neutral-600">
                        <span>
                          {formatCurrency(selectedArea.pricePerDay)} x {days} diária{days !== 1 ? 's' : ''}
                        </span>
                        <span>{formatCurrency(estimatedTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-800 font-semibold pt-2 border-t border-primary-200">
                      <span>Total ({days} diária{days !== 1 ? 's' : ''})</span>
                      <span className="text-primary-700">
                        {formatCurrency(estimatedTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 px-4 rounded-xl border border-neutral-300 text-neutral-600 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    !selectedArea || 
                    days <= 0 ||
                    !!(packagePeriod && !packagePeriod.isExactMatch) ||
                    !!(packagePeriod && packagePeriod.isExactMatch && hasExistingBooking)
                  }
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Reservando...
                    </>
                  ) : (
                    'Reservar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Reserva */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/80 backdrop-blur-sm pb-4 border-b border-neutral-200">
              <h2 className="font-display text-2xl font-bold text-neutral-800">
                Detalhes da Reserva
              </h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedBooking(null);
                }}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {(() => {
                const area = selectedBooking.area as Area;
                const isExternalBooking = selectedBooking.guestModel === 'Guest';
                const guest = typeof selectedBooking.guest === 'string' ? null : (selectedBooking.guest as Guest | User);
                const isGuest = isExternalBooking && guest && typeof guest === 'object' && 'phone' in guest && !('email' in guest);

                return (
                  <>
                    {/* Informações da Área */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200">
                      <h3 className="font-semibold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                        <HomeIcon className="w-5 h-5 text-primary-600" />
                        Informações da Área
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[100px]">Nome:</span>
                          <span className="text-neutral-800">{area?.name || 'Área removida'}</span>
                        </div>
                        {area && (
                          <>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-neutral-600 min-w-[100px]">Endereço:</span>
                              <span className="text-neutral-800">{area.address}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-neutral-600 min-w-[100px]">Preço/dia:</span>
                              <span className="text-neutral-800">{formatCurrency(area.pricePerDay)}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-neutral-600 min-w-[100px]">Máx. hóspedes:</span>
                              <span className="text-neutral-800">{area.maxGuests}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Informações do Hóspede */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-white border-2 border-neutral-200">
                      <h3 className="font-semibold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-primary-600" />
                        Informações do Locatário
                        {isExternalBooking && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            <ExternalLink className="w-3 h-3" />
                            Reserva Externa
                          </span>
                        )}
                      </h3>
                      
                      {!guest ? (
                        <div className="text-sm text-neutral-500 italic">
                          Informações do hóspede não disponíveis
                        </div>
                      ) : isGuest ? (
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              Nome:
                            </span>
                            <span className="text-neutral-800">{(guest as Guest).name}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              Celular:
                            </span>
                            <span className="text-neutral-800">{formatPhone((guest as Guest).phone)}</span>
                          </div>
                          {(guest as Guest).cpf && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                                <CreditCard className="w-4 h-4" />
                                CPF:
                              </span>
                              <span className="text-neutral-800">{formatCPF((guest as Guest).cpf!)}</span>
                            </div>
                          )}
                          {(guest as Guest).birthDate && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                Data de Nascimento:
                              </span>
                              <span className="text-neutral-800">
                                {new Date((guest as Guest).birthDate!).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              Nome:
                            </span>
                            <span className="text-neutral-800">{(guest as User).name}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              E-mail:
                            </span>
                            <span className="text-neutral-800">{(guest as User).email}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              Tipo:
                            </span>
                            <span className="text-neutral-800">
                              {(guest as User).role === 'admin' ? 'Administrador' : 'Usuário Registrado'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Informações da Reserva */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200">
                      <h3 className="font-semibold text-lg text-neutral-800 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        Informações da Reserva
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[120px]">ID da Reserva:</span>
                          <span className="text-neutral-800 font-mono text-xs">{selectedBooking._id}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Check-in:
                          </span>
                          <span className="text-neutral-800">
                            {new Date(selectedBooking.checkIn).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Check-out:
                          </span>
                          <span className="text-neutral-800">
                            {new Date(selectedBooking.checkOut).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Número de Hóspedes:
                          </span>
                          <span className="text-neutral-800">{selectedBooking.guests}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[120px] flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Preço Total:
                          </span>
                          <span className="text-neutral-800 font-semibold text-lg text-primary-700">
                            {formatCurrency(selectedBooking.totalPrice)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[120px]">Status:</span>
                          <span>{getStatusBadge(selectedBooking.status)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-600 min-w-[120px]">Criada em:</span>
                          <span className="text-neutral-800">
                            {new Date(selectedBooking.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {selectedBooking.updatedAt !== selectedBooking.createdAt && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-neutral-600 min-w-[120px]">Atualizada em:</span>
                            <span className="text-neutral-800">
                              {new Date(selectedBooking.updatedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedBooking(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
