import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Trash2, Plus, Loader2, Share2 } from 'lucide-react';
import { Area, FAQ } from '../types';
import { uploadImage, deleteImage } from '../services/supabase';
import { useToast } from './Toast';

interface AreaWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
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
  }) => Promise<void>;
  editingArea?: Area | null;
}

export default function AreaWizard({ isOpen, onClose, onComplete, editingArea }: AreaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast, ToastContainer } = useToast();

  // Etapa 1: Informações básicas
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    address: '',
    bairro: '',
    nomeCidade: '',
    whatsapp: '',
    showWhatsapp: false,
    pricePerDay: 0,
    maxGuests: 1,
    amenities: '',
  });

  // Etapa 2: Imagens
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [tempAreaId, setTempAreaId] = useState<string>('');
  const [shareImageIndex, setShareImageIndex] = useState<number>(0);
  const [shareImage, setShareImage] = useState<string>(''); // Imagem específica de compartilhamento
  const [uploadingShareImage, setUploadingShareImage] = useState<boolean>(false);
  const [useCustomShareImage, setUseCustomShareImage] = useState<boolean>(false);

  // Etapa 3: FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  // Sincronizar estado quando editingArea mudar ou modal abrir
  useEffect(() => {
    if (isOpen) {
      if (editingArea) {
        setBasicInfo({
          name: editingArea.name || '',
          description: editingArea.description || '',
          address: editingArea.address || '',
          bairro: editingArea.bairro || '',
          nomeCidade: editingArea.nomeCidade || '',
          whatsapp: editingArea.whatsapp || '',
          showWhatsapp: editingArea.showWhatsapp || false,
          pricePerDay: editingArea.pricePerDay || 0,
          maxGuests: editingArea.maxGuests || 1,
          amenities: editingArea.amenities?.join(', ') || '',
        });
        const areaImages = editingArea.images || [];
        setImages(areaImages);
        setFaqs(editingArea.faqs || []);
        setShareImageIndex(editingArea.shareImageIndex ?? 0);
        setShareImage(editingArea.shareImage || '');
        // Se tiver shareImage ou não tiver imagens, usar imagem específica
        setUseCustomShareImage(!!editingArea.shareImage || areaImages.length === 0);
        setTempAreaId(editingArea._id); // Usar ID real quando editando
      } else {
        // Reset para novo cadastro
        setBasicInfo({
          name: '',
          description: '',
          address: '',
          bairro: '',
          nomeCidade: '',
          whatsapp: '',
          showWhatsapp: false,
          pricePerDay: 0,
          maxGuests: 1,
          amenities: '',
        });
        setImages([]);
        setFaqs([]);
        setShareImageIndex(0);
        setShareImage('');
        setUseCustomShareImage(false);
        setTempAreaId('');
      }
      setCurrentStep(1);
    }
  }, [isOpen, editingArea]);

  // Validar shareImageIndex quando imagens mudarem
  useEffect(() => {
    if (images.length === 0) {
      setShareImageIndex(0);
    } else if (shareImageIndex >= images.length) {
      setShareImageIndex(0);
    }
  }, [images, shareImageIndex]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Usar ID real da área se estiver editando, senão criar temporário
    let areaId = tempAreaId;
    if (!areaId) {
      areaId = `temp-${Date.now()}`;
      setTempAreaId(areaId);
    }

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          showToast('Apenas arquivos de imagem são permitidos', 'error');
          continue;
        }

        // Validar tamanho do arquivo (10MB)
        if (file.size > 10 * 1024 * 1024) {
          showToast(`Arquivo ${file.name} excede 10MB`, 'error');
          continue;
        }

        const fileName = file.name;
        setUploadingImages((prev: string[]) => [...prev, fileName]);

        try {
          const imageUrl = await uploadImage(file, areaId);
          setImages((prev: string[]) => {
            const newImages = [...prev, imageUrl];
            // Se for a primeira imagem, definir como imagem de compartilhamento
            if (prev.length === 0) {
              setShareImageIndex(0);
            }
            return newImages;
          });
          showToast('Imagem enviada com sucesso', 'success');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          showToast(`Erro ao enviar ${fileName}: ${errorMessage}`, 'error');
        } finally {
          setUploadingImages((prev: string[]) => prev.filter((name: string) => name !== fileName));
        }
      }

    // Limpar input
    e.target.value = '';
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    try {
      // Se for uma URL do Supabase, tentar deletar
      if (imageUrl.includes('supabase')) {
        await deleteImage(imageUrl);
      }
      const newImages = images.filter((_: string, i: number) => i !== index);
      setImages(newImages);
      
      // Ajustar shareImageIndex se necessário
      if (newImages.length === 0) {
        setShareImageIndex(0);
      } else if (shareImageIndex >= newImages.length) {
        setShareImageIndex(0);
      } else if (index < shareImageIndex) {
        // Se removemos uma imagem antes da selecionada, ajustar índice
        setShareImageIndex(shareImageIndex - 1);
      }
      
      showToast('Imagem removida', 'success');
    } catch (error) {
      // Se falhar ao deletar, apenas remover da lista
      const newImages = images.filter((_: string, i: number) => i !== index);
      setImages(newImages);
      
      // Ajustar shareImageIndex se necessário
      if (newImages.length === 0) {
        setShareImageIndex(0);
      } else if (shareImageIndex >= newImages.length) {
        setShareImageIndex(0);
      } else if (index < shareImageIndex) {
        setShareImageIndex(shareImageIndex - 1);
      }
      
      showToast('Imagem removida da lista', 'success');
    }
  };

  const handleShareImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Apenas arquivos de imagem são permitidos', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Arquivo excede 10MB', 'error');
      return;
    }

    let areaId = tempAreaId;
    if (!areaId) {
      areaId = `temp-${Date.now()}`;
      setTempAreaId(areaId);
    }

    setUploadingShareImage(true);
    try {
      const imageUrl = await uploadImage(file, areaId);
      setShareImage(imageUrl);
      setUseCustomShareImage(true);
      showToast('Imagem de compartilhamento enviada com sucesso', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao enviar imagem: ${errorMessage}`, 'error');
    } finally {
      setUploadingShareImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveShareImage = async () => {
    try {
      if (shareImage.includes('supabase')) {
        await deleteImage(shareImage);
      }
      setShareImage('');
      setUseCustomShareImage(false);
      showToast('Imagem de compartilhamento removida', 'success');
    } catch (error) {
      setShareImage('');
      setUseCustomShareImage(false);
      showToast('Imagem de compartilhamento removida', 'success');
    }
  };

  const handleAddFAQ = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleUpdateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validar etapa 1
      if (!basicInfo.name || !basicInfo.description || !basicInfo.address) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
      }
      if (basicInfo.pricePerDay <= 0) {
        showToast('O preço por dia deve ser maior que zero', 'error');
        return;
      }
      if (basicInfo.maxGuests < 1) {
        showToast('O número máximo de hóspedes deve ser pelo menos 1', 'error');
        return;
      }
    }
    // Etapa 2 e 3 não têm validação obrigatória
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const amenitiesArray = basicInfo.amenities
        .split(',')
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0);

      // Preparar dados de compartilhamento
      const shareData: { shareImageIndex?: number; shareImage?: string } = {};
      if (useCustomShareImage && shareImage) {
        shareData.shareImage = shareImage;
      } else if (!useCustomShareImage && images.length > 0) {
        shareData.shareImageIndex = shareImageIndex;
      }

      // Preparar dados para envio
      const submitData: {
        name: string;
        description: string;
        address: string;
        bairro?: string;
        nomeCidade?: string;
        whatsapp?: string;
        showWhatsapp: boolean;
        pricePerDay: number;
        maxGuests: number;
        amenities: string[];
        images: string[];
        shareImageIndex?: number;
        shareImage?: string;
        faqs: FAQ[];
      } = {
        name: basicInfo.name,
        description: basicInfo.description,
        address: basicInfo.address,
        pricePerDay: basicInfo.pricePerDay,
        maxGuests: basicInfo.maxGuests,
        amenities: amenitiesArray,
        images,
        showWhatsapp: basicInfo.showWhatsapp,
        ...shareData,
      };

      // Sempre incluir bairro, nomeCidade e whatsapp quando editando para garantir atualização
      // Quando editando, sempre enviar os campos (mesmo que vazios) para permitir limpar
      const bairroValue = basicInfo.bairro.trim();
      const nomeCidadeValue = basicInfo.nomeCidade.trim();
      const whatsappValue = basicInfo.whatsapp.trim();

      if (editingArea) {
        // Na edição, sempre enviar os campos (usar string vazia se vazio para garantir que seja enviado)
        submitData.bairro = bairroValue;
        submitData.nomeCidade = nomeCidadeValue;
        submitData.whatsapp = whatsappValue;
      } else {
        // Na criação, só enviar se tiver valor
        if (bairroValue) submitData.bairro = bairroValue;
        if (nomeCidadeValue) submitData.nomeCidade = nomeCidadeValue;
        if (whatsappValue) submitData.whatsapp = whatsappValue;
      }

      // Filtrar FAQs válidos (com pergunta e resposta preenchidas)
      const validFaqs = faqs.filter((faq: FAQ) => faq.question.trim() && faq.answer.trim());
      submitData.faqs = validFaqs;

      await onComplete(submitData);
      
      // Reset será feito pelo useEffect quando o modal fechar
    } catch (error) {
      // Erro já é tratado no onComplete, apenas re-throw para não resetar o form
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-fade-in">
        <div className="glass rounded-2xl w-full max-w-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-800">
                {editingArea ? 'Editar Área' : 'Nova Área'}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Etapa {currentStep} de 3
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full mx-1 ${
                    step <= currentStep ? 'bg-primary-600' : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Informações</span>
              <span>Imagens</span>
              <span>FAQs</span>
            </div>
          </div>

          {/* Step 1: Informações Básicas */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Nome da Área *
                </label>
                <input
                  type="text"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="Casa de praia, Apartamento, Sítio..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Descrição *
                </label>
                <textarea
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200 resize-none"
                  placeholder="Descreva sua área..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Endereço *
                </label>
                <input
                  type="text"
                  value={basicInfo.address}
                  onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="Rua, número..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={basicInfo.bairro}
                    onChange={(e) => setBasicInfo({ ...basicInfo, bairro: e.target.value })}
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="Nome do bairro"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={basicInfo.nomeCidade}
                    onChange={(e) => setBasicInfo({ ...basicInfo, nomeCidade: e.target.value })}
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={basicInfo.whatsapp}
                  onChange={(e) => {
                    // Remover caracteres não numéricos
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 15) {
                      setBasicInfo({ ...basicInfo, whatsapp: value });
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="11987654321"
                />
                <p className="text-xs text-neutral-500">
                  Apenas números (10 a 15 dígitos)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showWhatsapp"
                  checked={basicInfo.showWhatsapp}
                  onChange={(e) => setBasicInfo({ ...basicInfo, showWhatsapp: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="showWhatsapp" className="text-sm font-medium text-neutral-700 cursor-pointer">
                  Exibir WhatsApp no perfil da área
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Preço por dia (R$) *
                  </label>
                  <input
                    type="number"
                    value={basicInfo.pricePerDay}
                    onChange={(e) =>
                      setBasicInfo({
                        ...basicInfo,
                        pricePerDay: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="150.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Máx. Hóspedes *
                  </label>
                  <input
                    type="number"
                    value={basicInfo.maxGuests}
                    onChange={(e) =>
                      setBasicInfo({
                        ...basicInfo,
                        maxGuests: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Comodidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={basicInfo.amenities}
                  onChange={(e) => setBasicInfo({ ...basicInfo, amenities: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  placeholder="Wi-Fi, Piscina, Churrasqueira, Estacionamento..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Upload de Imagens */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="w-12 h-12 text-neutral-400" />
                  <div>
                    <span className="text-primary-600 font-medium">Clique para enviar</span>
                    <span className="text-neutral-500"> ou arraste as imagens aqui</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    PNG, JPG, GIF até 10MB
                  </p>
                </label>
              </div>

              {uploadingImages.length > 0 && (
                <div className="bg-primary-50 rounded-xl p-4">
                  <p className="text-sm text-primary-700 mb-2">Enviando imagens...</p>
                  {uploadingImages.map((name) => (
                    <div key={name} className="flex items-center gap-2 text-sm text-primary-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {name}
                    </div>
                  ))}
                </div>
              )}

              {/* Seção de Imagem de Compartilhamento */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-neutral-800">Imagem de Compartilhamento</h3>
                  </div>
                  {images.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomShareImage}
                          onChange={(e) => {
                            setUseCustomShareImage(e.target.checked);
                            if (!e.target.checked) {
                              setShareImage('');
                            }
                          }}
                          className="rounded"
                        />
                        <span>Usar imagem específica</span>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-sm text-neutral-600 mb-3">
                  {useCustomShareImage 
                    ? 'Faça upload de uma imagem específica para compartilhamento em redes sociais'
                    : images.length > 0
                    ? 'Selecione qual imagem será exibida quando a área for compartilhada em redes sociais'
                    : 'Faça upload de uma imagem específica para compartilhamento em redes sociais (ou adicione imagens primeiro)'}
                </p>
                
                {useCustomShareImage || images.length === 0 ? (
                  <div className="space-y-3">
                    {shareImage ? (
                      <div className="relative">
                        <img
                          src={shareImage}
                          alt="Imagem de compartilhamento"
                          className="w-full h-48 object-cover rounded-lg border-2 border-primary-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Imagem de Compartilhamento
                        </div>
                        <button
                          onClick={handleRemoveShareImage}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Remover imagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-primary-300 rounded-xl p-6 text-center">
                        <input
                          type="file"
                          id="share-image-upload"
                          accept="image/*"
                          onChange={handleShareImageUpload}
                          className="hidden"
                          disabled={uploadingShareImage}
                        />
                        <label
                          htmlFor="share-image-upload"
                          className={`cursor-pointer flex flex-col items-center gap-3 ${uploadingShareImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {uploadingShareImage ? (
                            <>
                              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                              <span className="text-primary-600 font-medium">Enviando imagem...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 text-primary-400" />
                              <div>
                                <span className="text-primary-600 font-medium">Clique para enviar</span>
                                <span className="text-neutral-500"> uma imagem específica para compartilhamento</span>
                              </div>
                              <p className="text-xs text-neutral-400">
                                PNG, JPG, GIF até 10MB
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  images[shareImageIndex] && (
                    <div className="relative">
                      <img
                        src={images[shareImageIndex]}
                        alt="Imagem de compartilhamento selecionada"
                        className="w-full h-48 object-cover rounded-lg border-2 border-primary-500"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem de compartilhamento:', images[shareImageIndex]);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Imagem de Compartilhamento
                      </div>
                    </div>
                  )
                )}
              </div>

              {images.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-3">Todas as Imagens</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className={`relative group cursor-pointer transition-all ${
                            !useCustomShareImage && shareImageIndex === index 
                              ? 'ring-2 ring-primary-500 ring-offset-2' 
                              : ''
                          }`}
                          onClick={() => {
                            if (!useCustomShareImage) {
                              setShareImageIndex(index);
                            }
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Área ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl"
                            onError={(e) => {
                              console.error(`Erro ao carregar imagem ${index + 1}:`, imageUrl);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            loading="lazy"
                          />
                          {!useCustomShareImage && shareImageIndex === index && (
                            <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-primary-600 text-white text-xs font-medium flex items-center gap-1">
                              <Share2 className="w-3 h-3" />
                              Compartilhamento
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(imageUrl, index);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover imagem"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {!useCustomShareImage && (
                      <p className="text-xs text-neutral-500 mt-2">
                        Clique em uma imagem para defini-la como imagem de compartilhamento
                      </p>
                    )}
                  </div>
                </div>
              )}

              {images.length === 0 && uploadingImages.length === 0 && (
                <div className="text-center py-8 text-neutral-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma imagem enviada ainda</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Perguntas Frequentes */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-800">
                  Perguntas Frequentes
                </h3>
                <button
                  onClick={handleAddFAQ}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar FAQ
                </button>
              </div>

              {faqs.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <p>Nenhuma pergunta frequente cadastrada</p>
                  <p className="text-sm mt-2">
                    Adicione perguntas que os hóspedes podem ter sobre sua área
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-neutral-200 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-neutral-600">
                          Pergunta {index + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveFAQ(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) =>
                          handleUpdateFAQ(index, 'question', e.target.value)
                        }
                        placeholder="Ex: Qual o horário de check-in?"
                        className="w-full px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) =>
                          handleUpdateFAQ(index, 'answer', e.target.value)
                        }
                        placeholder="Ex: O check-in é a partir das 14h..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-200 resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-neutral-200">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-300 text-neutral-600 font-semibold hover:bg-neutral-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-neutral-300 text-neutral-600 font-semibold hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200"
              >
                Próximo
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {editingArea ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
