import React from 'react';
import { Trophy, Globe, Award, Info, Crown } from 'lucide-react';
import { Match } from '../types';
import { calculateAnnualRanking } from '../utils/calculations';
import { SEASONS } from '../constants';
import { PerformanceChart } from './PerformanceChart';

interface AnnualRankingTabProps {
  matches: Match[];
}

export const AnnualRankingTab: React.FC<AnnualRankingTabProps> = ({ matches }) => {
  const annualStandings = calculateAnnualRanking(matches);
  const leader = annualStandings[0];

  return (
    <div className="space-y-6">
      {/* Circuit Header Card */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="text-amber-400" size={22} />
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-amber-100">
              Circuito Anual das 4 Estações
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Pontuação consolidada dos 4 jogadores oficiais ao longo de 2026.
          </p>
        </div>

        {/* Season Score Rules Badge */}
        <div className="flex items-center gap-2 bg-stone-950/70 border border-stone-800 px-3.5 py-2 rounded-xl text-xs text-stone-300">
          <Info size={16} className="text-amber-400 shrink-0" />
          <span>
            Pontos de Eficiência (PE): <strong>Base Inverno 2026</strong> (Zhang: 135 · Rodrigo: 130 · Gina: 115 · Jhonata: 115) + <strong>PE das demais estações</strong>
          </span>
        </div>
      </div>

      {/* Leader Showcase Card */}
      {leader && (
        <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/40 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Crown size={28} />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Líder do Circuito Anual
              </span>
              <h2 className="text-2xl font-bold font-serif text-stone-100">
                {leader.playerName}
              </h2>
              <div className="text-xs text-stone-400 mt-0.5">
                Acumulando {leader.totalAnnualPoints.toFixed(1)} Pontos de Eficiência (PE)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-stone-950 border border-stone-800 px-4 py-2 rounded-xl text-center">
              <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                {leader.totalAnnualPoints.toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-400 uppercase block tracking-wider">
                Total PE Anual
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Performance & Progression Chart */}
      <PerformanceChart matches={matches} />

      {/* Annual Matrix - Mobile Cards View */}
      <div className="block md:hidden space-y-3">
        {annualStandings.map(row => {
          const rankMedal =
            row.rank === 1 ? '🥇 1º Lugar' : row.rank === 2 ? '🥈 2º Lugar' : row.rank === 3 ? '🥉 3º Lugar' : `${row.rank}º Lugar`;

          return (
            <div
              key={row.playerId}
              className={`bg-stone-900 border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                row.rank === 1
                  ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/20 via-stone-900 to-stone-900'
                  : 'border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-stone-950 text-stone-300 border border-stone-800">
                    {rankMedal}
                  </span>
                  <div
                    className="w-4 h-4 rounded-full border border-stone-500 shrink-0 shadow-sm"
                    style={{ backgroundColor: row.colorHex }}
                  />
                  <span className="font-bold text-base text-stone-100 font-serif">
                    {row.playerName}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-amber-400 block tabular-nums">
                    {row.totalAnnualPoints.toFixed(1)} PE
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">
                    Total Anual
                  </span>
                </div>
              </div>

              {/* Seasons breakdown grid on mobile */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80 text-xs">
                {SEASONS.map(s => {
                  const pts = row.pointsBySeason[s];
                  const pos = row.seasonRanks[s];
                  return (
                    <div key={s} className="bg-stone-950/60 p-2 rounded-xl border border-stone-800/70 flex items-center justify-between">
                      <span className="text-stone-400 text-[11px]">
                        {s} {s === 'Primavera' ? '🌱' : s === 'Inverno' ? '❄️' : s === 'Verão' ? '☀️' : '🍂'}
                      </span>
                      <span className="font-mono font-bold text-stone-200">
                        {pts > 0 ? `${pts.toFixed(1)} PE` : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Annual Matrix - Desktop Table View */}
      <div className="hidden md:block bg-stone-900 border border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={18} />
            <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
              Tabela de Pontuação por Estação
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            Apenas Jogadores Oficiais
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950/60 text-stone-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Jogador</th>
                {SEASONS.map(s => (
                  <th key={s} className="py-3 px-4 text-center">
                    {s} {s === 'Primavera' ? '🌱 (Atual)' : s === 'Inverno' ? '❄️' : s === 'Verão' ? '☀️' : '🍂'}
                  </th>
                ))}
                <th className="py-3 px-6 text-center text-amber-300 font-bold bg-amber-950/20">
                  Total Anual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-200">
              {annualStandings.map(row => {
                return (
                  <tr key={row.playerId} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-4 px-4 text-center font-bold font-mono text-stone-400 tabular-nums">
                      {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : '4º'}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-stone-500 shrink-0"
                          style={{ backgroundColor: row.colorHex }}
                        />
                        <span className="font-semibold text-stone-100">
                          {row.playerName}
                        </span>
                      </div>
                    </td>

                    {/* Season Columns */}
                    {SEASONS.map(s => {
                      const pts = row.pointsBySeason[s];
                      const pos = row.seasonRanks[s];
                      return (
                        <td key={s} className="py-4 px-4 text-center">
                          {pos !== null || pts > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-mono font-bold text-stone-100 tabular-nums">
                                {pts.toFixed(1)} PE
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {s === 'Inverno' ? '(Base Histórica)' : `(${pos}º lugar)`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-600 font-mono">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Anual */}
                    <td className="py-4 px-6 text-center bg-amber-950/20">
                      <span className="font-mono font-bold text-lg text-amber-400 tabular-nums">
                        {row.totalAnnualPoints.toFixed(1)} PE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Footer Callout */}
      <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl text-xs text-stone-400 space-y-1">
        <p className="font-semibold text-stone-300">
          Reconstrução Oficial do Inverno 2026 & Eficiência por Cenário:
        </p>
        <p>
          O ranking anual utiliza a <strong>Opção 3 (Eficiência por Cenário)</strong>. O Inverno 2026 foi incorporado por <strong>Valor Esperado</strong> (12.0 PE por vitória + 7.0 PE por derrota competitiva em 15 partidas): Zhang: 135 PE, Rodrigo: 130 PE, Gina: 115 PE e Jhonata: 115 PE. A partir da Primavera, cada partida soma seus PEs conquistados na mesa diretamente ao ranking anual.
        </p>
      </div>
    </div>
  );
};
