import { useState, useEffect } from 'react';
import { areaService } from '../services/areaService';
import { Area, SpecialPrice, SpecialPriceType } from '../types';
import { useToast } from '../components/Toast';
import {
  Tag,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Home as HomeIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export default function SpecialPrices() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [savingAreaId, setSavingAreaId] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  // Estado local para edições
  const [editingPrices, setEditingPrices] = useState<Record<string, SpecialPrice[]>>({});

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const response = await areaService.getMyAreas();
      setAreas(response.data);
      // Inicializar estado de edição com os preços atuais
      const pricesMap: Record<string, SpecialPrice[]> = {};
      response.data.forEach((area) => {
        pricesMap[area._id] = area.specialPrices || [];
      });
      setEditingPrices(pricesMap);
    } catch {
      showToast('Erro ao carregar áreas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreaId(expandedAreaId === areaId ? null : areaId);
  };

  const handleAddSpecialPrice = (areaId: string, type: SpecialPriceType) => {
    const area = areas.find((a) => a._id === areaId);
    if (!area) return;

    const newPrice: SpecialPrice = {
      type,
      name: type === 'day_of_week' ? 'Finais de Semana' : 'Período Especial',
      price: area.pricePerDay,
      active: true,
      ...(type === 'day_of_week' && { daysOfWeek: [0, 6] }),
      ...(type === 'date_range' && { startDate: '', endDate: '', isPackage: false }),
    };

    setEditingPrices((prev) => ({
      ...prev,
      [areaId]: [...(prev[areaId] || []), newPrice],
    }));
  };

  const handleRemoveSpecialPrice = (areaId: string, index: number) => {
    setEditingPrices((prev) => ({
      ...prev,
      [areaId]: prev[areaId].filter((_, i) => i !== index),
    }));
  };

  const handleUpdateSpecialPrice = (areaId: string, index: number, updates: Partial<SpecialPrice>) => {
    setEditingPrices((prev) => {
      const updated = [...prev[areaId]];
      updated[index] = { ...updated[index], ...updates };
      return { ...prev, [areaId]: updated };
    });
  };

  const toggleDayOfWeek = (areaId: string, priceIndex: number, day: number) => {
    const price = editingPrices[areaId][priceIndex];
    const currentDays = price.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    handleUpdateSpecialPrice(areaId, priceIndex, { daysOfWeek: newDays });
  };

  const isDateInPast = (dateString: string): boolean => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    return date < today;
  };

  const isPeriodInPast = (endDate: string): boolean => {
    if (!endDate) return false;
    return isDateInPast(endDate);
  };

  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const handleSave = async (areaId: string) => {
    setSavingAreaId(areaId);
    try {
      // Filtrar preços especiais válidos
      const allPrices = editingPrices[areaId] || [];
      const validPrices = allPrices.filter((sp) => {
        if (!sp.name || sp.name.trim() === '' || sp.price <= 0) {
          console.warn('Preço inválido filtrado:', sp);
          return false;
        }
        if (sp.type === 'date_range' && (!sp.startDate || !sp.endDate)) {
          console.warn('Período inválido filtrado:', sp);
          return false;
        }
        if (sp.type === 'day_of_week' && (!sp.daysOfWeek || sp.daysOfWeek.length === 0)) {
          console.warn('Dias da semana inválidos filtrados:', sp);
          return false;
        }
        return true;
      });

      // Garantir que active está definido e limpar campos undefined
      const pricesWithDefaults = validPrices.map(sp => {
        const cleaned: any = {
          type: sp.type,
          name: sp.name.trim(),
          price: sp.price,
          active: sp.active !== undefined ? sp.active : true,
        };

        // Adicionar campos específicos por tipo
        if (sp.type === 'date_range') {
          cleaned.startDate = sp.startDate;
          cleaned.endDate = sp.endDate;
          if (sp.isPackage !== undefined) {
            cleaned.isPackage = sp.isPackage;
          }
        } else if (sp.type === 'day_of_week') {
          cleaned.daysOfWeek = sp.daysOfWeek;
        } else if (sp.type === 'holiday') {
          cleaned.holidayDate = sp.holidayDate;
        }

        return cleaned;
      });

      // Log para debug
      console.log('📤 Enviando preços especiais:', {
        areaId,
        total: allPrices.length,
        validos: pricesWithDefaults.length,
        dados: pricesWithDefaults
      });

      const payload = { specialPrices: pricesWithDefaults };
      console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));

      const response = await areaService.updateArea(areaId, payload);
      
      console.log('✅ Resposta do servidor:', response);
      
      // Verificar se os dados foram salvos
      if (response.data && response.data.specialPrices) {
        console.log('✅ Preços salvos confirmados:', response.data.specialPrices);
      } else {
        console.warn('⚠️ Resposta não contém specialPrices:', response);
      }
      
      // Verificar se a resposta contém os dados atualizados
      if (response.data && response.data.specialPrices) {
        // Atualizar com os dados retornados pelo servidor
        setAreas((prev) =>
          prev.map((a) => 
            a._id === areaId 
              ? { ...a, specialPrices: response.data.specialPrices || [] }
              : a
          )
        );
        setEditingPrices((prev) => ({ 
          ...prev, 
          [areaId]: response.data.specialPrices || [] 
        }));
        showToast('Preços especiais salvos com sucesso!', 'success');
      } else {
        // Se não veio na resposta, recarregar do servidor
        console.warn('⚠️ Resposta não contém dados atualizados, recarregando...');
        await loadAreas();
        const updatedArea = areas.find(a => a._id === areaId);
        if (updatedArea) {
          setEditingPrices((prev) => ({ 
            ...prev, 
            [areaId]: updatedArea.specialPrices || [] 
          }));
        }
        showToast('Preços especiais salvos com sucesso!', 'success');
      }
    } catch (error: any) {
      console.error('Erro ao salvar preços especiais:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao salvar preços especiais';
      showToast(errorMessage, 'error');
    } finally {
      setSavingAreaId(null);
    }
  };

  const hasChanges = (areaId: string): boolean => {
    const original = areas.find((a) => a._id === areaId)?.specialPrices || [];
    const current = editingPrices[areaId] || [];
    return JSON.stringify(original) !== JSON.stringify(current);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary-600" />
          Preços Especiais
        </h1>
        <p className="text-neutral-500 mt-1">
          Configure preços diferenciados para suas áreas
        </p>
      </div>

      {/* Info Card */}
      <div className="glass rounded-xl p-4 border-l-4 border-primary-500 animate-slide-up">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-neutral-600">
            <p className="font-medium text-neutral-800 mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Dias da Semana:</strong> Preço aplicado em dias específicos (ex: finais de semana)</li>
              <li><strong>Período Especial:</strong> Preço para um intervalo de datas (ex: Carnaval, Alta temporada)</li>
            </ul>
            <p className="mt-2 text-neutral-500">
              <strong>Prioridade:</strong> Período especial → Dia da semana → Preço base
            </p>
          </div>
        </div>
      </div>

      {/* Areas List */}
      {areas.length === 0 ? (
        <div className="glass rounded-2xl text-center py-12 animate-slide-up">
          <HomeIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600">Você não possui áreas cadastradas</p>
          <p className="text-sm text-neutral-500 mt-1">
            Cadastre uma área para configurar preços especiais
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-slide-up">
          {areas.map((area) => {
            const isExpanded = expandedAreaId === area._id;
            const prices = editingPrices[area._id] || [];
            const changed = hasChanges(area._id);

            return (
              <div
                key={area._id}
                className="glass rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Area Header */}
                <button
                  onClick={() => toggleArea(area._id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <HomeIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-display font-bold text-lg text-neutral-800">
                        {area.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-neutral-500">
                        <span>Base: {formatCurrency(area.pricePerDay)}/dia</span>
                        {prices.filter((p) => p.active).length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                            {prices.filter((p) => p.active).length} preço(s) especial(is)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {changed && (
                      <span className="text-xs text-amber-600 font-medium">Não salvo</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-neutral-200">
                    {/* Add Buttons */}
                    <div className="flex flex-wrap gap-2 py-4">
                      <button
                        type="button"
                        onClick={() => handleAddSpecialPrice(area._id, 'day_of_week')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        Dias da Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSpecialPrice(area._id, 'date_range')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors"
                      >
                        <Tag className="w-4 h-4" />
                        Período Especial
                      </button>
                    </div>

                    {/* Price List */}
                    {prices.length === 0 ? (
                      <div className="text-center py-8 text-neutral-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum preço especial configurado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {prices.map((sp, index) => {
                          const isPast = sp.type === 'date_range' && isPeriodInPast(sp.endDate || '');
                          
                          return (
                            <div
                              key={index}
                              className={`border rounded-xl p-4 space-y-3 transition-colors ${
                                isPast 
                                  ? 'border-neutral-200 bg-neutral-50 opacity-60' 
                                  : 'border-neutral-200 hover:border-primary-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {sp.type === 'day_of_week' && (
                                    <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
                                      Dias da Semana
                                    </span>
                                  )}
                                  {sp.type === 'date_range' && (
                                    <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium">
                                      Período Especial
                                    </span>
                                  )}
                                  {isPast && (
                                    <span className="px-2 py-1 rounded-lg bg-neutral-200 text-neutral-500 text-xs font-medium">
                                      Período encerrado
                                    </span>
                                  )}
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={sp.active}
                                      onChange={(e) =>
                                        handleUpdateSpecialPrice(area._id, index, { active: e.target.checked })
                                      }
                                      disabled={isPast}
                                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                                    />
                                    <span className="text-xs text-neutral-500">Ativo</span>
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSpecialPrice(area._id, index)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-xs font-medium text-neutral-600">
                                    Nome/Descrição
                                  </label>
                                  <input
                                    type="text"
                                    value={sp.name}
                                    onChange={(e) =>
                                      handleUpdateSpecialPrice(area._id, index, { name: e.target.value })
                                    }
                                    disabled={isPast}
                                    placeholder="Ex: Finais de Semana, Natal..."
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-xs font-medium text-neutral-600">
                                    Preço (R$)
                                  </label>
                                  <input
                                    type="number"
                                    value={sp.price}
                                    onChange={(e) =>
                                      handleUpdateSpecialPrice(area._id, index, { price: parseFloat(e.target.value) || 0 })
                                    }
                                    disabled={isPast}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              {/* Campos específicos por tipo */}
                              {sp.type === 'day_of_week' && (
                                <div className="space-y-1">
                                  <label className="block text-xs font-medium text-neutral-600">
                                    Dias aplicáveis
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map((day) => (
                                      <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDayOfWeek(area._id, index, day.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                          sp.daysOfWeek?.includes(day.value)
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                        }`}
                                      >
                                        {day.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {sp.type === 'date_range' && (
                                <div className="space-y-2">
                                  <label className="block text-xs font-medium text-neutral-600">
                                    Período
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-neutral-500 mb-1">De</label>
                                      <input
                                        type="date"
                                        value={sp.startDate || ''}
                                        onChange={(e) =>
                                          handleUpdateSpecialPrice(area._id, index, { startDate: e.target.value })
                                        }
                                        disabled={isPast}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-neutral-500 mb-1">Até</label>
                                      <input
                                        type="date"
                                        value={sp.endDate || ''}
                                        onChange={(e) =>
                                          handleUpdateSpecialPrice(area._id, index, { endDate: e.target.value })
                                        }
                                        disabled={isPast}
                                        min={sp.startDate || new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all disabled:bg-neutral-100 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                  </div>
                                  {sp.startDate && sp.endDate && (
                                    <p className="text-xs text-neutral-500">
                                      {formatDateDisplay(sp.startDate)} até {formatDateDisplay(sp.endDate)}
                                    </p>
                                  )}
                                  <div className="pt-2 border-t border-neutral-200">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={sp.isPackage || false}
                                        onChange={(e) =>
                                          handleUpdateSpecialPrice(area._id, index, { isPackage: e.target.checked })
                                        }
                                        disabled={isPast}
                                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                                      />
                                      <div className="flex-1">
                                        <span className="text-xs font-medium text-neutral-700">
                                          Vender como pacote completo
                                        </span>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                          {sp.isPackage 
                                            ? 'Apenas o período completo pode ser reservado (não permite múltiplas reservas)'
                                            : 'Permite reservas por diária no período (permite múltiplas reservas)'}
                                        </p>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Indicador de diferença */}
                              {sp.price !== area.pricePerDay && !isPast && (
                                <div className={`text-xs font-medium ${
                                  sp.price > area.pricePerDay ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {sp.price > area.pricePerDay ? '↑' : '↓'}{' '}
                                  {Math.abs(((sp.price - area.pricePerDay) / area.pricePerDay) * 100).toFixed(0)}%{' '}
                                  {sp.price > area.pricePerDay ? 'mais caro' : 'mais barato'} que o preço base
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 mt-4 border-t border-neutral-200">
                      <button
                        onClick={() => handleSave(area._id)}
                        disabled={!changed || savingAreaId === area._id}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-200"
                      >
                        {savingAreaId === area._id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar Alterações'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
