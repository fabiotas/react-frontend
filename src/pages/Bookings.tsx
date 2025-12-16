import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { areaService } from '../services/areaService';
import { Booking, Area } from '../types';
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
  Plus,
} from 'lucide-react';

export default function Bookings() {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [availableAreas, setAvailableAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'owner'>('my');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleOpenModal = () => {
    setFormData({
      areaId: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await bookingService.createBooking(formData);
      showToast('Reserva criada com sucesso!', 'success');
      handleCloseModal();
      loadData();
    } catch {
      showToast('Erro ao criar reserva', 'error');
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

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const selectedArea = availableAreas.find((a) => a._id === formData.areaId);
  const nights = formData.checkIn && formData.checkOut ? calculateNights(formData.checkIn, formData.checkOut) : 0;
  const estimatedTotal = selectedArea ? selectedArea.pricePerDay * nights : 0;

  const currentBookings = activeTab === 'my' ? myBookings : ownerBookings;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary-600" />
            Reservas
          </h1>
          <p className="text-neutral-500 mt-1">Gerencie suas reservas</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg shadow-primary-200"
        >
          <Plus className="w-5 h-5" />
          Nova Reserva
        </button>
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
              return (
                <div
                  key={booking._id}
                  className="glass rounded-2xl p-6 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-bold text-lg text-neutral-800">
                          {area?.name || 'Área removida'}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      {area && (
                        <p className="text-neutral-500 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary-600" />
                          {area.address}
                        </p>
                      )}
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
                    {activeTab === 'owner' && booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(booking, 'confirmed')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-100 text-primary-700 font-medium hover:bg-primary-200 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking, 'cancelled')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Recusar
                        </button>
                      </div>
                    )}

                    {activeTab === 'my' && booking.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(booking, 'cancelled')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Selecione a Área
                </label>
                <select
                  value={formData.areaId}
                  onChange={(e) =>
                    setFormData({ ...formData, areaId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                >
                  <option value="">Escolha uma área...</option>
                  {availableAreas.map((area) => (
                    <option key={area._id} value={area._id}>
                      {area.name} - {formatCurrency(area.pricePerDay)}/dia
                    </option>
                  ))}
                </select>
              </div>

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
              {selectedArea && nights > 0 && (
                <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
                  <h4 className="font-medium text-neutral-800 mb-2">Resumo</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-neutral-600">
                      <span>
                        {formatCurrency(selectedArea.pricePerDay)} x {nights} noites
                      </span>
                      <span>{formatCurrency(estimatedTotal)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-800 font-semibold pt-2 border-t border-primary-200">
                      <span>Total</span>
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
                  disabled={isSubmitting || !selectedArea || nights <= 0}
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
    </div>
  );
}
