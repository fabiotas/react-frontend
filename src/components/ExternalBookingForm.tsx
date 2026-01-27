import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { Area, BookingStatus } from '../types';
import { useToast } from './Toast';
import { maskPhone, maskCPF, removeNonNumeric, validatePhone, validateCPFFormat, validateBirthDate } from '../utils/masks';
import { X, Loader2, Calendar, Users, DollarSign, User as UserIcon, Phone, CreditCard, Calendar as CalendarIcon } from 'lucide-react';

interface ExternalBookingFormProps {
  area: Area;
  onSuccess?: () => void;
  onClose: () => void;
}

export default function ExternalBookingForm({ area, onSuccess, onClose }: ExternalBookingFormProps) {
  const { showToast, ToastContainer } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    guest: {
      name: '',
      phone: '',
      cpf: '',
      birthDate: '',
    },
    totalPrice: '',
    status: 'confirmed' as BookingStatus,
  });

  // Calcular preço total automaticamente quando datas mudarem
  useEffect(() => {
    if (formData.checkIn && formData.checkOut && !formData.totalPrice) {
      calculatePrice();
    }
  }, [formData.checkIn, formData.checkOut, formData.guests]);

  const calculatePrice = () => {
    if (!formData.checkIn || !formData.checkOut) return;

    const start = new Date(formData.checkIn + 'T00:00:00');
    const end = new Date(formData.checkOut + 'T00:00:00');

    // Incluir tanto o dia de check-in quanto o dia de check-out
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) return;

    // Calcular preço considerando preços especiais
    let total = 0;
    const currentDate = new Date(start);

    // Incluir o dia de check-out também (<= ao invés de <)
    while (currentDate <= end) {
      const priceInfo = getPriceForDate(currentDate, area);
      total += priceInfo.price;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setFormData(prev => ({ ...prev, totalPrice: total.toFixed(2) }));
  };

  const getPriceForDate = (date: Date, area: Area): { price: number } => {
    const basePrice = area.pricePerDay;
    
    if (!area.specialPrices || area.specialPrices.length === 0) {
      return { price: basePrice };
    }
    
    const specialPrices = area.specialPrices.filter(sp => sp.active);
    if (specialPrices.length === 0) {
      return { price: basePrice };
    }
    
    const dayOfWeek = date.getDay();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;
    
    // Verificar período especial (date_range) - apenas se não for pacote
    const dateRangePrice = specialPrices.find(sp => {
      if (sp.type !== 'date_range' || !sp.startDate || !sp.endDate) return false;
      if (sp.isPackage) return false;
      return fullDate >= sp.startDate && fullDate <= sp.endDate;
    });
    if (dateRangePrice) {
      return { price: dateRangePrice.price };
    }
    
    // Verificar dia da semana
    const dayOfWeekPrice = specialPrices.find(
      sp => sp.type === 'day_of_week' && sp.daysOfWeek?.includes(dayOfWeek)
    );
    if (dayOfWeekPrice) {
      return { price: dayOfWeekPrice.price };
    }
    
    return { price: basePrice };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações da reserva
    if (!formData.checkIn) {
      newErrors.checkIn = 'Data de check-in é obrigatória';
    } else {
      const checkInDate = new Date(formData.checkIn);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkInDate < today) {
        newErrors.checkIn = 'Data de check-in não pode ser no passado';
      }
    }

    if (!formData.checkOut) {
      newErrors.checkOut = 'Data de check-out é obrigatória';
    } else if (formData.checkIn) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = 'Data de check-out deve ser posterior ao check-in';
      }
    }

    if (formData.guests < 1) {
      newErrors.guests = 'Número de hóspedes deve ser pelo menos 1';
    } else if (formData.guests > area.maxGuests) {
      newErrors.guests = `Número de hóspedes não pode exceder ${area.maxGuests}`;
    }

    // Validações do hóspede
    if (!formData.guest.name || formData.guest.name.trim().length < 2) {
      newErrors['guest.name'] = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.guest.name.length > 100) {
      newErrors['guest.name'] = 'Nome não pode exceder 100 caracteres';
    }

    if (!formData.guest.phone) {
      newErrors['guest.phone'] = 'Celular é obrigatório';
    } else if (!validatePhone(formData.guest.phone)) {
      newErrors['guest.phone'] = 'Celular inválido';
    }

    if (formData.guest.cpf && !validateCPFFormat(formData.guest.cpf)) {
      newErrors['guest.cpf'] = 'CPF deve ter 11 dígitos';
    }

    if (formData.guest.birthDate && !validateBirthDate(formData.guest.birthDate)) {
      newErrors['guest.birthDate'] = 'Data de nascimento não pode ser no futuro';
    }

    if (formData.totalPrice && parseFloat(formData.totalPrice) <= 0) {
      newErrors.totalPrice = 'Preço total deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await bookingService.createExternalBooking({
        areaId: area._id,
        checkIn: new Date(formData.checkIn + 'T00:00:00').toISOString(),
        checkOut: new Date(formData.checkOut + 'T00:00:00').toISOString(),
        guests: formData.guests,
        guest: {
          name: formData.guest.name.trim(),
          phone: removeNonNumeric(formData.guest.phone),
          cpf: formData.guest.cpf ? removeNonNumeric(formData.guest.cpf) : undefined,
          birthDate: formData.guest.birthDate ? new Date(formData.guest.birthDate + 'T00:00:00').toISOString() : undefined,
        },
        totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : undefined,
        status: formData.status,
      });

      showToast('Reserva externa criada com sucesso!', 'success');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setFormData({
        checkIn: '',
        checkOut: '',
        guests: 1,
        guest: {
          name: '',
          phone: '',
          cpf: '',
          birthDate: '',
        },
        totalPrice: '',
        status: 'confirmed',
      });
      
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar reserva externa';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcula o número de diárias (dias) incluindo check-in e check-out
  const calculateDays = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const start = new Date(formData.checkIn + 'T00:00:00');
    const end = new Date(formData.checkOut + 'T00:00:00');
    // Incluir tanto o dia de check-in quanto o dia de check-out
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos os dias
  };

  const days = calculateDays();

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-fade-in">
        <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-slide-up shadow-2xl">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/80 backdrop-blur-sm pb-4 border-b border-neutral-200">
            <h2 className="font-display text-2xl font-bold text-neutral-800">
              Cadastrar Reserva Externa
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações da Área */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200">
              <h3 className="font-semibold text-neutral-800 mb-2">{area.name}</h3>
              <p className="text-sm text-neutral-600">{area.address}</p>
              <p className="text-sm text-primary-700 font-medium mt-1">
                {formatCurrency(area.pricePerDay)}/dia
              </p>
            </div>

            {/* Informações da Reserva */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Informações da Reserva
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Check-in <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => {
                      setFormData({ ...formData, checkIn: e.target.value });
                      setErrors({ ...errors, checkIn: '' });
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 rounded-xl bg-white border ${
                      errors.checkIn ? 'border-red-300' : 'border-neutral-200'
                    } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                  />
                  {errors.checkIn && (
                    <p className="text-xs text-red-600">{errors.checkIn}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Check-out <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => {
                      setFormData({ ...formData, checkOut: e.target.value });
                      setErrors({ ...errors, checkOut: '' });
                    }}
                    min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 rounded-xl bg-white border ${
                      errors.checkOut ? 'border-red-300' : 'border-neutral-200'
                    } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                  />
                  {errors.checkOut && (
                    <p className="text-xs text-red-600">{errors.checkOut}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Número de Hóspedes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.guests}
                    onChange={(e) => {
                      setFormData({ ...formData, guests: parseInt(e.target.value) || 1 });
                      setErrors({ ...errors, guests: '' });
                    }}
                    min="1"
                    max={area.maxGuests}
                    className={`w-full px-4 py-3 rounded-xl bg-white border ${
                      errors.guests ? 'border-red-300' : 'border-neutral-200'
                    } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                  />
                  {errors.guests && (
                    <p className="text-xs text-red-600">{errors.guests}</p>
                  )}
                  <p className="text-xs text-neutral-500">
                    Máximo: {area.maxGuests} hóspedes
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Preço Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, totalPrice: e.target.value });
                      setErrors({ ...errors, totalPrice: '' });
                    }}
                    placeholder="Será calculado automaticamente"
                    className={`w-full px-4 py-3 rounded-xl bg-white border ${
                      errors.totalPrice ? 'border-red-300' : 'border-neutral-200'
                    } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                  />
                  {errors.totalPrice && (
                    <p className="text-xs text-red-600">{errors.totalPrice}</p>
                  )}
                  {formData.totalPrice && !errors.totalPrice && (
                    <p className="text-xs text-neutral-500">
                      {days} diária{days !== 1 ? 's' : ''} • {formatCurrency(parseFloat(formData.totalPrice))}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                >
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>
            </div>

            {/* Informações do Hóspede */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary-600" />
                Informações do Hóspede (Pré-Usuário)
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.guest.name}
                  onChange={(e) => {
                    setFormData({ ...formData, guest: { ...formData.guest, name: e.target.value } });
                    setErrors({ ...errors, 'guest.name': '' });
                  }}
                  maxLength={100}
                  className={`w-full px-4 py-3 rounded-xl bg-white border ${
                    errors['guest.name'] ? 'border-red-300' : 'border-neutral-200'
                  } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                />
                {errors['guest.name'] && (
                  <p className="text-xs text-red-600">{errors['guest.name']}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Celular <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.guest.phone}
                  onChange={(e) => {
                    const masked = maskPhone(e.target.value);
                    setFormData({ ...formData, guest: { ...formData.guest, phone: masked } });
                    setErrors({ ...errors, 'guest.phone': '' });
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className={`w-full px-4 py-3 rounded-xl bg-white border ${
                    errors['guest.phone'] ? 'border-red-300' : 'border-neutral-200'
                  } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                />
                {errors['guest.phone'] && (
                  <p className="text-xs text-red-600">{errors['guest.phone']}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.guest.cpf}
                    onChange={(e) => {
                      const masked = maskCPF(e.target.value);
                      setFormData({ ...formData, guest: { ...formData.guest, cpf: masked } });
                      setErrors({ ...errors, 'guest.cpf': '' });
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full px-4 py-3 rounded-xl bg-white border ${
                      errors['guest.cpf'] ? 'border-red-300' : 'border-neutral-200'
                    } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                  />
                  {errors['guest.cpf'] && (
                    <p className="text-xs text-red-600">{errors['guest.cpf']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.guest.birthDate}
                    onChange={(e) => {
                      setFormData({ ...formData, guest: { ...formData.guest, birthDate: e.target.value } });
                      setErrors({ ...errors, 'guest.birthDate': '' });
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 rounded-xl bg-white border ${
                      errors['guest.birthDate'] ? 'border-red-300' : 'border-neutral-200'
                    } text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all`}
                  />
                  {errors['guest.birthDate'] && (
                    <p className="text-xs text-red-600">{errors['guest.birthDate']}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-300 text-neutral-600 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Cadastrar Reserva Externa'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
