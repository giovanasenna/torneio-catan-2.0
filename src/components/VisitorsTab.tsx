import React, { useState } from 'react';
import { Users, Sparkles, Trophy, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Match } from '../types';
import { calculateStandings } from '../utils/calculations';

interface VisitorsTabProps {
  matches: Match[];
}

export const VisitorsTab: React.FC<VisitorsTabProps> = ({ matches }) => {
  const [expandedVisitorId, setExpandedVisitorId] = useState<string | null>(null);

  // Compute all standings including visitors
  const allStandings = calculateStandings(matches, 'all', true);
  const visitorStandings = allStandings.filter(s => !s.isOfficial);

  // Matches where visitors participated
  const visitorMatches = matches.filter(m => m.playerResults.some(r => !r.isOfficial));

  const toggleExpand = (id: string) => {
    setExpandedVisitorId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-amber-400" size={22} />
            <h1 className="text-lg sm:text-2xl font-bold font-serif text-amber-100">
              Histórico & Participação de Visitantes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            Registro dos jogadores convidados e amigos que integraram mesas do torneio.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-950/70 border border-stone-800 px-3.5 py-2 rounded-xl text-xs text-stone-300 self-start md:self-auto">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <span>
            {visitorStandings.length} {visitorStandings.length === 1 ? 'visitante cadastrado' : 'visitantes cadastrados'}
          </span>
        </div>
      </div>

      {/* Visitors Performance Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold text-stone-200 uppercase tracking-wide">
            Desempenho dos Convidados ({visitorStandings.length})
          </h2>
          <span className="text-[11px] text-stone-400">
            Métricas acumuladas
          </span>
        </div>

        {visitorStandings.length === 0 ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 text-center text-stone-400 text-xs sm:text-sm">
            Nenhum convidado participou de partidas ainda. Ao registrar uma partida, adicione novos nomes de visitantes dinamicamente!
          </div>
        ) : (
          <>
            {/* Mobile Cards View (< md) */}
            <div className="block md:hidden space-y-3">
              {visitorStandings.map(row => {
                const isExpanded = expandedVisitorId === row.playerId;

                return (
                  <div
                    key={row.playerId}
                    className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    <div
                      onClick={() => toggleExpand(row.playerId)}
                      className="p-4 cursor-pointer select-none space-y-3"
                    >
                      {/* Name and Top Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full border border-stone-500 shrink-0 shadow-sm"
                            style={{ backgroundColor: row.playerColorHex }}
                          />
                          <span className="font-bold text-base text-stone-100 font-serif truncate">
                            {row.playerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-400 text-xs">
                          {row.wins > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/70 border border-amber-900/60 px-2 py-0.5 rounded-lg">
                              <Trophy size={11} />
                              {row.wins}V
                            </span>
                          )}
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* 3 Main Highlights */}
                      <div className="grid grid-cols-3 gap-2 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800/80 text-center">
                        <div>
                          <span className="text-lg font-bold font-mono text-amber-400 block tabular-nums">
                            {row.wins}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                            Vitórias
                          </span>
                        </div>

                        <div>
                          <span className="text-lg font-bold font-mono text-stone-200 block tabular-nums">
                            {row.matchesPlayed}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                            Partidas
                          </span>
                        </div>

                        <div>
                          <span className="text-lg font-bold font-mono text-emerald-400 block tabular-nums">
                            {row.totalVP}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                            Total PV
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Extra Details on Mobile */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-stone-800 bg-stone-950/40 text-xs space-y-2 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2 text-stone-300 pt-2">
                          <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                            <span className="text-stone-400 block text-[11px]">Taxa de Vitória</span>
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              {row.winRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                            <span className="text-stone-400 block text-[11px]">Média VP% Balanceado</span>
                            <span className="font-mono font-bold text-emerald-400 text-sm">
                              {row.avgBalancedVPPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                            <span className="text-stone-400 block text-[11px]">PV Médio</span>
                            <span className="font-mono font-bold text-stone-200 text-sm">
                              {row.avgVP.toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                            <span className="text-stone-400 block text-[11px]">Maior PV Alcançado</span>
                            <span className="font-mono font-bold text-stone-100 text-sm">
                              {row.highestVP} PV
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block bg-stone-900 border border-stone-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 bg-stone-950/60 text-stone-400 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Visitante</th>
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
                    {visitorStandings.map(row => (
                      <tr key={row.playerId} className="hover:bg-stone-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-stone-500 shrink-0"
                              style={{ backgroundColor: row.playerColorHex }}
                            />
                            <span className="font-semibold text-stone-100">
                              {row.playerName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono tabular-nums text-stone-300">
                          {row.matchesPlayed}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-400 tabular-nums">
                          {row.wins}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono font-bold text-stone-100 tabular-nums">
                          {row.totalVP}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono font-semibold text-emerald-400 tabular-nums">
                          {row.avgBalancedVPPercent.toFixed(2)}%
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono tabular-nums text-stone-300">
                          {row.winRate.toFixed(1)}%
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono tabular-nums text-stone-400">
                          {row.avgVP.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono tabular-nums text-stone-300">
                          {row.highestVP}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Matches with Guests */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-stone-200 uppercase tracking-wide">
          Partidas com Presença de Convidados ({visitorMatches.length})
        </h3>

        {visitorMatches.length === 0 ? (
          <p className="text-xs text-stone-500">Nenhuma partida registrada com convidados ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visitorMatches.map(m => {
              const guests = m.playerResults.filter(p => !p.isOfficial);

              return (
                <div
                  key={m.id}
                  className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-200 font-serif truncate pr-2">
                      {m.scenarioName}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono shrink-0 flex items-center gap-1">
                      <Calendar size={12} />
                      {m.date}
                    </span>
                  </div>

                  <div className="text-xs text-stone-300 flex items-center justify-between">
                    <span>Vencedor: <strong className="text-amber-400">{m.winnerName}</strong></span>
                    <span className="text-stone-500 font-mono text-[11px]">{m.targetVP} PV</span>
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 text-[11px] text-stone-400">
                    <span className="text-stone-500">Convidados nesta partida: </span>
                    <span className="text-amber-200 font-medium">
                      {guests.map(g => `${g.playerName} (${g.vp} PV)`).join(', ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
