import React, { useState } from 'react';
import { BarChart3, TrendingUp, Compass, PieChart } from 'lucide-react';
import { Match } from '../types';
import { OFFICIAL_PLAYERS, SEASONS } from '../constants';
import { calculateStandings } from '../utils/calculations';

interface ChartsTabProps {
  matches: Match[];
}

export const ChartsTab: React.FC<ChartsTabProps> = ({ matches }) => {
  const [metricMode, setMetricMode] = useState<'wins' | 'totalVP' | 'winRate'>('wins');

  // Sort matches chronologically for time-series evolution
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const standings = calculateStandings(matches, 'all', false);

  // Compute cumulative wins & PV over matches for the 4 official players
  const timePoints = sortedMatches.map((m, idx) => {
    return {
      matchIndex: idx + 1,
      matchId: m.id,
      date: m.date,
      scenario: m.scenarioName,
      winnerName: m.winnerName,
    };
  });

  const cumulativeWins: Record<string, number[]> = {};
  const cumulativeVP: Record<string, number[]> = {};

  for (const op of OFFICIAL_PLAYERS) {
    cumulativeWins[op.id] = [];
    cumulativeVP[op.id] = [];
    let currentWins = 0;
    let currentVP = 0;

    for (const m of sortedMatches) {
      const pRes = m.playerResults.find(r => r.playerId === op.id);
      if (pRes) {
        if (pRes.isWinner) currentWins += 1;
        currentVP += pRes.vp;
      }
      cumulativeWins[op.id].push(currentWins);
      cumulativeVP[op.id].push(currentVP);
    }
  }

  // Scenario breakdown count
  const scenarioCounts: Record<string, number> = {};
  for (const m of matches) {
    scenarioCounts[m.scenarioName] = (scenarioCounts[m.scenarioName] || 0) + 1;
  }
  const scenarioEntries = Object.entries(scenarioCounts).sort((a, b) => b[1] - a[1]);

  // Max value for scaling
  const maxCumulativeWins = Math.max(
    1,
    ...Object.values(cumulativeWins).map(arr => (arr.length ? arr[arr.length - 1] : 0))
  );

  const maxCumulativeVP = Math.max(
    1,
    ...Object.values(cumulativeVP).map(arr => (arr.length ? arr[arr.length - 1] : 0))
  );

  // SVG Chart Dimensions
  const chartWidth = 650;
  const chartHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-amber-400" size={22} />
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-amber-100">
              Estatísticas & Visualizações
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Análise longitudinal de desempenho, vitórias e cenários disputados.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMetricMode('wins')}
            className={`flex-1 sm:flex-initial whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
              metricMode === 'wins' ? 'bg-amber-400 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Vitórias (V)
          </button>
          <button
            onClick={() => setMetricMode('totalVP')}
            className={`flex-1 sm:flex-initial whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
              metricMode === 'totalVP' ? 'bg-amber-400 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Evolução de PV
          </button>
          <button
            onClick={() => setMetricMode('winRate')}
            className={`flex-1 sm:flex-initial whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
              metricMode === 'winRate' ? 'bg-amber-400 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Taxa de Vitória (%)
          </button>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Time Series Evolution */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-amber-400" size={18} />
              <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
                {metricMode === 'totalVP' ? 'Evolução de PV Acumulado' : 'Evolução de Vitórias Acumuladas'}
              </h2>
            </div>
            <span className="text-xs text-stone-400">
              {timePoints.length} partidas no histórico
            </span>
          </div>

          {/* SVG Line Graph */}
          {timePoints.length < 2 ? (
            <div className="h-64 flex items-center justify-center text-xs text-stone-500">
              Necessário pelo menos 2 partidas registradas para desenhar o gráfico temporal.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[500px]"
              >
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = paddingY + (chartHeight - 2 * paddingY) * (1 - pct);
                  const val =
                    metricMode === 'totalVP'
                      ? Math.round(maxCumulativeVP * pct)
                      : Math.round(maxCumulativeWins * pct);
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#292524"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 4}
                        fill="#78716C"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Lines per Player */}
                {OFFICIAL_PLAYERS.map(op => {
                  const dataset =
                    metricMode === 'totalVP' ? cumulativeVP[op.id] : cumulativeWins[op.id];
                  const maxVal = metricMode === 'totalVP' ? maxCumulativeVP : maxCumulativeWins;

                  if (!dataset || dataset.length === 0) return null;

                  const points = dataset.map((val, idx) => {
                    const x =
                      paddingX +
                      (idx / (timePoints.length - 1)) * (chartWidth - 2 * paddingX);
                    const y =
                      paddingY + (chartHeight - 2 * paddingY) * (1 - val / (maxVal || 1));
                    return { x, y, val };
                  });

                  const pathD = points
                    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');

                  return (
                    <g key={op.id}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={op.colorHex}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Points */}
                      {points.map((p, pIdx) => (
                        <circle
                          key={pIdx}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#1C1917"
                          stroke={op.colorHex}
                          strokeWidth="2.5"
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Match X labels */}
                {timePoints.map((tp, idx) => {
                  const x =
                    paddingX +
                    (idx / (timePoints.length - 1)) * (chartWidth - 2 * paddingX);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={chartHeight - 8}
                      fill="#78716C"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      P{tp.matchIndex}
                    </text>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Mobile Swipe Hint */}
          <div className="text-[11px] text-stone-500 block sm:hidden text-center">
            👈 Deslize horizontalmente para navegar pelas partidas 👉
          </div>

          {/* Player Legend */}
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2 border-t border-stone-800/80">
            {OFFICIAL_PLAYERS.map(op => (
              <div key={op.id} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-3 h-3 rounded-full border border-stone-600 shrink-0"
                  style={{ backgroundColor: op.colorHex }}
                />
                <span className="text-stone-300 font-medium">{op.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Win Rate Bar Comparison */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-amber-400" size={18} />
              <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
                Taxa de Vitória (%) & Aproveitamento
              </h2>
            </div>
            <span className="text-xs text-stone-400">Jogadores Oficiais</span>
          </div>

          <div className="space-y-4 pt-2">
            {standings.filter(s => s.isOfficial).map(player => {
              const rate = player.winRate;
              return (
                <div key={player.playerId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-stone-500 shrink-0"
                        style={{ backgroundColor: player.playerColorHex }}
                      />
                      <span className="font-semibold text-stone-200">
                        {player.playerName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-300 tabular-nums">
                      {rate.toFixed(1)}% ({player.wins}V / {player.matchesPlayed}J)
                    </span>
                  </div>

                  {/* Bar progress */}
                  <div className="h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800 flex">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, rate)}%`,
                        backgroundColor: player.playerColorHex === '#F8FAFC' ? '#E2E8F0' : player.playerColorHex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Average VP Summary Strip */}
          <div className="pt-4 border-t border-stone-800">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Média de PV por Partida
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {standings.filter(s => s.isOfficial).map(p => (
                <div key={p.playerId} className="bg-stone-950/70 p-2 rounded-xl border border-stone-800">
                  <div className="text-base font-bold font-mono text-stone-200 tabular-nums">
                    {p.avgVP.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    {p.playerName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Distribution Strip */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="text-amber-400" size={18} />
            <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
              Cenários Mais Disputados no Circuito
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            {scenarioEntries.length} cenários únicos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {scenarioEntries.map(([scenarioName, count]) => {
            const percentage = ((count / matches.length) * 100).toFixed(0);
            return (
              <div
                key={scenarioName}
                className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-xl flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-stone-200 text-xs block truncate">
                    {scenarioName}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {count} {count === 1 ? 'partida' : 'partidas'} ({percentage}%)
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-300 text-sm shrink-0">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
