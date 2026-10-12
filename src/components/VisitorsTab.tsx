import React from 'react';
import { Users, Award, ShieldAlert, Sparkles } from 'lucide-react';
import { Match } from '../types';
import { calculateStandings } from '../utils/calculations';

interface VisitorsTabProps {
  matches: Match[];
}

export const VisitorsTab: React.FC<VisitorsTabProps> = ({ matches }) => {
  // Compute all standings including visitors
  const allStandings = calculateStandings(matches, 'all', true);
  const visitorStandings = allStandings.filter(s => !s.isOfficial);

  // Matches where visitors participated
  const visitorMatches = matches.filter(m => m.playerResults.some(r => !r.isOfficial));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-amber-400" size={22} />
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-amber-100">
              Histórico & Participação de Visitantes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Registro dos jogadores convidados e amigos que integraram mesas do torneio.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-950/70 border border-stone-800 px-3.5 py-2 rounded-xl text-xs text-stone-300">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <span>
            {visitorStandings.length} {visitorStandings.length === 1 ? 'visitante cadastrado' : 'visitantes cadastrados'}
          </span>
        </div>
      </div>

      {/* Visitors Performance Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
            Desempenho dos Convidados
          </h2>
          <span className="text-xs text-stone-400">
            Métricas de pontuação acumulada
          </span>
        </div>

        {visitorStandings.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-sm">
            Nenhum convidado participou de partidas ainda. Ao registrar uma partida, adicione novos nomes de visitantes dinamicamente!
          </div>
        ) : (
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
        )}
      </div>

      {/* Matches with Guests */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
          Partidas com Presença de Convidados ({visitorMatches.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visitorMatches.map(m => {
            const guestNames = m.playerResults
              .filter(p => !p.isOfficial)
              .map(p => p.playerName)
              .join(', ');

            return (
              <div
                key={m.id}
                className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-xl space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-200 font-serif">{m.scenarioName}</span>
                  <span className="text-stone-400">{m.date}</span>
                </div>
                <div className="text-xs text-amber-300">
                  Convidados: <span className="text-stone-300">{guestNames}</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Vencedor da Mesa: <strong className="text-stone-200">{m.winnerName}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
