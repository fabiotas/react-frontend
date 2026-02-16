import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { areaService } from '../services/areaService';
import { Area } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin,
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Home as HomeIcon,
  Calendar,
  CheckCircle,
  XCircle,
  Wifi,
  Car,
  Coffee,
  Waves,
  Leaf,
  LogIn,
  HelpCircle,
  Tag,
  Phone,
} from 'lucide-react';

export default function AreaDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [area, setArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadArea();
    }
  }, [id]);

  // Atualizar meta tags para compartilhamento
  useEffect(() => {
    if (!area) return;

    // Determinar imagem para compartilhamento (meta tags):
    // 1. Se houver shareImage (imagem específica de compartilhamento), usar ela
    // 2. Se houver shareImageIndex definido, usar images[shareImageIndex]
    // 3. Caso contrário, usar images[0] como fallback
    let shareImage = '';
    if (area.shareImage) {
      shareImage = area.shareImage;
    } else if (area.shareImageIndex !== undefined && area.images && area.images.length > 0) {
      const index = area.shareImageIndex;
      if (index >= 0 && index < area.images.length) {
        shareImage = area.images[index];
      } else if (area.images.length > 0) {
        shareImage = area.images[0];
      }
    } else if (area.images && area.images.length > 0) {
      shareImage = area.images[0];
    }
    const title = `${area.name} - AreaHub`;
    const description = area.description || '';

    // Remover meta tags antigas
    const removeMetaTag = (property: string) => {
      const existing = document.querySelector(`meta[property="${property}"]`) || 
                       document.querySelector(`meta[name="${property}"]`);
      if (existing) {
        existing.remove();
      }
    };

    // Adicionar/atualizar meta tags Open Graph
    const setMetaTag = (property: string, content: string, isProperty = true) => {
      removeMetaTag(property);
      const meta = document.createElement('meta');
      if (isProperty) {
        meta.setAttribute('property', property);
      } else {
        meta.setAttribute('name', property);
      }
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    };

    // Open Graph
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    if (shareImage) {
      setMetaTag('og:image', shareImage);
    }
    setMetaTag('og:type', 'website');
    setMetaTag('og:url', window.location.href);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', title, false);
    setMetaTag('twitter:description', description, false);
    if (shareImage) {
      setMetaTag('twitter:image', shareImage, false);
    }

    // Title da página
    document.title = title;

    // Cleanup: remover meta tags quando componente desmontar ou área mudar
    return () => {
      const metaTags = [
        'og:title', 'og:description', 'og:image', 'og:type', 'og:url',
        'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'
      ];
      metaTags.forEach(tag => {
        removeMetaTag(tag);
      });
    };
  }, [area]);

  const loadArea = async () => {
    try {
      setIsLoading(true);
      const response = await areaService.getAreaById(id!);
      setArea(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar área:', error);
      if (error.response?.status === 404) {
        navigate('/');
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const nextImage = () => {
    if (area && area.images && area.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % area.images.length);
    }
  };

  const prevImage = () => {
    if (area && area.images && area.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + area.images.length) % area.images.length);
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleReserve = () => {
    if (isAuthenticated) {
      navigate('/bookings', { state: { selectedAreaId: id } });
    } else {
      navigate('/login', { state: { returnTo: `/areas/${id}`, message: 'Faça login para fazer uma reserva' } });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          <p className="text-neutral-500">Carregando detalhes da área...</p>
        </div>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HomeIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">Área não encontrada</h2>
          <p className="text-neutral-500 mb-6">A área que você está procurando não existe ou foi removida.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para início
          </Link>
        </div>
      </div>
    );
  }

  const hasImages = area.images && area.images.length > 0;
  const currentImage = hasImages ? area.images[currentImageIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-neutral-800">AreaHub</span>
            </Link>

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-neutral-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="pt-16">
        {/* Image Gallery */}
        <div className="relative">
          <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
            {currentImage ? (
              <img
                src={currentImage}
                alt={area.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <HomeIcon className="w-32 h-32 text-primary-300" />
              </div>
            )}

          {/* Image Navigation */}
          {hasImages && area.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-6 h-6 text-neutral-700" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="w-6 h-6 text-neutral-700" />
              </button>

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {area.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>

              {/* Image Counter */}
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm">
                {currentImageIndex + 1} / {area.images.length}
              </div>
            </>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm ${
                area.active
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {area.active ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Disponível
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Indisponível
                </>
              )}
            </span>
          </div>
          </div>

          {/* Thumbnail Gallery */}
          {hasImages && area.images.length > 1 && (
            <div className="bg-white border-t border-neutral-200 p-4">
              <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-2">
                {area.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-primary-600 ring-2 ring-primary-200'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${area.name} - Imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title and Location */}
              <div className="glass rounded-2xl p-6">
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-neutral-800 mb-4">
                  {area.name}
                </h1>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <span className="text-lg">{area.address}</span>
                  </div>
                  {(area.bairro || area.nomeCidade) && (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm pl-7">
                      {area.bairro && <span>{area.bairro}</span>}
                      {area.bairro && area.nomeCidade && <span>•</span>}
                      {area.nomeCidade && <span>{area.nomeCidade}</span>}
                    </div>
                  )}
                  {area.showWhatsapp && area.whatsapp && (
                    <div className="flex items-center gap-2 text-primary-600 pl-7">
                      <Phone className="w-4 h-4" />
                      <a
                        href={`https://wa.me/${area.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline"
                      >
                        {(() => {
                          const phone = area.whatsapp;
                          if (phone.length === 11) {
                            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                          } else if (phone.length === 10) {
                            return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                          }
                          return phone;
                        })()}
                      </a>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="prose max-w-none">
                  <p className="text-neutral-700 text-lg leading-relaxed whitespace-pre-line">
                    {area.description}
                  </p>
                </div>
              </div>

              {/* Amenities */}
              {area.amenities && area.amenities.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-display text-2xl font-bold text-neutral-800 mb-6">
                    Comodidades
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {area.amenities.map((amenity, index) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all"
                        >
                          {Icon ? (
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-primary-600" />
                            </div>
                          )}
                          <span className="text-neutral-700 font-medium text-sm">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {area.faqs && area.faqs.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h2 className="font-display text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-primary-600" />
                    Perguntas Frequentes
                  </h2>
                  <div className="space-y-3">
                    {area.faqs.map((faq, index) => (
                      <div
                        key={index}
                        className="border border-neutral-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors"
                      >
                        <button
                          onClick={() =>
                            setExpandedFaqIndex(expandedFaqIndex === index ? null : index)
                          }
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                        >
                          <span className="font-semibold text-neutral-800 pr-4">{faq.question}</span>
                          <ChevronRight
                            className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${
                              expandedFaqIndex === index ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        {expandedFaqIndex === index && (
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-neutral-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Booking Card */}
                <div className="glass rounded-2xl p-6 border-2 border-primary-100">
                  <div className="space-y-6">
                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-neutral-800">
                          {formatCurrency(area.pricePerDay)}
                        </span>
                        <span className="text-neutral-500">/dia</span>
                      </div>
                      <p className="text-sm text-neutral-500">
                        Preço base por noite de hospedagem
                      </p>
                    </div>

                    {/* Preços Especiais */}
                    {area.specialPrices && area.specialPrices.filter(sp => sp.active).length > 0 && (
                      <div className="pt-4 border-t border-neutral-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                          <Tag className="w-4 h-4 text-primary-600" />
                          Preços Especiais
                        </div>
                        <div className="space-y-2">
                          {area.specialPrices.filter(sp => sp.active).map((sp, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm p-2 rounded-lg bg-primary-50"
                            >
                              <span className="text-neutral-600">{sp.name}</span>
                              <span className={`font-semibold ${
                                sp.price > area.pricePerDay ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {formatCurrency(sp.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-3 pt-4 border-t border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Users className="w-5 h-5 text-primary-600" />
                          <span>Máximo de hóspedes</span>
                        </div>
                        <span className="font-semibold text-neutral-800">{area.maxGuests}</span>
                      </div>
                    </div>

                    {/* Reserve Button */}
                    <button
                      onClick={handleReserve}
                      disabled={!area.active}
                      className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                        area.active
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                          : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      {isAuthenticated ? (
                        <>
                          <Calendar className="w-5 h-5" />
                          Fazer Reserva
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          Fazer Login para Reservar
                        </>
                      )}
                    </button>

                    {!area.active && (
                      <p className="text-sm text-center text-red-600">
                        Esta área não está disponível para reservas no momento.
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-semibold text-neutral-800 mb-4">Informações</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Cadastrada em:</span>
                      <span className="text-neutral-700 font-medium">
                        {formatDate(area.createdAt)}
                      </span>
                    </div>
                    {area.updatedAt !== area.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Atualizada em:</span>
                        <span className="text-neutral-700 font-medium">
                          {formatDate(area.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

