import React, { useState } from 'react';
import { Trophy, HelpCircle, Award, Users, ChevronDown, ChevronUp, Plus, ShieldCheck } from 'lucide-react';
import { Match, PlayerStanding, Season } from '../types';
import { CURRENT_SEASON, SEASONS, WINTER_S1_OFFICIAL } from '../constants';
import { calculateStandings } from '../utils/calculations';

interface LeaderboardTabProps {
  matches: Match[];
  onOpenMatchModal: () => void;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ matches, onOpenMatchModal }) => {
  const [selectedSeason, setSelectedSeason] = useState<Season | 'all'>(CURRENT_SEASON);
  const [includeVisitors, setIncludeVisitors] = useState<boolean>(false);
  const [showMathHelp, setShowMathHelp] = useState<boolean>(false);
  const [expandedMobilePlayerId, setExpandedMobilePlayerId] = useState<string | null>(null);

  const standings = calculateStandings(matches, selectedSeason, includeVisitors);
  const seasonMatches = selectedSeason === 'all'
    ? matches
    : matches.filter(m => m.season === selectedSeason);

  const toggleExpandMobile = (id: string) => {
    setExpandedMobilePlayerId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Banner */}
      <div className="bg-stone-900 border border-stone-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold font-serif text-amber-100">
                {selectedSeason === 'all' ? 'Circuito Anual (Geral)' : 'Classificação da Estação'}
              </h1>
              {selectedSeason === 'all' && (
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  🏆 Circuito Anual (Consolidado)
                </span>
              )}
              {selectedSeason === CURRENT_SEASON && (
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Primavera (Ativa)
                </span>
              )}
              {selectedSeason === 'Inverno' && (
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Winter S1 (Encerrado)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              {selectedSeason === 'all'
                ? `Pontuação Anual Contínua: 15 partidas do Inverno (base) + ${matches.length} partidas das demais estações.`
                : selectedSeason === 'Inverno'
                ? 'Resultado final consolidado oficial (sem partidas detalhadas inventadas).'
                : `${seasonMatches.length} partidas registradas na ${selectedSeason}.`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {selectedSeason !== 'Inverno' && (
              <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 hover:text-stone-100 select-none bg-stone-950/60 px-2.5 py-1.5 rounded-lg border border-stone-800">
                <input
                  type="checkbox"
                  checked={includeVisitors}
                  onChange={e => setIncludeVisitors(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-0"
                />
                <Users size={13} className="text-stone-400" />
                <span>Visitantes</span>
              </label>
            )}

            <button
              onClick={() => setShowMathHelp(!showMathHelp)}
              className="text-stone-400 hover:text-amber-300 flex items-center gap-1 transition-colors px-2 py-1"
            >
              <HelpCircle size={14} />
              <span className="hidden sm:inline">Critérios</span>
            </button>
          </div>
        </div>

        {/* Horizontal Season Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedSeason('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap min-h-[36px] flex items-center justify-center gap-1 ${
              selectedSeason === 'all'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                : 'bg-stone-950/80 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            <span>🏆</span>
            <span>Todas as Estações (Anual)</span>
          </button>
          {SEASONS.map(season => {
            const isCurrent = season === selectedSeason;
            return (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap min-h-[36px] flex items-center justify-center ${
                  isCurrent
                    ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-950/80 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
              >
                {season} {season === CURRENT_SEASON ? '🌱' : season === 'Inverno' ? '❄️' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Math Help Accordion */}
      {showMathHelp && (
        <div className="p-4 bg-stone-950/90 border border-amber-900/60 rounded-2xl text-xs text-stone-300 space-y-2 animate-fade-in">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Trophy size={14} />
            <span>Critérios Oficiais de Desempate:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
              <span className="font-bold text-stone-100 block">1º Vitórias (V)</span>
              Total de vitórias conquistadas na estação.
            </div>
            <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
              <span className="font-bold text-stone-100 block">2º PV Total Acumulado</span>
              Soma de todos os PVs conquistados (a partir da Primavera).
            </div>
            <div className="bg-stone-900 p-2.5 rounded-xl border border-stone-800">
              <span className="font-bold text-stone-100 block">3º Média do VP% Balanceado</span>
              Equaliza mesas de 3 a 6 jogadores para o padrão de 4.
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL VIEW FOR INVERNO (WINTER S1) - ONLY THE REAL OFFICIAL OUTCOME */}
      {selectedSeason === 'Inverno' ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-950/30 border border-blue-900/60 rounded-2xl flex items-start gap-3">
            <ShieldCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200 leading-relaxed">
              <strong>Resultado Oficial Consolidado (Winter S1 - 2026):</strong><br />
              Nenhum dado ou pontuação de partida fictícia foi inserido. Abaixo está estritamente o resultado final oficial conquistado pelos 4 jogadores no Inverno. Os registros detalhados partida a partida começam a partir da Primavera.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {WINTER_S1_OFFICIAL.map(player => {
              const medal =
                player.rank === 1
                  ? '🥇 1º Lugar'
                  : player.rank === 2
                  ? '🥈 2º Lugar'
                  : '🥉 3º Lugar';
              const cardBorder =
                player.rank === 1
                  ? 'border-amber-500/70 bg-gradient-to-b from-amber-950/30 to-stone-900'
                  : player.rank === 2
                  ? 'border-blue-500/40 bg-stone-900'
                  : 'border-stone-800 bg-stone-900';

              return (
                <div
                  key={player.playerId}
                  className={`p-5 rounded-2xl border ${cardBorder} shadow-sm space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      {medal}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full border border-stone-400 shadow-sm"
                      style={{ backgroundColor: player.colorHex }}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-stone-100 font-serif">
                      {player.playerName}
                    </h3>
                    <span className="text-xs text-stone-400">{player.description}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/80 text-center">
                    <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                      <span className="text-2xl font-bold font-mono text-amber-400 block tabular-nums">
                        {player.wins}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                        Vitórias
                      </span>
                    </div>

                    <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                      <span className="text-2xl font-bold font-mono text-emerald-400 block tabular-nums">
                        {player.annualPoints}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                        Pts Anuais
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* DYNAMIC LEADERBOARD FOR PRIMAVERA AND ONWARDS */
        <div className="space-y-4">
          {/* Empty state invitation for specific season */}
          {selectedSeason !== 'all' && seasonMatches.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Trophy size={28} />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg font-bold font-serif text-stone-100">
                  Temporada Primavera Aberta!
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                  Nenhuma partida foi registrada na Primavera ainda. As partidas desta estação terão registro completo e detalhado (cenário, PV de cada um, VP% balanceado e vencedor).
                </p>
              </div>
              <button
                onClick={onOpenMatchModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>Registrar Primeira Partida da Primavera</span>
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {standings.map(row => {
                  const isExpanded = expandedMobilePlayerId === row.playerId;
                  const rankMedal =
                    row.rank === 1 ? '🥇 1º' : row.rank === 2 ? '🥈 2º' : row.rank === 3 ? '🥉 3º' : `${row.rank}º`;

                  return (
                    <div
                      key={row.playerId}
                      className={`bg-stone-900 border rounded-2xl overflow-hidden transition-all shadow-sm ${
                        row.rank === 1 ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-stone-900' : 'border-stone-800'
                      }`}
                    >
                      <div
                        onClick={() => toggleExpandMobile(row.playerId)}
                        className="p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-stone-950 text-stone-300 border border-stone-800 shrink-0">
                              {rankMedal}
                            </span>
                            <div
                              className="w-4 h-4 rounded-full border border-stone-500 shrink-0 shadow-sm"
                              style={{ backgroundColor: row.playerColorHex }}
                            />
                            <span className="font-bold text-base text-stone-100 truncate font-serif">
                              {row.playerName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-stone-400 text-xs">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80 text-center">
                          <div className="bg-amber-950/30 rounded-lg py-1 border border-amber-900/40">
                            <span className="text-xl font-bold font-mono text-amber-300 block tabular-nums">
                              {row.totalPE.toFixed(1)}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                              Total PE
                            </span>
                          </div>

                          <div className="py-1">
                            <span className="text-xl font-bold font-mono text-stone-100 block tabular-nums">
                              {row.wins}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                              Vitórias (V)
                            </span>
                          </div>

                          <div className="py-1">
                            <span className="text-xl font-bold font-mono text-emerald-400 block tabular-nums">
                              {row.avgPE.toFixed(1)}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                              Média PE
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-stone-800/80 bg-stone-950/30 text-xs space-y-2 animate-fade-in">
                          <div className="grid grid-cols-2 gap-2 text-stone-300 pt-2">
                            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                              <span className="text-stone-400 block text-[11px]">Partidas Jogadas</span>
                              <span className="font-mono font-bold text-stone-100 text-sm">{row.matchesPlayed}</span>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                              <span className="text-stone-400 block text-[11px]">Taxa de Vitória (%)</span>
                              <span className="font-mono font-bold text-amber-400 text-sm">{row.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                              <span className="text-stone-400 block text-[11px]">PV Total Acumulado</span>
                              <span className="font-mono font-bold text-stone-100 text-sm">{row.totalVP} PV</span>
                            </div>
                            <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                              <span className="text-stone-400 block text-[11px]">Média VP% Balanceado</span>
                              <span className="font-mono font-bold text-emerald-400 text-sm">{row.avgBalancedVPPercent.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-stone-900 border border-stone-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800 bg-stone-950/60 text-stone-400 text-xs uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Jogador</th>
                        <th className="py-3 px-3 text-center">Partidas</th>
                        <th className="py-3 px-3 text-center text-amber-300">Vitórias (V)</th>
                        <th className="py-3 px-3 text-center text-stone-200">Total PV</th>
                        <th className="py-3 px-3 text-center text-emerald-300">Média VP%</th>
                        <th className="py-3 px-3 text-center">Taxa V%</th>
                        <th className="py-3 px-3 text-center">PV Médio</th>
                        <th className="py-3 px-4 text-center">Maior PV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 text-stone-200">
                      {standings.map(row => (
                        <tr key={row.playerId} className="hover:bg-stone-800/40 transition-colors">
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-stone-400 tabular-nums">
                            {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-3.5 h-3.5 rounded-full border border-stone-500 shrink-0"
                                style={{ backgroundColor: row.playerColorHex }}
                              />
                              <span className="font-semibold text-stone-100 font-serif">
                                {row.playerName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono tabular-nums text-stone-300">{row.matchesPlayed}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-400 tabular-nums">{row.wins}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-stone-100 tabular-nums">{row.totalVP}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-semibold text-emerald-400 tabular-nums">{row.avgBalancedVPPercent.toFixed(2)}%</td>
                          <td className="py-3.5 px-3 text-center font-mono tabular-nums text-stone-300">{row.winRate.toFixed(1)}%</td>
                          <td className="py-3.5 px-3 text-center font-mono tabular-nums text-stone-400">{row.avgVP.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center font-mono tabular-nums text-stone-300">{row.highestVP}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
