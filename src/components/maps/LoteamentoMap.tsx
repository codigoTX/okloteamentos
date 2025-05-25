import React, { useState } from 'react';
import Badge from '../ui/Badge';

// Tipos para os lotes
export type LoteStatus = 'disponivel' | 'reservado' | 'vendido';

export type Lote = {
  id: string;
  numero: string;
  quadra: string;
  area: number; // em m²
  valor: number;
  status: LoteStatus;
  responsavel?: string;
  dataReserva?: string;
  dataVenda?: string;
};

type LoteamentoMapProps = {
  lotes: Lote[];
  imagemMapa: string;
  onLoteClick: (lote: Lote) => void;
};

const LoteamentoMap: React.FC<LoteamentoMapProps> = ({
  lotes,
  imagemMapa,
  onLoteClick,
}) => {
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleLoteMouseEnter = (e: React.MouseEvent, lote: Lote) => {
    setSelectedLote(lote);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    setShowTooltip(true);
  };

  const handleLoteMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleLoteClick = (lote: Lote) => {
    onLoteClick(lote);
  };

  // Função auxiliar para determinar a classe CSS com base no status do lote
  const getLoteClass = (status: LoteStatus) => {
    switch (status) {
      case 'disponivel':
        return 'lote-disponivel';
      case 'reservado':
        return 'lote-reservado';
      case 'vendido':
        return 'lote-vendido';
      default:
        return 'lote-disponivel';
    }
  };

  // Função para formatar valor em BRL
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para formatar a área
  const formatarArea = (area: number) => {
    return `${area.toLocaleString('pt-BR')} m²`;
  };

  return (
    <div className="relative">
      {/* Mapa como imagem de fundo */}
      <div className="relative w-full h-[600px] overflow-auto bg-gray-100 dark:bg-gray-700 rounded-lg">
        <img
          src={imagemMapa}
          alt="Mapa do Loteamento"
          className="w-full h-auto object-contain"
        />

        {/* Simulação de SVG overlay com lotes */}
        <svg className="absolute top-0 left-0 w-full h-full">
          {/* Esta é uma simulação - em um caso real você teria coordenadas SVG precisas para cada lote */}
          {lotes.map((lote) => (
            <rect
              key={lote.id}
              // Em um caso real, você teria coordenadas x, y, width e height para cada lote
              // Estes valores são apenas para demonstração
              x={`${Math.random() * 80}%`}
              y={`${Math.random() * 80}%`}
              width="40"
              height="30"
              className={`lote ${getLoteClass(lote.status)}`}
              onClick={() => handleLoteClick(lote)}
              onMouseEnter={(e) => handleLoteMouseEnter(e, lote)}
              onMouseLeave={handleLoteMouseLeave}
            />
          ))}
        </svg>

        {/* Tooltip com informações do lote */}
        {showTooltip && selectedLote && (
          <div
            className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-md p-3 z-10 w-60"
            style={{
              left: tooltipPosition.x + 'px',
              top: tooltipPosition.y + 'px',
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold text-lg mb-1">
              Lote {selectedLote.quadra}-{selectedLote.numero}
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600 dark:text-gray-400">Área:</span>
              <span>{formatarArea(selectedLote.area)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Valor:</span>
              <span className="font-bold">{formatarValor(selectedLote.valor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <Badge
                variant={
                  selectedLote.status === 'disponivel'
                    ? 'success'
                    : selectedLote.status === 'reservado'
                    ? 'warning'
                    : 'danger'
                }
              >
                {selectedLote.status === 'disponivel'
                  ? 'Disponível'
                  : selectedLote.status === 'reservado'
                  ? 'Reservado'
                  : 'Vendido'}
              </Badge>
            </div>
            {selectedLote.responsavel && (
              <div className="flex justify-between mt-1">
                <span className="text-gray-600 dark:text-gray-400">Responsável:</span>
                <span>{selectedLote.responsavel}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex space-x-4 items-center">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-success-500 rounded-sm mr-2"></div>
          <span>Disponível</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-warning-500 rounded-sm mr-2"></div>
          <span>Reservado</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-danger-500 rounded-sm mr-2"></div>
          <span>Vendido</span>
        </div>
      </div>
    </div>
  );
};

export default LoteamentoMap;
