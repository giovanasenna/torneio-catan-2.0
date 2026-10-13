import React, { useState } from 'react';
import {
  Trophy,
  Globe,
  History,
  PlusCircle,
  MoreHorizontal,
  BarChart3,
  Users,
  BookOpen,
  Database,
  ShieldCheck,
  Share2,
  X,
  ChevronRight,
} from 'lucide-react';
import { NavigationTab } from './Header';

interface MobileBottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenMatchModal: () => void;
  onOpenShareModal: () => void;
  onOpenDataSafetyModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenMatchModal,
  onOpenShareModal,
  onOpenDataSafetyModal,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Check if current active tab is one of the secondary tabs
  const isSecondaryTabActive = ['charts', 'visitors', 'glossary', 'data'].includes(activeTab);

  const getSecondaryTabLabel = () => {
    switch (activeTab) {
      case 'charts':
        return 'Estatísticas';
      case 'visitors':
        return 'Visitantes';
      case 'glossary':
        return 'Regras';
      case 'data':
        return 'Planilhas';
      default:
        return 'Mais';
    }
  };

  const handleSelectTab = (tab: NavigationTab) => {
    onTabChange(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Bottom Sheet Drawer for "Mais" options */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          {/* Backdrop dismiss click area */}
          <div
            className="flex-1"
            onClick={() => setIsMoreMenuOpen(false)}
            aria-label="Fechar menu"
          />

          {/* Drawer container */}
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-safe space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MoreHorizontal size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-100">
                    Mais Opções & Páginas
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Acesse todas as ferramentas do torneio
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation options */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block px-2">
                Páginas do Torneio
              </span>

              {/* Charts */}
              <button
                onClick={() => handleSelectTab('charts')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left min-h-[52px] ${
                  activeTab === 'charts'
                    ? 'bg-amber-950/30 border-amber-500/60 text-amber-300'
                    : 'bg-stone-950/70 border-stone-800 text-stone-200 hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center text-amber-400 shrink-0">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-sm block font-serif">
                      Estatísticas & Gráficos
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Curvas de evolução, taxa de vitórias e cenários
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-stone-500 shrink-0" />
              </button>

              {/* Visitors */}
              <button
                onClick={() => handleSelectTab('visitors')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left min-h-[52px] ${
                  activeTab === 'visitors'
                    ? 'bg-amber-950/30 border-amber-500/60 text-amber-300'
                    : 'bg-stone-950/70 border-stone-800 text-stone-200 hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center text-amber-400 shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-sm block font-serif">
                      Visitantes & Convidados
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Ranking e pontuações dos amigos que jogaram
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-stone-500 shrink-0" />
              </button>

              {/* Glossary */}
              <button
                onClick={() => handleSelectTab('glossary')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left min-h-[52px] ${
                  activeTab === 'glossary'
                    ? 'bg-amber-950/30 border-amber-500/60 text-amber-300'
                    : 'bg-stone-950/70 border-stone-800 text-stone-200 hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center text-amber-400 shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-sm block font-serif">
                      Regras & Siglas Oficiais
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Fórmulas de PE, desempates e diretrizes
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-stone-500 shrink-0" />
              </button>

              {/* Data & Sheets */}
              <button
                onClick={() => handleSelectTab('data')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left min-h-[52px] ${
                  activeTab === 'data'
                    ? 'bg-amber-950/30 border-amber-500/60 text-amber-300'
                    : 'bg-stone-950/70 border-stone-800 text-stone-200 hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700/80 flex items-center justify-center text-amber-400 shrink-0">
                    <Database size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-sm block font-serif">
                      Planilhas & Google Drive
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Sincronização em nuvem e exportação CSV/JSON
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-stone-500 shrink-0" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block px-2">
                Ações Rápidas
              </span>

              <div className="grid grid-cols-2 gap-2">
                {onOpenDataSafetyModal && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenDataSafetyModal();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-200 hover:bg-stone-800 transition-colors text-xs font-semibold min-h-[44px]"
                  >
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <span>Backup & Nuvem</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenShareModal();
                  }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-200 hover:bg-stone-800 transition-colors text-xs font-semibold min-h-[44px]"
                >
                  <Share2 size={16} className="text-amber-400 shrink-0" />
                  <span>Convidar Amigos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/98 backdrop-blur-lg border-t border-stone-800 pb-safe">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {/* 1. Placar */}
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'leaderboard'
                ? 'text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Trophy size={19} />
            <span className="text-[10px] tracking-tight mt-1">Placar</span>
          </button>

          {/* 2. Anual */}
          <button
            onClick={() => onTabChange('annual')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'annual'
                ? 'text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe size={19} />
            <span className="text-[10px] tracking-tight mt-1">Anual</span>
          </button>

          {/* 3. Central Prominent Register Button */}
          <button
            onClick={onOpenMatchModal}
            className="min-h-[48px] flex flex-col items-center justify-center text-amber-400 active:scale-95 transition-transform"
            aria-label="Registrar Nova Partida"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-950/50">
              <PlusCircle size={24} className="stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-amber-400 mt-0.5">Novo</span>
          </button>

          {/* 4. Histórico */}
          <button
            onClick={() => onTabChange('history')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'history'
                ? 'text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <History size={19} />
            <span className="text-[10px] tracking-tight mt-1">Histórico</span>
          </button>

          {/* 5. Mais (Includes Estatísticas, Visitantes, Regras, Planilhas) */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors relative ${
              isSecondaryTabActive
                ? 'text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {isSecondaryTabActive && (
              <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            <MoreHorizontal size={19} />
            <span className="text-[10px] tracking-tight mt-1 truncate max-w-[54px]">
              {isSecondaryTabActive ? getSecondaryTabLabel() : 'Mais'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
