import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { areaService } from '../services/areaService';
import { Booking, Area } from '../types';
import { 
  Users, 
  Shield, 
  Activity, 
  TrendingUp,
  ArrowRight,
  Home,
  Calendar,
  DollarSign,
  CalendarCheck,
  CalendarX,
  BarChart3,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MonthlyStats {
  month: string;
  revenue: number;
  bookings: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [myAreas, setMyAreas] = useState<Area[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [areasRes, myBookingsRes, ownerBookingsRes] = await Promise.all([
        areaService.getMyAreas(),
        bookingService.getMyBookings(),
        bookingService.getBookingsForMyAreas(),
      ]);
      setMyAreas(areasRes.data);
      setMyBookings(myBookingsRes.data);
      setOwnerBookings(ownerBookingsRes.data);
    } catch (error: any) {
      const isNetworkError = 
        !error.response || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ERR_EMPTY_RESPONSE' ||
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error';
      
      // Não logar erros de rede ou 500 (backend não disponível ou problema no servidor)
      // Apenas manter arrays vazios silenciosamente
      if (!isNetworkError && error.response?.status !== 500) {
        console.error('Erro ao carregar dados:', error);
      }
      setMyAreas([]);
      setMyBookings([]);
      setOwnerBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estatísticas
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtrar reservas confirmadas/completadas do proprietário
  const confirmedOwnerBookings = ownerBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed'
  );

  // Receita do mês atual
  const monthlyRevenue = confirmedOwnerBookings
    .filter((b) => {
      const bookingDate = new Date(b.checkIn);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    })
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Receita do ano
  const yearlyRevenue = confirmedOwnerBookings
    .filter((b) => new Date(b.checkIn).getFullYear() === currentYear)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Total de reservas recebidas (como proprietário)
  const totalOwnerBookings = ownerBookings.length;
  const pendingBookings = ownerBookings.filter((b) => b.status === 'pending').length;
  const confirmedBookingsCount = ownerBookings.filter((b) => b.status === 'confirmed').length;

  // Calcular finais de semana disponíveis no mês atual
  const getWeekendsInMonth = () => {
    const weekends: { start: Date; end: Date }[] = [];
    const year = currentYear;
    const month = currentMonth;
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    // Encontrar todos os finais de semana
    const current = new Date(firstDay);
    while (current <= lastDay) {
      const dayOfWeek = current.getDay();
      
      // Sexta-feira (5)
      if (dayOfWeek === 5) {
        const friday = new Date(current);
        const sunday = new Date(current);
        sunday.setDate(sunday.getDate() + 2);
        
        // Só adiciona se domingo ainda estiver no mês ou próximo
        if (friday >= now) {
          weekends.push({ start: friday, end: sunday });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    
    return weekends;
  };

  const checkWeekendAvailability = (weekend: { start: Date; end: Date }) => {
    // Verifica se alguma área está disponível neste final de semana
    const activeAreas = myAreas.filter((a) => a.active);
    
    return activeAreas.map((area) => {
      const hasConflict = confirmedOwnerBookings.some((booking) => {
        if ((booking.area as Area)._id !== area._id) return false;
        
        const bookingStart = new Date(booking.checkIn);
        const bookingEnd = new Date(booking.checkOut);
        
        // Verifica sobreposição
        return (weekend.start <= bookingEnd && weekend.end >= bookingStart);
      });
      
      return {
        area,
        available: !hasConflict,
      };
    });
  };

  const weekends = getWeekendsInMonth();
  const availableWeekends = weekends.filter((weekend) => {
    const availability = checkWeekendAvailability(weekend);
    return availability.some((a) => a.available);
  });

  // Dados mensais dos últimos 6 meses
  const getMonthlyStats = (): MonthlyStats[] => {
    const stats: MonthlyStats[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthBookings = confirmedOwnerBookings.filter((b) => {
        const bookingDate = new Date(b.checkIn);
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear();
      });
      
      stats.push({
        month: month.charAt(0).toUpperCase() + month.slice(1),
        revenue: monthBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        bookings: monthBookings.length,
      });
    }
    
    return stats;
  };

  const monthlyStats = getMonthlyStats();
  const maxRevenue = Math.max(...monthlyStats.map((s) => s.revenue), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getMonthName = () => {
    return now.toLocaleDateString('pt-BR', { month: 'long' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-800 mb-2">
              Olá, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-neutral-500 text-lg">
              Confira o desempenho das suas locações
            </p>
          </div>
          {user?.role === 'admin' && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-200">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">Administrador</span>
            </div>
          )}
        </div>
        {user?.role === 'admin' && (
          <div className="md:hidden mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-200">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-xs">Administrador</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6 animate-slide-up delay-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm font-medium mb-1">Receita do Mês</p>
              <p className="text-primary-700 text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
              <p className="text-neutral-400 text-xs mt-1 capitalize">{getMonthName()}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary-100">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 animate-slide-up delay-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm font-medium mb-1">Receita do Ano</p>
              <p className="text-primary-700 text-2xl font-bold">{formatCurrency(yearlyRevenue)}</p>
              <p className="text-neutral-400 text-xs mt-1">{currentYear}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary-100">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 animate-slide-up delay-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm font-medium mb-1">Reservas Pendentes</p>
              <p className="text-yellow-600 text-2xl font-bold">{pendingBookings}</p>
              <p className="text-neutral-400 text-xs mt-1">Aguardando confirmação</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 animate-slide-up delay-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm font-medium mb-1">Total de Reservas</p>
              <p className="text-neutral-800 text-2xl font-bold">{totalOwnerBookings}</p>
              <p className="text-neutral-400 text-xs mt-1">{confirmedBookingsCount} confirmadas</p>
            </div>
            <div className="p-3 rounded-xl bg-primary-100">
              <CalendarCheck className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="glass rounded-2xl p-6 animate-slide-up delay-500">
          <h2 className="font-display text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Receita dos Últimos 6 Meses
          </h2>
          
          <div className="space-y-4">
            {monthlyStats.map((stat, index) => (
              <div key={stat.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 font-medium">{stat.month}</span>
                  <span className="text-neutral-800 font-semibold">{formatCurrency(stat.revenue)}</span>
                </div>
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(stat.revenue / maxRevenue) * 100}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-400">{stat.bookings} reserva(s)</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekends Availability */}
        <div className="glass rounded-2xl p-6 animate-slide-up delay-500">
          <h2 className="font-display text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Finais de Semana - {getMonthName().charAt(0).toUpperCase() + getMonthName().slice(1)}
          </h2>
          
          {myAreas.length === 0 ? (
            <div className="text-center py-8">
              <Home className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">Você ainda não possui áreas cadastradas</p>
              <Link
                to="/areas"
                className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Cadastrar área
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : weekends.length === 0 ? (
            <div className="text-center py-8">
              <CalendarX className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">Não há mais finais de semana neste mês</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm mb-4">
                <span className="flex items-center gap-2 text-primary-600">
                  <CheckCircle className="w-4 h-4" />
                  Disponível
                </span>
                <span className="flex items-center gap-2 text-red-500">
                  <XCircle className="w-4 h-4" />
                  Reservado
                </span>
              </div>

              {weekends.map((weekend, idx) => {
                const availability = checkWeekendAvailability(weekend);
                const hasAvailable = availability.some((a) => a.available);
                
                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      hasAvailable 
                        ? 'bg-primary-50 border-primary-200' 
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-neutral-800">
                        {formatDate(weekend.start)} - {formatDate(weekend.end)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        hasAvailable 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {hasAvailable ? `${availability.filter(a => a.available).length} disponível` : 'Ocupado'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {availability.map((item) => (
                        <span
                          key={item.area._id}
                          className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                            item.available
                              ? 'bg-white text-primary-700 border border-primary-200'
                              : 'bg-neutral-100 text-neutral-500 line-through'
                          }`}
                        >
                          {item.available ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {item.area.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 animate-slide-up delay-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold text-neutral-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Reservas Recentes
            </h2>
            <Link 
              to="/bookings"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {ownerBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">Nenhuma reserva recebida ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ownerBookings.slice(0, 5).map((booking) => {
                const area = booking.area as Area;
                const statusConfig: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
                  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
                  confirmed: { bg: 'bg-primary-100', text: 'text-primary-700', icon: <CheckCircle className="w-3 h-3" /> },
                  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3 h-3" /> },
                  completed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <CheckCircle className="w-3 h-3" /> },
                };
                const status = statusConfig[booking.status] || statusConfig.pending;
                
                return (
                  <div 
                    key={booking._id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Home className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-800">{area?.name || 'Área'}</p>
                        <p className="text-neutral-500 text-sm">
                          {new Date(booking.checkIn).toLocaleDateString('pt-BR')} - {new Date(booking.checkOut).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-700">{formatCurrency(booking.totalPrice)}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.icon}
                        {booking.status === 'pending' && 'Pendente'}
                        {booking.status === 'confirmed' && 'Confirmada'}
                        {booking.status === 'cancelled' && 'Cancelada'}
                        {booking.status === 'completed' && 'Concluída'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-2xl p-6 animate-slide-up delay-500">
          <h2 className="font-display text-lg font-bold text-neutral-800 mb-4">
            Ações Rápidas
          </h2>
          <div className="space-y-3">
            <Link
              to="/areas"
              className="group flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-neutral-800 font-semibold text-sm">Minhas Áreas</p>
                  <p className="text-neutral-400 text-xs">{myAreas.length} cadastrada(s)</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/bookings"
              className="group flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-neutral-800 font-semibold text-sm">Reservas</p>
                  <p className="text-neutral-400 text-xs">{myBookings.length} como hóspede</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/users"
                className="group flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-neutral-800 font-semibold text-sm">Usuários</p>
                    <p className="text-neutral-400 text-xs">Gerenciar</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </Link>
            )}

            {/* User Info */}
            <div className={`mt-6 p-4 rounded-xl border ${
              user?.role === 'admin'
                ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'
                : 'bg-primary-50 border-primary-100'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user?.role === 'admin'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-700 ring-2 ring-purple-200'
                    : 'bg-gradient-to-br from-primary-500 to-primary-700'
                }`}>
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-800 text-sm">{user?.name}</p>
                    {user?.role === 'admin' && (
                      <Shield className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-neutral-500 text-xs">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  user?.role === 'admin' 
                    ? 'bg-purple-200 text-purple-800 shadow-sm' 
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  <Shield className={`w-3.5 h-3.5 ${user?.role === 'admin' ? 'text-purple-700' : ''}`} />
                  {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
