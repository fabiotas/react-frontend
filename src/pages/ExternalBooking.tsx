import { useState, useEffect } from 'react';
import { areaService } from '../services/areaService';
import { Area } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ExternalBookingForm from '../components/ExternalBookingForm';
import { useToast } from '../components/Toast';
import {
  UserPlus,
  Loader2,
  Home as HomeIcon,
  MapPin,
  DollarSign,
  Users,
  Search,
} from 'lucide-react';

export default function ExternalBooking() {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setIsLoading(true);
      const response = await areaService.getMyAreas();
      // Filtrar apenas áreas ativas ou todas se for admin
      const filteredAreas = response.data.filter(area => {
        const ownerId = typeof area.owner === 'string' ? area.owner : area.owner._id;
        return ownerId === user?._id || user?.role === 'admin';
      });
      setAreas(filteredAreas);
    } catch (error: any) {
      const isNetworkError = 
        !error.response || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ERR_EMPTY_RESPONSE' ||
        error.code === 'ECONNABORTED';
      
      if (!isNetworkError && error.response?.status !== 500) {
        showToast('Erro ao carregar áreas', 'error');
      }
      setAreas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAreaSelect = (area: Area) => {
    setSelectedArea(area);
  };

  const handleCloseForm = () => {
    setSelectedArea(null);
  };

  const handleSuccess = () => {
    showToast('Reserva externa criada com sucesso!', 'success');
    setSelectedArea(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedArea) {
    return (
      <>
        <ToastContainer />
        <ExternalBookingForm
          area={selectedArea}
          onSuccess={handleSuccess}
          onClose={handleCloseForm}
        />
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-primary-600" />
          Cadastrar Reserva Externa
        </h1>
        <p className="text-neutral-500 mt-1">
          Selecione a área para cadastrar uma reserva feita fora do site
        </p>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-4 animate-slide-up delay-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar área por nome ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
      </div>

      {/* Areas List */}
      <div className="animate-slide-up delay-200">
        {isLoading ? (
          <div className="glass rounded-2xl flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="glass rounded-2xl text-center py-12">
            <HomeIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">
              {searchTerm ? 'Nenhuma área encontrada' : 'Você não possui áreas cadastradas'}
            </p>
            {!searchTerm && (
              <p className="text-sm text-neutral-500">
                Cadastre uma área primeiro para poder criar reservas externas
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAreas.map((area) => (
              <button
                key={area._id}
                onClick={() => handleAreaSelect(area)}
                className="glass rounded-2xl p-6 text-left hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <h3 className="font-display font-bold text-lg text-neutral-800 mb-2 group-hover:text-primary-700 transition-colors">
                      {area.name}
                    </h3>
                    <p className="text-neutral-500 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary-600 flex-shrink-0" />
                      <span className="truncate">{area.address}</span>
                    </p>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 pt-2 border-t border-neutral-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-primary-600" />
                        Preço
                      </span>
                      <span className="font-semibold text-primary-700">
                        {formatCurrency(area.pricePerDay)}/dia
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 flex items-center gap-1">
                        <Users className="w-4 h-4 text-primary-600" />
                        Hóspedes
                      </span>
                      <span className="font-semibold text-neutral-800">
                        Até {area.maxGuests}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-2 border-t border-neutral-200">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        area.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {area.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
