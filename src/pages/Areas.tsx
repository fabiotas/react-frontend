import { useState, useEffect } from 'react';
import { areaService } from '../services/areaService';
import { Area, FAQ } from '../types';
import { useToast } from '../components/Toast';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  DollarSign,
  Users,
  Home,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AreaWizard from '../components/AreaWizard';

export default function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const { showToast, ToastContainer } = useToast();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const response = await areaService.getMyAreas();
      setAreas(response.data);
    } catch (error: any) {
      const isNetworkError = 
        !error.response || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ERR_EMPTY_RESPONSE' ||
        error.code === 'ECONNABORTED';
      
      // Não mostrar toast para erros de rede ou 500 (backend não disponível)
      // Apenas manter array vazio silenciosamente
      if (!isNetworkError && error.response?.status !== 500) {
        showToast('Erro ao carregar áreas', 'error');
      }
      // Manter array vazio em caso de erro
      setAreas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWizard = (area?: Area) => {
    setEditingArea(area || null);
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setEditingArea(null);
  };

  const handleDelete = async (area: Area) => {
    if (!confirm(`Tem certeza que deseja excluir a área "${area.name}"?`)) {
      return;
    }

    try {
      await areaService.deleteArea(area._id);
      showToast('Área excluída com sucesso', 'success');
      loadAreas();
    } catch {
      showToast('Erro ao excluir área', 'error');
    }
  };

  const handleToggleActive = async (area: Area) => {
    try {
      await areaService.updateArea(area._id, { active: !area.active });
      showToast(
        area.active ? 'Área desativada com sucesso' : 'Área ativada com sucesso',
        'success'
      );
      loadAreas();
    } catch {
      showToast('Erro ao atualizar status da área', 'error');
    }
  };

  const handleWizardComplete = async (data: {
    name: string;
    description: string;
    address: string;
    bairro?: string;
    nomeCidade?: string;
    whatsapp?: string;
    showWhatsapp?: boolean;
    pricePerDay: number;
    maxGuests: number;
    amenities: string[];
    images: string[];
    shareImageIndex?: number;
    shareImage?: string;
    faqs: FAQ[];
  }) => {
    try {
      if (editingArea) {
        await areaService.updateArea(editingArea._id, data);
        showToast('Área atualizada com sucesso', 'success');
      } else {
        await areaService.createArea(data);
        showToast('Área criada com sucesso', 'success');
      }
      handleCloseWizard();
      loadAreas();
    } catch {
      showToast(
        editingArea ? 'Erro ao atualizar área' : 'Erro ao criar área',
        'error'
      );
      throw new Error('Erro ao salvar');
    }
  };

  const filteredAreas = areas.filter(
    (area) =>
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (area.bairro && area.bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (area.nomeCidade && area.nomeCidade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
            <Home className="w-8 h-8 text-primary-600" />
            Minhas Áreas
          </h1>
          <p className="text-neutral-500 mt-1">Gerencie suas áreas para aluguel</p>
        </div>
        <button
          onClick={() => handleOpenWizard()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg shadow-primary-200"
        >
          <Plus className="w-5 h-5" />
          Nova Área
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-4 animate-slide-up delay-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou endereço..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
          />
        </div>
      </div>

      {/* Areas Grid */}
      <div className="animate-slide-up delay-200">
        {isLoading ? (
          <div className="glass rounded-2xl flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="glass rounded-2xl text-center py-12">
            <Home className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">Nenhuma área encontrada</p>
            <p className="text-neutral-400 text-sm mt-2">
              Clique em "Nova Área" para cadastrar sua primeira propriedade
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAreas.map((area) => (
              <div
                key={area._id}
                className="glass rounded-2xl overflow-hidden hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                  {(() => {
                    // Sempre usar a primeira imagem do array para a tela principal
                    const displayImage = area.images && area.images.length > 0 ? area.images[0] : null;
                    return displayImage ? (
                      <img
                        src={displayImage}
                        alt={area.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-16 h-16 text-primary-300" />
                      </div>
                    );
                  })()}
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg text-neutral-800">
                        {area.name}
                      </h3>
                      <p className="text-neutral-500 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {area.address}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        area.active
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {area.active ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {area.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  <p className="text-neutral-600 text-sm line-clamp-2">
                    {area.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-primary-700">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(area.pricePerDay)}/dia
                    </span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Users className="w-4 h-4" />
                      Até {area.maxGuests} hóspedes
                    </span>
                  </div>

                  {area.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {area.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                      {area.amenities.length > 3 && (
                        <span className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-400 text-xs">
                          +{area.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                    <Link
                      to={`/areas/${area._id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors text-sm font-medium"
                    >
                      Ver Detalhes
                    </Link>
                    <Link
                      to={`/areas/${area._id}/bookings`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      Reservas
                    </Link>
                    <button
                      onClick={() => handleToggleActive(area)}
                      className={`p-2 rounded-lg transition-colors ${
                        area.active
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-primary-600 hover:bg-primary-50'
                      }`}
                      title={area.active ? 'Desativar' : 'Ativar'}
                    >
                      {area.active ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenWizard(area)}
                      className="p-2 rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(area)}
                      className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wizard */}
      <AreaWizard
        isOpen={isWizardOpen}
        onClose={handleCloseWizard}
        onComplete={handleWizardComplete}
        editingArea={editingArea}
      />
    </div>
  );
}
