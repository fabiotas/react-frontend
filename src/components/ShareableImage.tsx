import { useRef, useEffect, useState } from 'react';
import { Area } from '../types';
import { Download, X, Loader2, Leaf } from 'lucide-react';

interface ShareableImageProps {
  area: Area;
  startDate: Date;
  endDate: Date;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareableImage({ area, startDate, endDate, isOpen, onClose }: ShareableImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [areaImageLoaded, setAreaImageLoaded] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Carregar imagem da área
      const areaImage = area.images && area.images.length > 0 ? area.images[0] : null;
      if (areaImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setAreaImageLoaded(areaImage);
        };
        img.onerror = () => {
          setAreaImageLoaded(null);
        };
        img.src = areaImage;
      } else {
        setAreaImageLoaded(null);
      }
    }
  }, [isOpen, area]);

  useEffect(() => {
    if (isOpen && canvasRef.current && (areaImageLoaded !== null || !area.images || area.images.length === 0)) {
      generateImage();
    }
  }, [isOpen, area, startDate, endDate, areaImageLoaded]);

  const generateImage = async () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Não foi possível obter contexto do canvas');
      }

      // Dimensões para stories (9:16)
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;

      // Carregar imagem de fundo
      if (areaImageLoaded) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = areaImageLoaded;
        });

        // Desenhar imagem de fundo (tela inteira)
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        // Gradiente de fundo se não houver imagem
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Overlay escuro na parte inferior da imagem para melhorar legibilidade do texto
      const overlayGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
      overlayGradient.addColorStop(0, 'transparent');
      overlayGradient.addColorStop(0.4, 'rgba(0,0,0,0.5)');
      overlayGradient.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, height * 0.6, width, height * 0.4);

      // Badge "Disponível" - posicionado mais embaixo, sobre a imagem
      const badgeY = height * 0.65;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
      const badgeWidth = 400;
      const badgeHeight = 100;
      const badgeX = (width - badgeWidth) / 2;
      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(badgeX + radius, badgeY);
      ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
      ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
      ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
      ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
      ctx.lineTo(badgeX, badgeY + radius);
      ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
      ctx.closePath();
      ctx.fill();

      // Texto "Disponível"
      ctx.fillStyle = 'white';
      ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Disponível', width / 2, badgeY + badgeHeight / 2);

      // Data - posicionada logo abaixo do badge
      const dateY = badgeY + badgeHeight + 50;
      ctx.font = '700 48px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      const dateText = formatDateRange();
      const lines = wrapText(ctx, dateText, width - 120, 48);
      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, dateY + (index * 60));
      });

      // Nome da área - logo abaixo da data
      const areaNameY = dateY + (lines.length * 60) + 30;
      ctx.font = '600 40px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.textAlign = 'center';
      
      const nameLines = wrapText(ctx, area.name, width - 120, 40);
      nameLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, areaNameY + (index * 50));
      });

      // Resetar sombra
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Rodapé "Reserve no AreaHub" com logo
      const footerY = height - 100;
      ctx.font = '600 32px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.textAlign = 'center';
      
      // Texto "Reserve no"
      ctx.fillText('Reserve no', width / 2, footerY);
      
      // Logo AreaHub - desenhar igual à página inicial (div com gradiente + ícone Leaf)
      const logoSize = 60;
      const logoX = width / 2;
      const logoY = footerY + 50;
      
      // Desenhar fundo da logo (rounded-xl com gradiente igual à página inicial)
      const logoGradient = ctx.createLinearGradient(logoX - logoSize/2, logoY - logoSize/2, logoX + logoSize/2, logoY + logoSize/2);
      logoGradient.addColorStop(0, '#667eea'); // from-primary-500
      logoGradient.addColorStop(1, '#764ba2'); // to-primary-700
      ctx.fillStyle = logoGradient;
      ctx.beginPath();
      const cornerRadius = 12; // rounded-xl
      ctx.moveTo(logoX - logoSize/2 + cornerRadius, logoY - logoSize/2);
      ctx.lineTo(logoX + logoSize/2 - cornerRadius, logoY - logoSize/2);
      ctx.quadraticCurveTo(logoX + logoSize/2, logoY - logoSize/2, logoX + logoSize/2, logoY - logoSize/2 + cornerRadius);
      ctx.lineTo(logoX + logoSize/2, logoY + logoSize/2 - cornerRadius);
      ctx.quadraticCurveTo(logoX + logoSize/2, logoY + logoSize/2, logoX + logoSize/2 - cornerRadius, logoY + logoSize/2);
      ctx.lineTo(logoX - logoSize/2 + cornerRadius, logoY + logoSize/2);
      ctx.quadraticCurveTo(logoX - logoSize/2, logoY + logoSize/2, logoX - logoSize/2, logoY + logoSize/2 - cornerRadius);
      ctx.lineTo(logoX - logoSize/2, logoY - logoSize/2 + cornerRadius);
      ctx.quadraticCurveTo(logoX - logoSize/2, logoY - logoSize/2, logoX - logoSize/2 + cornerRadius, logoY - logoSize/2);
      ctx.closePath();
      ctx.fill();
      
      // Criar SVG do Leaf (exatamente como no lucide-react)
      const iconSize = logoSize * 0.6; // w-6 h-6 proporcional
      const svgString = `
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `.trim();
      
      // Converter SVG para imagem e desenhar no canvas
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const leafImg = new Image();
      await new Promise((resolve, reject) => {
        leafImg.onload = resolve;
        leafImg.onerror = reject;
        leafImg.src = svgUrl;
      });
      
      // Desenhar ícone Leaf branco no centro do fundo
      ctx.drawImage(leafImg, logoX - iconSize/2, logoY - iconSize/2, iconSize, iconSize);
      
      // Limpar URL
      URL.revokeObjectURL(svgUrl);
      
      // Texto "AreaHub" abaixo da logo
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillText('AreaHub', width / 2, footerY + 120);

      // Converter para URL
      const url = canvas.toDataURL('image/png');
      setImageUrl(url);
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Erro ao gerar imagem. Por favor, tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const downloadImage = () => {
    if (!imageUrl) return;

    const dateStr = `${startDate.toLocaleDateString('pt-BR')}-${endDate.toLocaleDateString('pt-BR')}`.replace(/\//g, '-');
    const link = document.createElement('a');
    link.download = `areahub-${area.name}-${dateStr}.png`;
    link.href = imageUrl;
    link.click();
  };

  const formatDateRange = () => {
    const start = startDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const end = endDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    
    // Se for o mesmo mês e ano, simplificar
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      const startDay = startDate.toLocaleDateString('pt-BR', { day: '2-digit' });
      const endDay = endDate.toLocaleDateString('pt-BR', { day: '2-digit' });
      const monthYear = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return `${startDay} a ${endDay} de ${monthYear}`;
    }
    
    return `${start} a ${end}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">Compartilhar Disponibilidade</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-neutral-600 mb-2">
              Preview da imagem que será gerada:
            </p>
            {isGenerating ? (
              <div className="flex items-center justify-center py-12 bg-neutral-50 rounded-xl">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : imageUrl ? (
              <div className="border-2 border-neutral-200 rounded-xl overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="border-2 border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
                <div className="aspect-[9/16] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Canvas (hidden) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 p-6 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={downloadImage}
            disabled={!imageUrl || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Baixar Imagem
          </button>
        </div>
      </div>
    </div>
  );
}
