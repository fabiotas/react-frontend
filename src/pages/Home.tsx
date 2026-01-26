import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { areaService } from '../services/areaService';
import { bookingService } from '../services/bookingService';
import { Area, Booking } from '../types';
import {
  MapPin,
  Users,
  Home as HomeIcon,
  Search,
  Loader2,
  LogIn,
  UserPlus,
  Star,
  Wifi,
  Car,
  Coffee,
  Waves,
  ChevronRight,
  Leaf,
  Calendar,
} from 'lucide-react';

export default function Home() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    // Carregar reservas quando houver datas selecionadas e áreas carregadas
    if (checkIn && checkOut && areas.length > 0 && !isLoading) {
      loadBookings();
    } else if (!checkIn || !checkOut) {
      setBookings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, areas.length, isLoading]);

  const loadAreas = async () => {
    try {
      const response = await areaService.getAllAreas();
      setAreas(response.data);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = useCallback(async () => {
    if (areas.length === 0) return;
    
    try {
      // Buscar reservas de todas as áreas ativas
      const activeAreas = areas.filter(a => a.active);
      const allBookings: Booking[] = [];
      
      // Buscar reservas em paralelo (limitado a 10 áreas por vez para não sobrecarregar)
      const chunks = [];
      for (let i = 0; i < activeAreas.length; i += 10) {
        chunks.push(activeAreas.slice(i, i + 10));
      }
      
      for (const chunk of chunks) {
        const bookingsPromises = chunk.map(area =>
          bookingService.getBookingsByArea(area._id).catch(() => ({ data: [] }))
        );
        const results = await Promise.all(bookingsPromises);
        results.forEach(result => {
          allBookings.push(...result.data);
        });
      }
      
      setBookings(allBookings);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    }
  }, [areas]);

  // Verificar se área está disponível para o período
  const isAreaAvailable = (area: Area, startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return true; // Se não tem data, mostra todas
    if (!area.active) return false;

    const bookingStart = new Date(startDate);
    const bookingEnd = new Date(endDate);

    // Verificar períodos especiais do tipo pacote
    const packagePeriods = area.specialPrices?.filter(
      sp => sp.active && sp.type === 'date_range' && sp.isPackage
    ) || [];

    for (const packagePeriod of packagePeriods) {
      if (!packagePeriod.startDate || !packagePeriod.endDate) continue;
      
      const periodStart = new Date(packagePeriod.startDate);
      const periodEnd = new Date(packagePeriod.endDate);
      
      // Se o período escolhido está dentro ou sobrepõe um período de pacote
      if (bookingStart <= periodEnd && bookingEnd >= periodStart) {
        // Para pacote, deve ser exatamente o período completo
        if (startDate === packagePeriod.startDate && endDate === packagePeriod.endDate) {
          // Verificar se já existe reserva neste período
          const hasBooking = bookings.some(booking => {
            const bookingAreaId = typeof booking.area === 'string' ? booking.area : booking.area._id;
            if (bookingAreaId !== area._id) return false;
            if (booking.status === 'cancelled') return false;
            
            const existingStart = new Date(booking.checkIn);
            const existingEnd = new Date(booking.checkOut);
            
            return existingStart.getTime() === periodStart.getTime() && 
                   existingEnd.getTime() === periodEnd.getTime();
          });
          
          return !hasBooking; // Disponível se não tiver reserva
        } else {
          // Não é o período completo, não está disponível
          return false;
        }
      }
    }

    // Verificar reservas existentes
    const hasConflict = bookings.some(booking => {
      const bookingAreaId = typeof booking.area === 'string' ? booking.area : booking.area._id;
      if (bookingAreaId !== area._id) return false;
      if (booking.status === 'cancelled') return false;
      
      const existingStart = new Date(booking.checkIn);
      const existingEnd = new Date(booking.checkOut);
      
      // Verificar sobreposição
      return bookingStart < existingEnd && bookingEnd > existingStart;
    });

    return !hasConflict;
  };

  useEffect(() => {
    // Carregar reservas quando houver datas selecionadas e áreas carregadas
    if (checkIn && checkOut && areas.length > 0 && !isLoading) {
      loadBookings();
    } else if (!checkIn || !checkOut) {
      setBookings([]);
    }
  }, [checkIn, checkOut, areas.length, isLoading, loadBookings]);

  const filteredAreas = areas.filter((area) => {
    // Filtro de busca
    const matchesSearch = 
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filtro de disponibilidade
    if (checkIn && checkOut) {
      return isAreaAvailable(area, checkIn, checkOut);
    }
    
    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
    // Usar formato YYYY-MM-DD para comparação (evitar problemas de fuso horário)
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

  // Calcular preço total para o período
  const calculatePriceForPeriod = (area: Area, startDate: string, endDate: string): { total: number; perNight: number; hasSpecialPrice: boolean; isPackage: boolean; packageName?: string } => {
    if (!startDate || !endDate) {
      return { total: 0, perNight: 0, hasSpecialPrice: false, isPackage: false };
    }

    // Criar datas no fuso horário local para evitar problemas de UTC
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      return { total: 0, perNight: 0, hasSpecialPrice: false, isPackage: false };
    }

    // Verificar se é período de pacote
    const packagePeriods = area.specialPrices?.filter(
      sp => sp.active && sp.type === 'date_range' && sp.isPackage
    ) || [];

    for (const packagePeriod of packagePeriods) {
      if (!packagePeriod.startDate || !packagePeriod.endDate) continue;
      
      if (startDate === packagePeriod.startDate && endDate === packagePeriod.endDate) {
        return {
          total: packagePeriod.price,
          perNight: packagePeriod.price / nights,
          hasSpecialPrice: true,
          isPackage: true,
          packageName: packagePeriod.name,
        };
      }
    }

    // Calcular por diária
    let total = 0;
    let hasSpecialPrice = false;
    const currentDate = new Date(start);
    
    while (currentDate < end) {
      const { price, reason } = getPriceForDate(new Date(currentDate), area);
      total += price;
      // Se pelo menos um dia tiver preço especial, marcar como hasSpecialPrice
      if (reason) hasSpecialPrice = true;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      total,
      perNight: total / nights,
      hasSpecialPrice,
      isPackage: false,
    };
  };

  const handleReserve = (areaId: string) => {
    if (isAuthenticated) {
      navigate('/bookings', { state: { selectedAreaId: areaId } });
    } else {
      navigate('/login');
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
    if (lower.includes('estacionamento') || lower.includes('garagem')) return Car;
    if (lower.includes('café') || lower.includes('cozinha')) return Coffee;
    if (lower.includes('piscina') || lower.includes('praia')) return Waves;
    return null;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-neutral-800">AreaHub</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-neutral-500 text-sm hidden sm:block">
                    Olá, <span className="text-neutral-800 font-medium">{user?.name}</span>
                  </span>
                  <Link
                    to="/areas"
                    className="px-4 py-2 rounded-xl text-neutral-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 text-sm font-medium"
                  >
                    Minhas Áreas
                  </Link>
                  <Link
                    to="/bookings"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 text-sm shadow-md shadow-primary-200"
                  >
                    Minhas Reservas
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-neutral-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 text-sm font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 text-sm shadow-md shadow-primary-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16">
        <div className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100/50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100/40 via-transparent to-transparent" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
            <div className="text-center max-w-3xl mx-auto animate-fade-in">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-800 mb-6">
                Encontre o lugar perfeito para seu{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
                  proximo evento
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-neutral-600 mb-10">
                Descubra áreas incríveis para alugar. Desde casas de praia até sítios no campo, 
                encontre o espaço ideal para seu próximo fim de semana ou feriado.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-4xl mx-auto animate-slide-up delay-100">
                <div className="glass rounded-2xl p-4 shadow-xl shadow-primary-100">
                  <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, localização ou descrição..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                      />
                    </div>
                    
                    {/* Date Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5 ml-1">
                          Check-in
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            if (checkOut && e.target.value >= checkOut) {
                              setCheckOut('');
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5 ml-1">
                          Check-out
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    {/* Clear Filters Button */}
                    {(checkIn || checkOut || searchTerm) && (
                      <button
                        onClick={() => {
                          setCheckIn('');
                          setCheckOut('');
                          setSearchTerm('');
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Areas Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up delay-200">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-800">
              Áreas Disponíveis
            </h2>
            <p className="text-neutral-500 mt-1">
              {filteredAreas.length} {filteredAreas.length === 1 ? 'área encontrada' : 'áreas encontradas'}
            </p>
          </div>
        </div>

        {/* Areas Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="glass rounded-2xl text-center py-20 animate-fade-in">
            <HomeIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">Nenhuma área encontrada</h3>
            <p className="text-neutral-500">
              {searchTerm ? 'Tente buscar por outros termos' : 'Ainda não há áreas disponíveis'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAreas.map((area, index) => (
              <div
                key={area._id}
                className="group glass rounded-2xl overflow-hidden hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${(index % 8) * 50 + 200}ms` }}
              >
                {/* Image */}
                <Link to={`/areas/${area._id}`} className="block relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                  {area.images && area.images.length > 0 && area.images[0] ? (
                    <img
                      src={area.images[0]}
                      alt={area.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      loading="lazy"
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${area.images && area.images.length > 0 && area.images[0] ? 'bg-black/20' : ''}`}>
                    {(!area.images || area.images.length === 0 || !area.images[0]) && (
                      <HomeIcon className="w-16 h-16 text-primary-300 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </div>
                </Link>
                  
                  {/* Price Badge - Só mostra se tiver datas selecionadas */}
                  {checkIn && checkOut && (() => {
                    const priceInfo = calculatePriceForPeriod(area, checkIn, checkOut);
                    
                    return (
                      <div className="absolute top-3 right-3">
                        <div className={`px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border shadow-sm ${
                          priceInfo.hasSpecialPrice ? 'border-primary-300' : 'border-primary-100'
                        }`}>
                          <div className="flex flex-col items-end">
                            <span className="text-primary-700 font-bold">
                              {formatCurrency(priceInfo.perNight)}
                            </span>
                            <span className="text-neutral-500 text-xs">/noite</span>
                            {priceInfo.isPackage && (
                              <span className="text-xs text-primary-600 font-medium mt-0.5">
                                Pacote
                              </span>
                            )}
                            {priceInfo.hasSpecialPrice && !priceInfo.isPackage && (
                              <span className="text-xs text-primary-600 font-medium mt-0.5">
                                Preço especial
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-primary-100 shadow-sm">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-neutral-700 text-sm font-medium">4.8</span>
                    </div>
                  </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <Link to={`/areas/${area._id}`} className="block">
                    <h3 className="font-display font-bold text-lg text-neutral-800 group-hover:text-primary-700 transition-colors line-clamp-1">
                      {area.name}
                    </h3>
                    <p className="text-neutral-500 text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary-600" />
                      <span className="line-clamp-1">{area.address}</span>
                    </p>
                  </Link>

                  <p className="text-neutral-600 text-sm line-clamp-2">
                    {area.description}
                  </p>

                  {/* Amenities */}
                  {area.amenities.length > 0 && (
                    <div className="flex items-center gap-2">
                      {area.amenities.slice(0, 3).map((amenity, idx) => {
                        const Icon = getAmenityIcon(amenity);
                        return Icon ? (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center"
                            title={amenity}
                          >
                            <Icon className="w-4 h-4 text-primary-600" />
                          </div>
                        ) : (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs"
                          >
                            {amenity}
                          </span>
                        );
                      })}
                      {area.amenities.length > 3 && (
                        <span className="text-neutral-400 text-xs">
                          +{area.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 gap-2">
                    <div className="flex items-center gap-1 text-neutral-500 text-sm">
                      <Users className="w-4 h-4 text-primary-600" />
                      <span>Até {area.maxGuests} hóspedes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/areas/${area._id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary-700 text-sm font-medium hover:bg-primary-50 transition-colors"
                      >
                        Ver detalhes
                      </Link>
                      <button
                        onClick={() => handleReserve(area._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 text-sm font-medium hover:bg-primary-200 transition-colors"
                      >
                        Reservar
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="glass-green rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl shadow-primary-100">
              {/* Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/50 via-primary-50/30 to-primary-100/50" />
              
              <div className="relative">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-800 mb-4">
                  Tem um espaço para alugar?
                </h2>
                <p className="text-neutral-600 mb-8 max-w-xl mx-auto">
                  Cadastre-se gratuitamente e comece a ganhar dinheiro alugando seu espaço. 
                  É rápido, fácil e seguro.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg shadow-primary-200"
                >
                  <UserPlus className="w-5 h-5" />
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary-600" />
              <span className="font-display font-bold text-neutral-800">AreaHub</span>
            </Link>
            <p className="text-neutral-500 text-sm">
              © {new Date().getFullYear()} AreaHub. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
