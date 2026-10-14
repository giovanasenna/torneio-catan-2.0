import { OfficialPlayer, ScenarioDefinition, Season, Match } from './types';

export const SEASONS: Season[] = ['Inverno', 'Primavera', 'Verão', 'Outono'];
export const CURRENT_SEASON: Season = 'Primavera';

export const OFFICIAL_PLAYERS: OfficialPlayer[] = [
  {
    id: 'zhang',
    name: 'Zhang',
    colorName: 'Amarelo',
    colorHex: '#EAB308',
    colorText: '#713F12',
    borderColor: '#CA8A04',
    isOfficial: true,
  },
  {
    id: 'rodrigo',
    name: 'Rodrigo',
    colorName: 'Azul',
    colorHex: '#2563EB',
    colorText: '#FFFFFF',
    borderColor: '#1D4ED8',
    isOfficial: true,
  },
  {
    id: 'giovana',
    name: 'Giovana',
    colorName: 'Vermelho',
    colorHex: '#DC2626',
    colorText: '#FFFFFF',
    borderColor: '#B91C1C',
    isOfficial: true,
  },
  {
    id: 'jhonata',
    name: 'Jhonata',
    colorName: 'Branco',
    colorHex: '#F8FAFC',
    colorText: '#0F172A',
    borderColor: '#94A3B8',
    isOfficial: true,
  },
];

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'base',
    name: 'Catan Jogo Base',
    category: 'Base',
    defaultVP: 10,
    description: 'Ilha clássica de Catan com portos e florestas. Meta padrão de 10 PV.',
  },
  {
    id: 'seafarers-1',
    name: 'Cenário 1: Rumo a Novas Margens',
    category: 'Navegantes',
    scenarioNumber: 1,
    defaultVP: 14,
    description: 'Navegação para além da ilha principal até ilhas desconhecidas. Meta: 14 PV.',
  },
  {
    id: 'seafarers-2',
    name: 'Cenário 2: As Quatro Ilhas',
    category: 'Navegantes',
    scenarioNumber: 2,
    defaultVP: 13,
    description: 'Arquipélago de 4 ilhas. Pontos bônus por povoar ilhas estrangeiras. Meta: 13 PV.',
  },
  {
    id: 'seafarers-3',
    name: 'Cenário 3: Oceania',
    category: 'Navegantes',
    scenarioNumber: 3,
    defaultVP: 12,
    description: 'Conjunto de pequenas ilhas e rotas marítimas interconectadas. Meta: 12 PV.',
  },
  {
    id: 'seafarers-4',
    name: 'Cenário 4: Através do Deserto',
    category: 'Navegantes',
    scenarioNumber: 4,
    defaultVP: 14,
    description: 'Expedição cruzando o deserto central em direção a terras férteis. Meta: 14 PV.',
  },
  {
    id: 'seafarers-5',
    name: 'Cenário 5: O Povo Perdido',
    category: 'Navegantes',
    scenarioNumber: 5,
    defaultVP: 13,
    description: 'Encontro com aldeias nativas misteriosas que concedem presentes. Meta: 13 PV.',
  },
  {
    id: 'seafarers-6',
    name: 'Cenário 6: Mercadorias para Catan',
    category: 'Navegantes',
    scenarioNumber: 6,
    defaultVP: 14,
    description: 'Transporte de tecidos e joias preciosas de volta à metrópole. Meta: 14 PV.',
  },
  {
    id: 'seafarers-7',
    name: 'Cenário 7: As Ilhas dos Piratas',
    category: 'Navegantes',
    scenarioNumber: 7,
    defaultVP: 10,
    description: 'Batalha contra a frota corsária fortificada. Meta: 10 PV + Conquista.',
  },
  {
    id: 'seafarers-8',
    name: 'Cenário 8: As Maravilhas de Catan',
    category: 'Navegantes',
    scenarioNumber: 8,
    defaultVP: 10,
    description: 'Corrida monumental pela construção das Maravilhas da ilha. Meta: Concluir Maravilha ou 10 PV.',
  },
  {
    id: 'seafarers-9',
    name: 'Cenário 9: Um Novo Mundo',
    category: 'Navegantes',
    scenarioNumber: 9,
    defaultVP: 12,
    description: 'Mapa modular gerado aleatoriamente para exploradores corajosos. Meta: 12 PV.',
  },
  {
    id: 'custom',
    name: 'Partida Personalizada',
    category: 'Personalizado',
    defaultVP: 10,
    description: 'Regras personalizadas com meta de pontuação ajustável.',
  },
];

export const ANNUAL_POINTS_TABLE: Record<number, number> = {
  1: 10, // 1º lugar: 10 pts
  2: 6,  // 2º lugar: 6 pts
  3: 3,  // 3º lugar: 3 pts
  4: 1,  // 4º lugar: 1 pt
};

// Dicionário Oficial de Pontos Iniciais de 2026 (15 partidas no Catan Jogo Base: Vencedor 10 PV = 12 PE, Demais 9 PV = 9 PE)
export const PONTOS_BASE_INVERNO_2026: Record<string, number> = {
  zhang: 153.0,    // (6 * 12.0) + (9 * 9.0)
  rodrigo: 150.0,  // (5 * 12.0) + (10 * 9.0)
  giovana: 141.0,  // (2 * 12.0) + (13 * 9.0)
  jhonata: 141.0,  // (2 * 12.0) + (13 * 9.0)
};

export interface WinterS1SummaryItem {
  playerId: string;
  playerName: string;
  colorHex: string;
  wins: number;
  losses: number;
  rank: number;
  annualPoints: number;
  pePoints: number;
  description: string;
}

// O resultado final oficial do Winter S1 (Inverno 2026): 15 partidas no Jogo Base (Vencedor 10 PV, outros 9 PV)
export const WINTER_S1_OFFICIAL: WinterS1SummaryItem[] = [
  {
    playerId: 'zhang',
    playerName: 'Zhang',
    colorHex: '#EAB308',
    wins: 6,
    losses: 9,
    rank: 1,
    annualPoints: 10,
    pePoints: 153.0,
    description: 'Campeão da Edição Winter S1 (6V • 153.0 PE)',
  },
  {
    playerId: 'rodrigo',
    playerName: 'Rodrigo',
    colorHex: '#2563EB',
    wins: 5,
    losses: 10,
    rank: 2,
    annualPoints: 6,
    pePoints: 150.0,
    description: 'Vice-campeão (5V • 150.0 PE)',
  },
  {
    playerId: 'giovana',
    playerName: 'Giovana',
    colorHex: '#DC2626',
    wins: 2,
    losses: 13,
    rank: 3,
    annualPoints: 3,
    pePoints: 141.0,
    description: '3º Lugar (Empate 2V • 141.0 PE)',
  },
  {
    playerId: 'jhonata',
    playerName: 'Jhonata',
    colorHex: '#F8FAFC',
    wins: 2,
    losses: 13,
    rank: 3,
    annualPoints: 3,
    pePoints: 141.0,
    description: '3º Lugar (Empate 2V • 141.0 PE)',
  },
];

// Dados das 15 partidas oficiais de Inverno no Catan Jogo Base (Vencedor: 10 PV, Demais: 9 PV)
const WINTER_MATCH_DATA: Array<{ id: string; date: string; winnerId: 'zhang' | 'rodrigo' | 'giovana' | 'jhonata' }> = [
  { id: 'w-01', date: '2026-07-05', winnerId: 'zhang' },
  { id: 'w-02', date: '2026-07-10', winnerId: 'rodrigo' },
  { id: 'w-03', date: '2026-07-15', winnerId: 'zhang' },
  { id: 'w-04', date: '2026-07-20', winnerId: 'rodrigo' },
  { id: 'w-05', date: '2026-07-25', winnerId: 'giovana' },
  { id: 'w-06', date: '2026-07-30', winnerId: 'zhang' },
  { id: 'w-07', date: '2026-08-04', winnerId: 'rodrigo' },
  { id: 'w-08', date: '2026-08-09', winnerId: 'jhonata' },
  { id: 'w-09', date: '2026-08-14', winnerId: 'zhang' },
  { id: 'w-10', date: '2026-08-19', winnerId: 'rodrigo' },
  { id: 'w-11', date: '2026-08-24', winnerId: 'giovana' },
  { id: 'w-12', date: '2026-08-29', winnerId: 'zhang' },
  { id: 'w-13', date: '2026-09-02', winnerId: 'jhonata' },
  { id: 'w-14', date: '2026-09-07', winnerId: 'rodrigo' },
  { id: 'w-15', date: '2026-09-12', winnerId: 'zhang' },
];

export const INITIAL_MATCHES: Match[] = WINTER_MATCH_DATA.map(m => {
  const winnerPlayer = OFFICIAL_PLAYERS.find(p => p.id === m.winnerId)!;
  return {
    id: m.id,
    date: m.date,
    season: 'Inverno',
    scenarioId: 'base',
    scenarioName: 'Catan Jogo Base',
    targetVP: 10,
    is5to6Players: false,
    winnerId: m.winnerId,
    winnerName: winnerPlayer.name,
    notes: `Winter S1 - Vitória de ${winnerPlayer.name} (10 PV, demais 9 PV)`,
    createdAt: `${m.date}T18:00:00.000Z`,
    playerResults: OFFICIAL_PLAYERS.map(p => {
      const isWinner = p.id === m.winnerId;
      return {
        playerId: p.id,
        playerName: p.name,
        isOfficial: true,
        playerColorHex: p.colorHex,
        vp: isWinner ? 10 : 9,
        pe: isWinner ? 12.0 : 9.0,
        normalizedVP: isWinner ? 1.0 : 0.9,
        balancedVPPercent: isWinner ? 27.03 : 24.32,
        isWinner,
      };
    }),
  };
});
