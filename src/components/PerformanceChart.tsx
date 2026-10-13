import React, { useState, useMemo } from 'react';
import { TrendingUp, Award, Activity, Calendar, Zap, Users } from 'lucide-react';
import { Match, MatchTimelinePoint } from '../types';
import { calculateTimelineEvolution } from '../utils/calculations';
import { OFFICIAL_PLAYERS } from '../constants';

interface PerformanceChartProps {
  matches: Match[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ matches }) => {
  const [viewMode, setViewMode] = useState<'cumulative' | 'per_match'>('cumulative');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);

  const timeline = useMemo(() => {
    return calculateTimelineEvolution(matches, 2026);
  }, [matches]);

  // Compute graph bounds
  const { minVal, maxVal, playerKeys } = useMemo(() => {
    const pKeys = OFFICIAL_PLAYERS.map(p => p.id);
    let min = Infinity;
    let max = -Infinity;

    timeline.forEach(point => {
      pKeys.forEach(pId => {
        const pData = point.players[pId];
        if (pData) {
          const val = viewMode === 'cumulative' ? pData.cumulativePE : pData.peGained;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 150;

    // Add padding to margins
    const margin = viewMode === 'cumulative' ? 10 : 2;
    const computedMin = Math.max(0, Math.floor(min - margin));
    const computedMax = Math.ceil(max + margin);

    return {
      minVal: computedMin,
      maxVal: computedMax,
      playerKeys: pKeys,
    };
  }, [timeline, viewMode]);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 320;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (timeline.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (timeline.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    if (maxVal === minVal) return paddingTop + chartHeight / 2;
    const ratio = (val - minVal) / (maxVal - minVal);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Generate grid ticks
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    const step = (maxVal - minVal) / (count - 1);
    for (let i = 0; i < count; i++) {
      ticks.push(Number((minVal + i * step).toFixed(1)));
    }
    return ticks;
  }, [minVal, maxVal]);

  const activePoint: MatchTimelinePoint = selectedPointIndex !== null && timeline[selectedPointIndex]
    ? timeline[selectedPointIndex]
    : timeline[timeline.length - 1];

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-amber-400" size={20} />
            <h3 className="text-base sm:text-lg font-bold font-serif text-stone-100">
              Evolução de Desempenho ao Longo do Ano
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Acompanhe o ganho contínuo de Pontos de Eficiência (PE) partida a partida.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="grid grid-cols-2 sm:flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('cumulative')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
              viewMode === 'cumulative'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            PE Acumulado (Total)
          </button>
          <button
            onClick={() => setViewMode('per_match')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
              viewMode === 'per_match'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            PE por Partida
          </button>
        </div>
      </div>

      {/* Player Legend / Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
        <span className="text-stone-400 text-[11px] font-medium mr-1 flex items-center gap-1">
          <Users size={12} />
          Jogadores:
        </span>
        {OFFICIAL_PLAYERS.map(player => {
          const isHighlighted = highlightedPlayerId === player.id;
          const isMuted = highlightedPlayerId !== null && !isHighlighted;
          return (
            <button
              key={player.id}
              onClick={() => {
                setHighlightedPlayerId(prev => (prev === player.id ? null : player.id));
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs ${
                isHighlighted
                  ? 'border-amber-400 bg-amber-500/10 text-stone-100 font-bold'
                  : isMuted
                  ? 'border-stone-800 bg-stone-950/40 text-stone-500 opacity-60'
                  : 'border-stone-800 bg-stone-950 text-stone-300 hover:border-stone-700'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: player.colorHex }}
              />
              <span>{player.name}</span>
            </button>
          );
        })}
        {highlightedPlayerId && (
          <button
            onClick={() => setHighlightedPlayerId(null)}
            className="text-[11px] text-amber-400 hover:underline ml-1"
          >
            Ver todos
          </button>
        )}
      </div>

      {/* SVG Chart Area */}
      <div className="relative bg-stone-950/70 border border-stone-800/80 rounded-xl p-2 sm:p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[550px] h-auto select-none overflow-visible"
        >
          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#292524"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#78716c"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Vertical Guides for Each Match */}
          {timeline.map((point, idx) => {
            const x = getX(idx);
            const isSelected = activePoint.index === idx;
            return (
              <g key={`xguide-${idx}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={svgHeight - paddingBottom}
                  stroke={isSelected ? '#d97706' : '#292524'}
                  strokeWidth={isSelected ? '1.5' : '0.5'}
                  strokeDasharray={isSelected ? undefined : '2 4'}
                  opacity={isSelected ? 0.9 : 0.4}
                />
                {/* X-axis label */}
                <text
                  x={x}
                  y={svgHeight - paddingBottom + 16}
                  fill={isSelected ? '#fbbf24' : '#a8a29e'}
                  fontSize={idx === 0 ? '9' : '10'}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  textAnchor="middle"
                  className="cursor-pointer"
                  onClick={() => setSelectedPointIndex(idx)}
                >
                  {point.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Render Player Lines & Paths */}
          {OFFICIAL_PLAYERS.map(player => {
            const isHighlighted = highlightedPlayerId === player.id;
            const isMuted = highlightedPlayerId !== null && !isHighlighted;
            const strokeColor = player.colorHex;

            // Build SVG path points
            const points = timeline.map((pt, idx) => {
              const pData = pt.players[player.id];
              const val = pData ? (viewMode === 'cumulative' ? pData.cumulativePE : pData.peGained) : minVal;
              return { x: getX(idx), y: getY(val) };
            });

            const pathD = points.reduce((acc, curr, idx) => {
              return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
            }, '');

            return (
              <g key={`line-${player.id}`} opacity={isMuted ? 0.2 : 1}>
                {/* Glow layer if highlighted */}
                {isHighlighted && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="6"
                    opacity="0.3"
                  />
                )}
                {/* Main line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? 3.5 : 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dot for each match with enlarged mobile touch hitbox */}
                {points.map((pt, idx) => {
                  const isPointSelected = activePoint.index === idx;
                  return (
                    <g key={`dot-${player.id}-${idx}`}>
                      {/* Invisible generous touch target (36px diameter) for mobile thumbs */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="18"
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={() => setSelectedPointIndex(idx)}
                      />
                      {/* Visible styled point */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isPointSelected ? 6 : 4}
                        fill={strokeColor}
                        stroke="#1c1917"
                        strokeWidth={isPointSelected ? 2.5 : 1.5}
                        className="pointer-events-none"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="text-[11px] text-stone-500 block sm:hidden text-center">
        👈 Deslize horizontalmente para navegar pelas partidas 👉
      </div>

      {/* Interactive Detail Box for Selected Point */}
      {activePoint && (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-stone-100">
                {activePoint.label}
              </span>
              <span className="text-[11px] text-stone-400">
                ({activePoint.date})
              </span>
            </div>
            <span className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-900/60 px-2 py-0.5 rounded-md">
              Cenário: {activePoint.scenarioName}
            </span>
          </div>

          {/* Cards for each player at this timeline point */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {OFFICIAL_PLAYERS.map(player => {
              const pData = activePoint.players[player.id];
              if (!pData) return null;
              return (
                <div
                  key={player.id}
                  className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-2.5 space-y-1"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: player.colorHex }}
                    />
                    <span className="text-xs font-bold text-stone-200 truncate">
                      {player.name}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-400 flex items-center justify-between pt-0.5">
                    <span>No jogo:</span>
                    <span className="font-mono font-bold text-amber-300">
                      +{pData.peGained.toFixed(1)} PE
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-400 flex items-center justify-between border-t border-stone-800/50 pt-0.5">
                    <span>Acumulado:</span>
                    <span className="font-mono font-bold text-stone-100">
                      {pData.cumulativePE.toFixed(1)} PE
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Informative Note */}
      <div className="flex items-start gap-2 text-[11px] text-stone-400 bg-stone-950/40 p-3 rounded-xl border border-stone-800/60">
        <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Como ler o gráfico:</strong> O ponto inicial <em>(Base Inverno)</em> consolida as 15 partidas originais por Valor Esperado (135, 130, 115 e 115 PE). A cada partida oficial disputada na Primavera e nas próximas estações, o gráfico traça a curva exata do progresso anual de cada jogador.
        </span>
      </div>
    </div>
  );
};
