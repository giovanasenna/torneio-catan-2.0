import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trophy,
  AlertCircle,
  Sparkles,
  UserPlus,
  Trash2,
  Plus,
  Minus,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Eye,
  RefreshCw,
  HelpCircle,
  Bot
} from 'lucide-react';
import { BoardAnalysisResult, Match, MatchPlayerResult, Season } from '../types';
import { CURRENT_SEASON, OFFICIAL_PLAYERS, SCENARIOS, SEASONS } from '../constants';
import { calculateBalancedVPPercent, calculateNormalizedVP, calculatePE } from '../utils/calculations';
import { analyzeBoardPhoto } from '../api';

interface MatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (match: Match) => void;
  matchToEdit?: Match | null;
}

interface ActivePlayerState {
  id: string;
  name: string;
  isOfficial: boolean;
  colorHex: string;
  selected: boolean;
  vp: number;
}

// Client-side image compressor: keeps image high-detail for board vision while staying under 1MB
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Falha ao processar arquivo de imagem.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
};

export const MatchFormModal: React.FC<MatchFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  matchToEdit,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [season, setSeason] = useState<Season>(CURRENT_SEASON);
  const [scenarioId, setScenarioId] = useState<string>('base');
  const [targetVP, setTargetVP] = useState<number>(10);
  const [is5to6Players, setIs5to6Players] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Players state
  const [players, setPlayers] = useState<ActivePlayerState[]>([]);
  const [newVisitorName, setNewVisitorName] = useState<string>('');
  const [visitorColor, setVisitorColor] = useState<string>('#8B5CF6'); // Purple default

  // Board photos & Gemini AI state
  const [initialBoardPhoto, setInitialBoardPhoto] = useState<string | null>(null);
  const [boardPhoto, setBoardPhoto] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<BoardAnalysisResult | null>(null);
  const [aiFilledPlayerIds, setAiFilledPlayerIds] = useState<string[]>([]);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ url: string; title: string } | null>(null);
  const [photoError, setPhotoError] = useState<string>('');

  const initialFileInputRef = useRef<HTMLInputElement | null>(null);
  const initialGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or reset form when modal opens or edit match changes
  useEffect(() => {
    if (matchToEdit) {
      setDate(matchToEdit.date);
      setSeason(matchToEdit.season);
      setScenarioId(matchToEdit.scenarioId);
      setTargetVP(matchToEdit.targetVP);
      setIs5to6Players(matchToEdit.is5to6Players);
      setNotes(matchToEdit.notes || '');
      setInitialBoardPhoto(matchToEdit.initialBoardPhoto || null);
      setBoardPhoto(matchToEdit.boardPhoto || null);
      setAiAnalysisResult(matchToEdit.aiAnalysis || null);
      setAiFilledPlayerIds([]);

      const initialPlayers: ActivePlayerState[] = OFFICIAL_PLAYERS.map(op => {
        const found = matchToEdit.playerResults.find(r => r.playerId === op.id);
        return {
          id: op.id,
          name: op.name,
          isOfficial: true,
          colorHex: op.colorHex,
          selected: !!found,
          vp: found ? found.vp : 8,
        };
      });

      for (const res of matchToEdit.playerResults) {
        if (!res.isOfficial) {
          initialPlayers.push({
            id: res.playerId,
            name: res.playerName,
            isOfficial: false,
            colorHex: res.playerColorHex || '#8B5CF6',
            selected: true,
            vp: res.vp,
          });
        }
      }
      setPlayers(initialPlayers);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setSeason(CURRENT_SEASON);
      setScenarioId('base');
      setTargetVP(10);
      setIs5to6Players(false);
      setNotes('');
      setInitialBoardPhoto(null);
      setBoardPhoto(null);
      setAiAnalysisResult(null);
      setAiFilledPlayerIds([]);

      setPlayers(
        OFFICIAL_PLAYERS.map(op => ({
          id: op.id,
          name: op.name,
          isOfficial: true,
          colorHex: op.colorHex,
          selected: true,
          vp: 8,
        }))
      );
    }
    setErrorMessage('');
    setPhotoError('');
  }, [isOpen, matchToEdit]);

  const handleScenarioChange = (newScenarioId: string) => {
    setScenarioId(newScenarioId);
    const scen = SCENARIOS.find(s => s.id === newScenarioId);
    if (scen) {
      setTargetVP(scen.defaultVP);
    }
  };

  const handleTogglePlayer = (id: string) => {
    setPlayers(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleVPChange = (id: string, vpVal: number) => {
    setPlayers(prev =>
      prev.map(p => (p.id === id ? { ...p, vp: Math.max(0, vpVal) } : p))
    );
  };

  const handleAdjustVP = (id: string, delta: number) => {
    setPlayers(prev =>
      prev.map(p => (p.id === id ? { ...p, vp: Math.max(0, p.vp + delta) } : p))
    );
  };

  const handleAddVisitor = () => {
    const clean = newVisitorName.trim();
    if (!clean) return;

    const visitorId = `visitor-${Date.now()}`;
    const newVisitor: ActivePlayerState = {
      id: visitorId,
      name: `${clean} (Visitante)`,
      isOfficial: false,
      colorHex: visitorColor,
      selected: true,
      vp: 6,
    };

    setPlayers(prev => [...prev, newVisitor]);
    setNewVisitorName('');
  };

  const handleRemoveVisitor = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setAiFilledPlayerIds(prev => prev.filter(pid => pid !== id));
  };

  // Initial Board Photo (Setup) handler
  const handleInitialPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const compressedDataUri = await compressImage(file);
      setInitialBoardPhoto(compressedDataUri);
    } catch (err: any) {
      console.error('Erro ao processar foto inicial:', err);
      setPhotoError('Não foi possível ler a foto inicial. Tente novamente.');
    }
  };

  const handleRemoveInitialPhoto = () => {
    setInitialBoardPhoto(null);
    if (initialFileInputRef.current) {
      initialFileInputRef.current.value = '';
    }
    if (initialGalleryInputRef.current) {
      initialGalleryInputRef.current.value = '';
    }
  };

  // Image Upload handler for Final Board Photo
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setPhotoError('');
    try {
      const compressedDataUri = await compressImage(file);
      setBoardPhoto(compressedDataUri);
      // Auto-trigger analysis for convenience
      await triggerAIAnalysis(compressedDataUri);
    } catch (err: any) {
      console.error('Erro ao processar foto:', err);
      setPhotoError('Não foi possível ler ou processar esta imagem. Tente novamente.');
    }
  };

  // Trigger Gemini AI vision to analyze board and fill scores
  const triggerAIAnalysis = async (photoUriToUse?: string) => {
    const photoToAnalyze = photoUriToUse || boardPhoto;
    if (!photoToAnalyze) return;

    setIsAnalyzingPhoto(true);
    setPhotoError('');

    try {
      const currentScen = SCENARIOS.find(s => s.id === scenarioId);
      const scenarioName = currentScen ? currentScen.name : 'Catan Base';

      const result = await analyzeBoardPhoto(photoToAnalyze, scenarioName, targetVP);
      setAiAnalysisResult(result);

      // Map detected players to our state
      if (result.detectedPlayers && result.detectedPlayers.length > 0) {
        const filledIds: string[] = [];

        setPlayers(prevPlayers => {
          let updated = [...prevPlayers];

          for (const detected of result.detectedPlayers) {
            // Find existing player by id or color match
            let playerIdx = -1;
            if (detected.matchedPlayerId) {
              playerIdx = updated.findIndex(p => p.id === detected.matchedPlayerId);
            }

            // Fallback matching by official color
            if (playerIdx === -1 && detected.colorName) {
              const lowerColor = detected.colorName.toLowerCase();
              if (lowerColor.includes('branc') || lowerColor.includes('white')) {
                playerIdx = updated.findIndex(p => p.id === 'jhonata');
              } else if (lowerColor.includes('azul') || lowerColor.includes('blue')) {
                playerIdx = updated.findIndex(p => p.id === 'rodrigo');
              } else if (lowerColor.includes('vermelh') || lowerColor.includes('red')) {
                playerIdx = updated.findIndex(p => p.id === 'giovana');
              } else if (lowerColor.includes('amarel') || lowerColor.includes('yellow')) {
                playerIdx = updated.findIndex(p => p.id === 'zhang');
              }
            }

            if (playerIdx >= 0) {
              updated[playerIdx] = {
                ...updated[playerIdx],
                selected: true,
                vp: detected.estimatedVP,
              };
              filledIds.push(updated[playerIdx].id);
            } else if (detected.colorName && !detected.matchedPlayerId) {
              // It's a detected visitor color
              const visitorId = `visitor-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              const visitorColor = detected.colorName.toLowerCase().includes('verd')
                ? '#10B981'
                : detected.colorName.toLowerCase().includes('laranj')
                ? '#F97316'
                : '#8B5CF6';

              updated.push({
                id: visitorId,
                name: `${detected.matchedPlayerName || `Visitante ${detected.colorName}`}`,
                isOfficial: false,
                colorHex: visitorColor,
                selected: true,
                vp: detected.estimatedVP,
              });
              filledIds.push(visitorId);
            }
          }

          return updated;
        });

        setAiFilledPlayerIds(filledIds);

        // Prepend board description to notes if user notes are empty
        if (!notes && result.boardDescription) {
          setNotes(`[Registro Visual IA]: ${result.boardDescription}`);
        }
      }
    } catch (err: any) {
      console.error('Falha na análise da foto:', err);
      setPhotoError(
        err.message || 'Não foi possível analisar os pontos pela foto. Você pode inserir os pontos manualmente.'
      );
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setBoardPhoto(null);
    setAiAnalysisResult(null);
    setAiFilledPlayerIds([]);
    setPhotoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const activeParticipants = players.filter(p => p.selected);
  const numPlayers = activeParticipants.length;
  const totalTableVP = activeParticipants.reduce((sum, p) => sum + p.vp, 0);
  const maxVP = activeParticipants.length > 0 ? Math.max(...activeParticipants.map(p => p.vp)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (numPlayers < 3 || numPlayers > 6) {
      setErrorMessage(`Uma partida de Catan deve conter de 3 a 6 participantes (selecionados: ${numPlayers}).`);
      return;
    }

    if (targetVP <= 0) {
      setErrorMessage('A meta de PV deve ser maior que zero.');
      return;
    }

    const winners = activeParticipants.filter(p => p.vp === maxVP);
    const winner = winners[0];
    const isTieForWinner = winners.length > 1;

    const playerResults: MatchPlayerResult[] = activeParticipants.map(p => {
      const isWinner = p.vp === maxVP;
      const normalizedVP = calculateNormalizedVP(p.vp, targetVP);
      const balancedVPPercent = calculateBalancedVPPercent(p.vp, totalTableVP, numPlayers);
      const pe = calculatePE(p.vp, targetVP, isWinner, isTieForWinner);
      return {
        playerId: p.id,
        playerName: p.name,
        isOfficial: p.isOfficial,
        playerColorHex: p.colorHex,
        vp: p.vp,
        pe,
        normalizedVP,
        balancedVPPercent,
        isWinner,
      };
    });

    const currentScenario = SCENARIOS.find(s => s.id === scenarioId);

    const savedMatch: Match = {
      id: matchToEdit ? matchToEdit.id : `match-${Date.now()}`,
      date,
      season,
      scenarioId,
      scenarioName: currentScenario ? currentScenario.name : 'Personalizado',
      targetVP,
      notes: notes.trim(),
      initialBoardPhoto: initialBoardPhoto || undefined,
      boardPhoto: boardPhoto || undefined,
      aiAnalysis: aiAnalysisResult || undefined,
      is5to6Players: is5to6Players || numPlayers > 4,
      playerResults,
      winnerId: winner.id,
      winnerName: winner.name,
      createdAt: matchToEdit ? matchToEdit.createdAt : new Date().toISOString(),
    };

    onSave(savedMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-stone-900 border-0 sm:border sm:border-stone-800 rounded-none sm:rounded-2xl w-full max-w-2xl text-stone-100 shadow-2xl h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col">
        {/* Modal Top Bar with Notch Protection */}
        <div className="px-5 py-4 pt-safe sm:pt-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-900 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={22} />
            <h2 className="text-base sm:text-lg font-bold font-serif text-amber-100">
              {matchToEdit ? 'Editar Partida' : 'Registrar Nova Partida'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Date & Season */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1 uppercase tracking-wide">
                Data da Partida
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-200 text-sm focus:border-amber-400 focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1 uppercase tracking-wide">
                Estação do Torneio
              </label>
              <select
                value={season}
                onChange={e => setSeason(e.target.value as Season)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-200 text-sm focus:border-amber-400 focus:outline-none min-h-[44px]"
              >
                {SEASONS.map(s => (
                  <option key={s} value={s}>
                    {s} {s === CURRENT_SEASON ? '(Atual)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Game Mode & Target VP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-400 mb-1 uppercase tracking-wide">
                Modo / Cenário de Jogo
              </label>
              <select
                value={scenarioId}
                onChange={e => handleScenarioChange(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-200 text-sm focus:border-amber-400 focus:outline-none min-h-[44px]"
              >
                <optgroup label="Jogo Base">
                  <option value="base">Catan Jogo Base (Padrão 10 PV)</option>
                </optgroup>
                <optgroup label="Catan Navegantes (Cenários 1 ao 9)">
                  {SCENARIOS.filter(s => s.category === 'Navegantes').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Meta: {s.defaultVP} PV)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Outro">
                  <option value="custom">Cenário Personalizado</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1 uppercase tracking-wide">
                Meta de PV
              </label>
              <input
                type="number"
                min={8}
                max={30}
                value={targetVP}
                onChange={e => setTargetVP(parseInt(e.target.value, 10) || 10)}
                required
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-200 text-sm focus:border-amber-400 focus:outline-none font-mono min-h-[44px]"
              />
            </div>
          </div>

          {/* Expansion toggle */}
          <div className="flex items-center justify-between p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl">
            <div className="text-xs text-stone-300 pr-2">
              <span className="font-semibold block text-stone-200">Expansão 5-6 Jogadores</span>
              Habilita regras de mapa expandido.
            </div>
            <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
              <input
                type="checkbox"
                checked={is5to6Players}
                onChange={e => setIs5to6Players(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-stone-300 after:border-stone-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* SECTION: FOTO DO TABULEIRO INICIAL (SETUP - OPCIONAL) */}
          <div className="p-3.5 bg-stone-950/70 border border-emerald-950/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <Camera size={16} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-200 font-serif flex items-center gap-1.5">
                    Foto do Tabuleiro Inicial (Setup)
                    <span className="text-[10px] font-normal text-emerald-400/80 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                      Opcional
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Guarde o mapa gerado e posicionamentos iniciais para referência histórica.
                  </p>
                </div>
              </div>
              {/* Input Câmera Direta */}
              <input
                ref={initialFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInitialPhotoSelect}
                className="hidden"
              />
              {/* Input Galeria / Arquivos */}
              <input
                ref={initialGalleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleInitialPhotoSelect}
                className="hidden"
              />
            </div>

            {!initialBoardPhoto ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => initialGalleryInputRef.current?.click()}
                  className="border border-stone-800 hover:border-emerald-500/70 bg-stone-900/60 hover:bg-emerald-950/30 rounded-xl p-3 text-left transition-all flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-800/80 group-hover:bg-emerald-500/20 flex items-center justify-center text-stone-300 group-hover:text-emerald-300 transition-colors shrink-0">
                    <ImageIcon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-200 group-hover:text-emerald-200">
                      Escolher da Galeria
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Fotos do rolo da câmera
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => initialFileInputRef.current?.click()}
                  className="border border-stone-800 hover:border-emerald-500/70 bg-stone-900/60 hover:bg-emerald-950/30 rounded-xl p-3 text-left transition-all flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-800/80 group-hover:bg-emerald-500/20 flex items-center justify-center text-stone-300 group-hover:text-emerald-300 transition-colors shrink-0">
                    <Camera size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-200 group-hover:text-emerald-200">
                      Tirar Foto com a Câmera
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Abrir câmera agora
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-stone-900 border border-emerald-900/40 rounded-xl p-2.5">
                <div className="relative group shrink-0">
                  <img
                    src={initialBoardPhoto}
                    alt="Setup Inicial do Tabuleiro"
                    className="w-20 h-16 object-cover rounded-lg border border-emerald-500/40 shadow-sm cursor-pointer"
                    onClick={() => setPreviewPhotoModal({ url: initialBoardPhoto, title: 'Setup Inicial do Tabuleiro' })}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewPhotoModal({ url: initialBoardPhoto, title: 'Setup Inicial do Tabuleiro' })}
                    className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-[10px] text-emerald-200 font-semibold gap-1"
                  >
                    <Eye size={12} /> Ver
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Foto Inicial Registrada
                  </span>
                  <span className="text-[11px] text-stone-400 block truncate">
                    Foto do posicionamento e hexágonos iniciais salva.
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => initialGalleryInputRef.current?.click()}
                    className="text-[11px] text-stone-300 hover:text-white px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition-colors"
                  >
                    Galeria
                  </button>
                  <button
                    type="button"
                    onClick={() => initialFileInputRef.current?.click()}
                    className="text-[11px] text-stone-300 hover:text-white px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition-colors"
                  >
                    Câmera
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveInitialPhoto}
                    className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/60 border border-red-900/40 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: FOTO DO TABULEIRO FINAL & CONTAGEM AUTOMÁTICA COM IA */}
          <div className="p-4 bg-gradient-to-br from-amber-950/30 via-stone-900 to-stone-950 border border-amber-900/60 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Camera size={16} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-200 font-serif">
                    Foto do Tabuleiro Final & Contagem Inteligente (IA)
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Registre a foto do fim de jogo e preencha os pontos automaticamente com revisão prévia.
                  </p>
                </div>
              </div>
              {/* Input Câmera Direta */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              {/* Input Galeria / Rolo de fotos */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Error in Photo Processing */}
            {photoError && (
              <div className="p-2.5 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {/* No photo yet: Action buttons for Gallery and Camera */}
            {!boardPhoto ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-700 hover:border-amber-400/90 bg-stone-900/70 hover:bg-amber-950/30 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-800 group-hover:bg-amber-500/20 flex items-center justify-center text-stone-300 group-hover:text-amber-300 transition-colors">
                    <ImageIcon size={20} />
                  </div>
                  <div className="text-xs font-bold text-stone-100 group-hover:text-amber-200">
                    Escolher da Galeria
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Selecione uma foto já tirada no rolo de câmera
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-700 hover:border-amber-400/90 bg-stone-900/70 hover:bg-amber-950/30 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-800 group-hover:bg-amber-500/20 flex items-center justify-center text-stone-300 group-hover:text-amber-300 transition-colors">
                    <Camera size={20} />
                  </div>
                  <div className="text-xs font-bold text-stone-100 group-hover:text-amber-200">
                    Tirar Foto Agora (Câmera)
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Abra a câmera do celular para fotografar a mesa
                  </p>
                </button>
              </div>
            ) : (
              /* Photo is uploaded: Preview + Controls */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-stone-950/80 border border-stone-800 rounded-xl p-3">
                  <div className="relative group shrink-0">
                    <img
                      src={boardPhoto}
                      alt="Tabuleiro da Partida"
                      className="w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-lg border border-stone-700 shadow-sm cursor-pointer"
                      onClick={() => setPreviewPhotoModal({ url: boardPhoto, title: 'Foto do Tabuleiro Final & Pontuação' })}
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoModal({ url: boardPhoto, title: 'Foto do Tabuleiro Final & Pontuação' })}
                      className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-xs text-amber-200 font-semibold gap-1"
                    >
                      <Eye size={14} /> Ver
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Foto Registrada com Sucesso
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="text-[11px] text-stone-300 hover:text-white px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition-colors"
                        >
                          Galeria
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-stone-300 hover:text-white px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition-colors"
                        >
                          Câmera
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/60 border border-red-900/40 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-400 leading-relaxed">
                      {isAnalyzingPhoto
                        ? 'Analisando foto com inteligência artificial...'
                        : aiAnalysisResult
                        ? 'Pontos detectados e preenchidos no formulário abaixo.'
                        : 'Você pode reprocessar a análise da imagem a qualquer momento.'}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={isAnalyzingPhoto}
                        onClick={() => triggerAIAnalysis()}
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[36px] disabled:opacity-50"
                      >
                        {isAnalyzingPhoto ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Contando pontos com IA...</span>
                          </>
                        ) : (
                          <>
                            <Bot size={15} />
                            <span>{aiAnalysisResult ? 'Reanalisar Tabuleiro com IA' : 'Contar Pontos com IA (Gemini)'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Review Banner & Detailed Breakdown */}
                {aiAnalysisResult && (
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-amber-200">
                          🔍 Pontos Pré-Preenchidos pela IA — Revise antes de Salvar!
                        </div>
                        <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                          Identificamos as peças visíveis no tabuleiro. <strong>Confira os valores atribuídos a cada jogador na seção abaixo</strong> e ajuste manualmente o que for necessário (como cartas de ponto de vitória não reveladas na mão).
                        </p>
                      </div>
                    </div>

                    {/* Breakdown per detected player */}
                    {aiAnalysisResult.detectedPlayers && aiAnalysisResult.detectedPlayers.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-900/60">
                        {aiAnalysisResult.detectedPlayers.map((det, idx) => (
                          <div
                            key={idx}
                            className="bg-stone-950/80 border border-stone-800 rounded-lg p-2 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-stone-200 flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block border border-stone-500"
                                  style={{
                                    backgroundColor:
                                      det.colorName?.toLowerCase().includes('branc')
                                        ? '#FFFFFF'
                                        : det.colorName?.toLowerCase().includes('azul')
                                        ? '#2563EB'
                                        : det.colorName?.toLowerCase().includes('verm')
                                        ? '#DC2626'
                                        : det.colorName?.toLowerCase().includes('amar')
                                        ? '#EAB308'
                                        : '#8B5CF6',
                                  }}
                                />
                                {det.matchedPlayerName || det.colorName}
                              </span>
                              <span className="text-amber-300 font-bold font-mono">
                                {det.estimatedVP} PV
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-400 flex flex-wrap gap-x-2 gap-y-0.5">
                              {det.settlements > 0 && <span>🏠 {det.settlements} Aldeia{det.settlements > 1 ? 's' : ''} ({det.settlements} PV)</span>}
                              {det.cities > 0 && <span>🏰 {det.cities} Cidade{det.cities > 1 ? 's' : ''} ({det.cities * 2} PV)</span>}
                              {det.hasLongestRoad && <span className="text-blue-300 font-semibold">🛣️ Maior Estrada (+2 PV)</span>}
                              {det.hasLargestArmy && <span className="text-red-300 font-semibold">⚔️ Maior Exército (+2 PV)</span>}
                              {det.vpCards > 0 && <span>📜 {det.vpCards} Carta{det.vpCards > 1 ? 's' : ''} PV</span>}
                            </div>
                            {det.notes && (
                              <div className="text-[10px] text-stone-500 italic">
                                "{det.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {aiAnalysisResult.tipsForReview && (
                      <div className="text-[10px] text-amber-300/70 italic flex items-center gap-1 pt-0.5">
                        <HelpCircle size={12} />
                        <span>{aiAnalysisResult.tipsForReview}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Players Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide">
                Jogadores na Mesa ({numPlayers}/6)
              </label>
              <span className="text-[11px] text-amber-400 font-medium">
                Toque para ativar/desativar
              </span>
            </div>

            {/* Official Players Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {players.filter(p => p.isOfficial).map(p => {
                const isSelected = p.selected;
                const wasAIFilled = aiFilledPlayerIds.includes(p.id);

                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handleTogglePlayer(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 min-h-[48px] ${
                      isSelected
                        ? 'border-amber-400 bg-stone-800/90 shadow-sm'
                        : 'border-stone-800 bg-stone-950/40 text-stone-500 hover:border-stone-700'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-stone-400/50 shrink-0"
                      style={{ backgroundColor: p.colorHex }}
                    />
                    <div className="truncate text-xs font-semibold text-stone-200 flex-1">
                      {p.name}
                    </div>
                    {wasAIFilled && isSelected && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                        IA
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Visitors area */}
            <div className="p-3.5 bg-stone-950/50 border border-stone-800 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-stone-300">
                <UserPlus size={15} className="text-amber-400" />
                <span>Adicionar Visitante / Convidado</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nome do convidado (ex: Carlos)"
                  value={newVisitorName}
                  onChange={e => setNewVisitorName(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 min-h-[44px]"
                />
                <div className="flex gap-2">
                  <select
                    value={visitorColor}
                    onChange={e => setVisitorColor(e.target.value)}
                    className="bg-stone-900 border border-stone-700 rounded-xl px-2 py-2 text-xs text-stone-200 min-h-[44px]"
                  >
                    <option value="#8B5CF6">Roxo</option>
                    <option value="#10B981">Verde</option>
                    <option value="#F97316">Laranja</option>
                    <option value="#06B6D4">Ciano</option>
                    <option value="#EC4899">Rosa</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddVisitor}
                    className="px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors min-h-[44px]"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Added visitors list */}
              {players.filter(p => !p.isOfficial).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {players.filter(p => !p.isOfficial).map(v => (
                    <div
                      key={v.id}
                      className="flex items-center gap-2 bg-stone-900 border border-stone-700 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: v.colorHex }}
                      />
                      <span className="text-stone-200">{v.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVisitor(v.id)}
                        className="text-stone-500 hover:text-red-400 ml-1 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: PV inputs with MOBILE-OPTIMIZED STEPPERS & REVISION INDICATORS */}
          {activeParticipants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide">
                    Pontos de Vitória (PV)
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Confira e ajuste livremente a pontuação de cada participante
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                  <Sparkles size={12} />
                  Ajuste com [-] e [+]
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeParticipants.map(p => {
                  const isCurrentWinner = p.vp === maxVP && maxVP > 0;
                  const normalized = calculateNormalizedVP(p.vp, targetVP);
                  const balancedVP = calculateBalancedVPPercent(p.vp, totalTableVP, numPlayers);
                  const wasAIFilled = aiFilledPlayerIds.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCurrentWinner
                          ? 'border-amber-400/90 bg-amber-950/30 shadow-md'
                          : wasAIFilled
                          ? 'border-amber-500/40 bg-stone-950/90'
                          : 'border-stone-800 bg-stone-950/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full shrink-0 border border-stone-400/50"
                            style={{ backgroundColor: p.colorHex }}
                          />
                          <span className="text-sm font-bold text-stone-100 truncate font-serif">
                            {p.name}
                          </span>
                          {wasAIFilled && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded font-medium">
                              Revisável
                            </span>
                          )}
                        </div>
                        {isCurrentWinner && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-lg">
                            🏆 Vencedor
                          </span>
                        )}
                      </div>

                      {/* Stepper controls with generous touch targets */}
                      <div className="flex items-center gap-2">
                        {/* Decrement Button */}
                        <button
                          type="button"
                          onClick={() => handleAdjustVP(p.id, -1)}
                          className="w-11 h-11 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center font-bold text-lg border border-stone-700 shrink-0 transition-transform"
                        >
                          <Minus size={18} />
                        </button>

                        {/* Direct input */}
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={p.vp}
                          onChange={e => handleVPChange(p.id, parseInt(e.target.value, 10) || 0)}
                          className="w-16 h-11 text-center text-xl font-bold font-mono bg-stone-900 border border-stone-700 rounded-xl text-stone-100 focus:border-amber-400 focus:outline-none"
                        />

                        {/* Increment Button */}
                        <button
                          type="button"
                          onClick={() => handleAdjustVP(p.id, 1)}
                          className="w-11 h-11 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 flex items-center justify-center font-bold text-lg border border-amber-500/40 shrink-0 transition-transform"
                        >
                          <Plus size={18} />
                        </button>

                        {/* Live calculated fairness metrics */}
                        <div className="flex-1 text-[11px] text-stone-400 pl-2 space-y-0.5">
                          <div className="flex justify-between">
                            <span>Norm:</span>
                            <span className="font-mono text-stone-200">{normalized.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VP%:</span>
                            <span className="font-mono text-amber-300 font-bold">{balancedVP}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Match Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1 uppercase tracking-wide">
              Observações da Partida (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Disputa acirrada pela Maior Estrada, detalhes marcantes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-stone-200 text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Bottom Action CTA */}
          <div className="sticky bottom-0 bg-stone-900 pt-3 pb-safe border-t border-stone-800 flex items-center justify-end gap-3 shrink-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-xs sm:text-sm font-medium text-stone-300 hover:text-stone-100 rounded-xl transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-3 text-xs sm:text-sm font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] rounded-xl shadow-md transition-all min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <span>{matchToEdit ? 'Atualizar Partida' : 'Salvar Partida no Torneio'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Preview Modal for Any Board Photo */}
      {previewPhotoModal && (
        <div className="fixed inset-0 z-60 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                <ImageIcon size={18} className="text-amber-400" />
                {previewPhotoModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="p-1.5 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-black/60">
              <img
                src={previewPhotoModal.url}
                alt={previewPhotoModal.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
