import React from 'react';
import { Trophy, Globe, History, PlusCircle, HelpCircle } from 'lucide-react';
import { NavigationTab } from './Header';

interface MobileBottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenMatchModal: () => void;
  onOpenShareModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenMatchModal,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/98 backdrop-blur-lg border-t border-stone-800 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        <button
          onClick={() => onTabChange('leaderboard')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'leaderboard' ? 'text-amber-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Trophy size={19} />
          <span className="text-[10px] tracking-tight mt-1">Placar</span>
        </button>

        <button
          onClick={() => onTabChange('annual')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'annual' ? 'text-amber-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Globe size={19} />
          <span className="text-[10px] tracking-tight mt-1">Anual</span>
        </button>

        {/* Central Prominent Register Button */}
        <button
          onClick={onOpenMatchModal}
          className="min-h-[48px] flex flex-col items-center justify-center text-amber-400 active:scale-95 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-950/50">
            <PlusCircle size={24} className="stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-amber-400 mt-0.5">Novo</span>
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'history' ? 'text-amber-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <History size={19} />
          <span className="text-[10px] tracking-tight mt-1">Histórico</span>
        </button>

        {/* Glossary / Rules button */}
        <button
          onClick={() => onTabChange('glossary')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
            activeTab === 'glossary' ? 'text-amber-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <HelpCircle size={19} />
          <span className="text-[10px] tracking-tight mt-1">Regras</span>
        </button>
      </div>
    </nav>
  );
};
