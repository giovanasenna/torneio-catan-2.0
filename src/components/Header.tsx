import React from 'react';
import { CatanHexIcon } from './CatanHexIcon';
import { Plus, Share2, HelpCircle, Sun, Moon, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type NavigationTab =
  | 'leaderboard'
  | 'annual'
  | 'charts'
  | 'history'
  | 'visitors'
  | 'glossary'
  | 'data';

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenMatchModal: () => void;
  onOpenShareModal: () => void;
  onOpenDataSafetyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenMatchModal,
  onOpenShareModal,
  onOpenDataSafetyModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm backdrop-blur-md bg-stone-900/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <CatanHexIcon size={26} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-amber-100">
              Torneio Catan
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-amber-300/80 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded w-fit">
              Primavera 2026
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-stone-300">
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'leaderboard'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-stone-100'
            }`}
          >
            Classificação
          </button>
          <button
            onClick={() => onTabChange('annual')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'annual'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-stone-100'
            }`}
          >
            Circuito Anual
          </button>
          <button
            onClick={() => onTabChange('charts')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'charts'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-stone-100'
            }`}
          >
            Estatísticas
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'history'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-stone-100'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => onTabChange('visitors')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'visitors'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-stone-100'
            }`}
          >
            Visitantes
          </button>
          <button
            onClick={() => onTabChange('glossary')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1 ${
              activeTab === 'glossary'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-stone-100 text-amber-300/90'
            }`}
          >
            <HelpCircle size={14} />
            <span>Regras & Siglas</span>
          </button>
          <button
            onClick={() => onTabChange('data')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'data'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-stone-100'
            }`}
          >
            Planilhas & Google
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle Button (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 active:scale-[0.98] rounded-lg transition-colors whitespace-nowrap min-h-[40px] min-w-[40px] justify-center"
            title={theme === 'dark' ? 'Mudar para Modo Claro (Pergaminho)' : 'Mudar para Modo Escuro (Taberna)'}
            aria-label="Alternar tema claro e escuro"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={16} className="text-amber-400 stroke-[2.2]" />
                <span className="hidden sm:inline text-stone-300">Claro</span>
              </>
            ) : (
              <>
                <Moon size={16} className="text-amber-600 stroke-[2.2]" />
                <span className="hidden sm:inline text-stone-700">Escuro</span>
              </>
            )}
          </button>

          <button
            onClick={() => onTabChange('glossary')}
            className="lg:hidden p-2 text-stone-300 hover:text-amber-400 bg-stone-800 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Ver Regras & Siglas"
          >
            <HelpCircle size={17} className="text-amber-400" />
          </button>

          {onOpenDataSafetyModal && (
            <button
              onClick={onOpenDataSafetyModal}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 active:scale-[0.98] rounded-lg transition-colors whitespace-nowrap min-h-[40px]"
              title="Segurança dos Dados & Backup para GitHub"
            >
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="hidden md:inline">Backup</span>
            </button>
          )}

          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 active:scale-[0.98] rounded-lg transition-colors whitespace-nowrap min-h-[40px]"
            title="Compartilhar app com amigos"
          >
            <Share2 size={15} className="text-amber-400" />
            <span className="hidden xs:inline">Compartilhar</span>
          </button>

          <button
            onClick={onOpenMatchModal}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Registrar Partida</span>
            <span className="sm:hidden">Partida</span>
          </button>
        </div>
      </div>
    </header>
  );
};
