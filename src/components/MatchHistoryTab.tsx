import React, { useState } from 'react';
import {
  History,
  Search,
  Edit,
  Trash2,
  Calendar,
  Trophy,
  Users,
  ShieldCheck,
  AlertCircle,
  Camera,
  Eye,
  X,
  Sparkles,
  Bot
} from 'lucide-react';
import { Match, Season } from '../types';
import { SEASONS } from '../constants';

interface MatchHistoryTabProps {
  matches: Match[];
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenNewMatch: () => void;
}

export const MatchHistoryTab: React.FC<MatchHistoryTabProps> = ({
  matches,
  onEditMatch,
  onDeleteMatch,
  onOpenNewMatch,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [seasonFilter, setSeasonFilter] = useState<Season | 'all'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedPhotoMatch, setSelectedPhotoMatch] = useState<Match | null>(null);
  const [activePhotoTab, setActivePhotoTab] = useState<'initial' | 'final'>('final');

  // Filter matches
  const filteredMatches = matches.filter(m => {
    if (seasonFilter !== 'all' && m.season !== seasonFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchInScenario = m.scenarioName.toLowerCase().includes(term);
      const matchInWinner = m.winnerName.toLowerCase().includes(term);
      const matchInNotes = (m.notes || '').toLowerCase().includes(term);
      const matchInPlayers = m.playerResults.some(p => p.playerName.toLowerCase().includes(term));
      if (!matchInScenario && !matchInWinner && !matchInNotes && !matchInPlayers) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header and Filter Bar */}
      <div className="bg-stone-900 border border-stone-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <History className="text-amber-400" size={22} />
            <h1 className="text-lg sm:text-2xl font-bold font-serif text-amber-100">
              Histórico & Edição de Partidas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
            {matches.length} partidas registradas. Qualquer partida antiga pode ser editada mantendo a integridade estatística.
          </p>
        </div>

        {/* Search & Season Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar por cenário ou jogador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 w-full sm:w-56 min-h-[40px]"
            />
          </div>

          <select
            value={seasonFilter}
            onChange={e => setSeasonFilter(e.target.value as Season | 'all')}
            className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400 min-h-[40px]"
          >
            <option value="all">Todas as Estações</option>
            {SEASONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Integrity Callout */}
      <div className="p-3.5 bg-amber-950/20 border border-amber-900/60 rounded-xl text-xs text-amber-200/90 flex items-start gap-2.5">
        <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Como funciona a edição de partidas antigas:</strong> Ao tocar em <em>"Editar"</em> em qualquer partida abaixo e salvar as alterações, o servidor grava a atualização permanentemente no arquivo de dados e <strong>recalcula instantaneamente todas as métricas</strong> (Vitórias, PV Total, VP% Balanceado e pontuações do Circuito Anual 10, 6, 3, 1 pts) para todos os jogadores.
        </div>
      </div>

      {/* Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center text-stone-400 space-y-3">
          <p>Nenhuma partida encontrada para esta busca.</p>
          <button
            onClick={onOpenNewMatch}
            className="px-4 py-2 text-xs font-semibold bg-amber-400 text-stone-950 rounded-xl hover:bg-amber-300 transition-colors"
          >
            Registrar Nova Partida
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => {
            const isDeleting = confirmDeleteId === match.id;

            return (
              <div
                key={match.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-all hover:border-stone-700"
              >
                {/* Match Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-stone-100 font-serif">
                      {match.scenarioName}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/80 text-amber-300 font-medium">
                      {match.season}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1 font-mono">
                      <Calendar size={13} />
                      {match.date}
                    </span>
                    {match.is5to6Players && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                        <Users size={12} />
                        5-6 Jogadores
                      </span>
                    )}
                    <span className="text-xs text-stone-400">
                      Meta: <strong className="text-stone-200">{match.targetVP} PV</strong>
                    </span>
                  </div>

                  {/* Actions: Prominent Edit & Delete Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {(match.boardPhoto || match.initialBoardPhoto) && (
                      <button
                        onClick={() => {
                          setSelectedPhotoMatch(match);
                          setActivePhotoTab(match.boardPhoto ? 'final' : 'initial');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold transition-colors min-h-[36px]"
                        title="Ver fotos do tabuleiro"
                      >
                        <Camera size={14} />
                        <span>Fotos</span>
                      </button>
                    )}

                    {isDeleting ? (
                      <div className="flex items-center gap-2 bg-red-950 border border-red-800 px-2.5 py-1.5 rounded-xl text-xs">
                        <span className="text-red-200 font-medium">Excluir partida?</span>
                        <button
                          onClick={() => {
                            onDeleteMatch(match.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 min-h-[32px]"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-stone-800 text-stone-300 rounded-lg hover:bg-stone-700 min-h-[32px]"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onEditMatch(match)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors min-h-[36px]"
                          title="Editar partida antiga"
                        >
                          <Edit size={14} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(match.id)}
                          className="p-2 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Excluir partida"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Participants Score Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {match.playerResults.map(p => {
                    return (
                      <div
                        key={p.playerId}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          p.isWinner
                            ? 'bg-amber-950/20 border-amber-500/60 shadow-sm'
                            : 'bg-stone-950/60 border-stone-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div
                            className="w-3 h-3 rounded-full border border-stone-500 shrink-0"
                            style={{ backgroundColor: p.playerColorHex }}
                          />
                          <span className="text-xs font-semibold text-stone-200 truncate">
                            {p.playerName}
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg font-bold font-mono text-stone-100 tabular-nums">
                            {p.vp}
                          </span>
                          <span className="text-[10px] text-stone-400">PV</span>
                          {p.isWinner && (
                            <Trophy size={13} className="text-amber-400 ml-0.5" />
                          )}
                        </div>

                        <div className="mt-1.5 pt-1.5 border-t border-stone-800/60 text-[10px] text-stone-400 space-y-0.5">
                          <div className="flex justify-between items-center bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50 text-amber-300 font-bold">
                            <span>PE:</span>
                            <span className="font-mono text-amber-200">+{((p.pe ?? (p.vp / match.targetVP * 10 + (p.isWinner ? 2 : 0)))).toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between text-stone-400 pt-0.5">
                            <span>VP%:</span>
                            <span className="font-mono text-stone-300">{p.balancedVPPercent}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes if present */}
                {match.notes && (
                  <div className="p-2.5 bg-stone-950/40 border border-stone-800/60 rounded-xl text-xs text-stone-300">
                    <span className="text-stone-400 font-medium">Observações: </span>
                    {match.notes}
                  </div>
                )}

                {/* Registered Board Photos Thumbnail Bar */}
                {(match.boardPhoto || match.initialBoardPhoto) && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {match.initialBoardPhoto && (
                        <div
                          onClick={() => {
                            setSelectedPhotoMatch(match);
                            setActivePhotoTab('initial');
                          }}
                          className="flex items-center gap-2 cursor-pointer bg-stone-900/90 border border-emerald-900/50 hover:border-emerald-500/50 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <img
                            src={match.initialBoardPhoto}
                            alt="Setup Inicial"
                            className="w-8 h-6 object-cover rounded border border-emerald-500/40"
                          />
                          <span className="text-[11px] text-emerald-200 font-medium">
                            🌱 Setup Inicial
                          </span>
                        </div>
                      )}

                      {match.boardPhoto && (
                        <div
                          onClick={() => {
                            setSelectedPhotoMatch(match);
                            setActivePhotoTab('final');
                          }}
                          className="flex items-center gap-2 cursor-pointer bg-stone-900/90 border border-amber-900/50 hover:border-amber-500/50 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <img
                            src={match.boardPhoto}
                            alt="Foto Final"
                            className="w-8 h-6 object-cover rounded border border-amber-500/40"
                          />
                          <span className="text-[11px] text-amber-200 font-medium">
                            📸 Tabuleiro Final
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPhotoMatch(match);
                        setActivePhotoTab(match.boardPhoto ? 'final' : 'initial');
                      }}
                      className="self-end sm:self-auto px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/30 transition-colors"
                    >
                      Visualizar Fotos
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Board Photo Inspection Modal */}
      {selectedPhotoMatch && (selectedPhotoMatch.boardPhoto || selectedPhotoMatch.initialBoardPhoto) && (
        <div className="fixed inset-0 z-60 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-900">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-stone-100 font-serif">
                    Fotos do Tabuleiro — {selectedPhotoMatch.scenarioName}
                  </h3>
                  <div className="text-[11px] text-stone-400 flex items-center gap-2">
                    <span>{selectedPhotoMatch.season}</span>
                    <span>•</span>
                    <span>{selectedPhotoMatch.date}</span>
                    <span>•</span>
                    <span className="text-amber-300 font-semibold">Vencedor: {selectedPhotoMatch.winnerName}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhotoMatch(null)}
                className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Switch Tabs if both photos exist */}
            {selectedPhotoMatch.initialBoardPhoto && selectedPhotoMatch.boardPhoto && (
              <div className="flex border-b border-stone-800 bg-stone-950 px-4 pt-2 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('initial')}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                    activePhotoTab === 'initial'
                      ? 'text-emerald-300 border-emerald-400 bg-stone-900'
                      : 'text-stone-400 border-transparent hover:text-stone-200'
                  }`}
                >
                  <span>🌱 Setup Inicial da Partida</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('final')}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                    activePhotoTab === 'final'
                      ? 'text-amber-300 border-amber-400 bg-stone-900'
                      : 'text-stone-400 border-transparent hover:text-stone-200'
                  }`}
                >
                  <span>📸 Fim de Jogo & Pontuação</span>
                </button>
              </div>
            )}

            {/* Modal Body: Photo & Details */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Photo Display */}
              <div className="bg-black/80 rounded-xl overflow-hidden flex items-center justify-center border border-stone-800 max-h-[50vh]">
                <img
                  src={
                    activePhotoTab === 'initial' && selectedPhotoMatch.initialBoardPhoto
                      ? selectedPhotoMatch.initialBoardPhoto
                      : selectedPhotoMatch.boardPhoto || selectedPhotoMatch.initialBoardPhoto
                  }
                  alt={activePhotoTab === 'initial' ? 'Setup Inicial' : 'Fim de Jogo'}
                  className="max-h-[50vh] w-full object-contain"
                />
              </div>

              {/* Notice for Initial Setup Photo */}
              {activePhotoTab === 'initial' && selectedPhotoMatch.initialBoardPhoto && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-xs text-emerald-200">
                  <span className="font-semibold block text-emerald-300 mb-0.5">🌱 Foto do Setup Inicial de Abertura</span>
                  Mostra a disposição inicial dos hexágonos, números e as duas primeiras aldeias e estradas de cada jogador.
                </div>
              )}

              {/* AI Detection Breakdown if available and viewing final board */}
              {(activePhotoTab === 'final' || !selectedPhotoMatch.initialBoardPhoto) && selectedPhotoMatch.aiAnalysis && (
                <div className="bg-amber-950/30 border border-amber-900/60 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Registro da Análise com IA</span>
                  </div>
                  {selectedPhotoMatch.aiAnalysis.boardDescription && (
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {selectedPhotoMatch.aiAnalysis.boardDescription}
                    </p>
                  )}
                  {selectedPhotoMatch.aiAnalysis.detectedPlayers && selectedPhotoMatch.aiAnalysis.detectedPlayers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-900/40">
                      {selectedPhotoMatch.aiAnalysis.detectedPlayers.map((p, idx) => (
                        <div key={idx} className="bg-stone-950/70 border border-stone-800 p-2 rounded-lg text-xs space-y-0.5">
                          <div className="font-semibold text-stone-200 flex justify-between">
                            <span>{p.matchedPlayerName || p.colorName}</span>
                            <span className="text-amber-300 font-mono">{p.estimatedVP} PV</span>
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {p.settlements > 0 && `${p.settlements} aldeia(s) `}
                            {p.cities > 0 && `• ${p.cities} cidade(s) `}
                            {p.hasLongestRoad && '• Maior Estrada '}
                            {p.hasLargestArmy && '• Maior Exército '}
                          </div>
                          {p.notes && <div className="text-[10px] text-stone-500 italic">"{p.notes}"</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-800 bg-stone-900 flex justify-end">
              <button
                onClick={() => setSelectedPhotoMatch(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
