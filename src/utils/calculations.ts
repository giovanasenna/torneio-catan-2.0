import { ANNUAL_POINTS_TABLE, OFFICIAL_PLAYERS, PONTOS_BASE_INVERNO_2026, SEASONS, WINTER_S1_OFFICIAL } from '../constants';
import { AnnualStanding, Match, PlayerStanding, Season } from '../types';

/**
 * Calculates Efficiency Points (PE - Eficiência por Cenário):
 * PE = (PV_jogador / Meta_PV_cenario) * 10 + Bônus de Vitória
 * - Bônus vitória isolada: +2.0 PE (teto cravado em 12.0 PE)
 * - Empate em 1º lugar: +1.0 PE para cada jogador empatado
 */
export function calculatePE(
  vp: number,
  targetVP: number,
  isWinner: boolean,
  isTieForWinner: boolean = false
): number {
  if (targetVP <= 0) return 0;
  const bonus = isWinner ? (isTieForWinner ? 1.0 : 2.0) : 0.0;
  let pe = (vp / targetVP) * 10.0 + bonus;
  if (isWinner && !isTieForWinner) {
    pe = Math.min(12.0, pe);
  }
  return Number(pe.toFixed(2));
}

/**
 * Calculates Normalized VP (PV do jogador / Meta de PV)
 */
export function calculateNormalizedVP(vp: number, targetVP: number): number {
  if (targetVP <= 0) return 0;
  return Number((vp / targetVP).toFixed(3));
}

/**
 * Calculates VP% Balanceado:
 * (PV do Jogador / Soma total de PV da mesa) * (Número de Jogadores na Mesa / 4) * 100
 */
export function calculateBalancedVPPercent(
  playerVP: number,
  totalTableVP: number,
  numPlayers: number
): number {
  if (totalTableVP <= 0) return 0;
  const rawRatio = playerVP / totalTableVP;
  const balanceFactor = numPlayers / 4;
  return Number((rawRatio * balanceFactor * 100).toFixed(2));
}

/**
 * Computes the leaderboard standings for a given season or across all seasons.
 * Ranking Criteria:
 * 1º: Pontos de Eficiência Totais (PE)
 * 2º: Vitórias (desc)
 * 3º: Total PV (desc)
 * 4º: Média do VP% Balanceado (desc)
 */
export function calculateStandings(
  matches: Match[],
  seasonFilter?: Season | 'all',
  includeVisitors: boolean = false
): PlayerStanding[] {
  const filteredMatches = seasonFilter && seasonFilter !== 'all'
    ? matches.filter(m => m.season === seasonFilter)
    : matches;

  const playerMap = new Map<string, {
    playerId: string;
    playerName: string;
    isOfficial: boolean;
    playerColorHex: string;
    matchesPlayed: number;
    wins: number;
    totalPE: number;
    totalVP: number;
    sumBalancedVPPercent: number;
    highestVP: number;
  }>();

  // Pre-seed official players so they always appear in standings
  if (!includeVisitors || seasonFilter !== 'all') {
    for (const official of OFFICIAL_PLAYERS) {
      playerMap.set(official.id, {
        playerId: official.id,
        playerName: official.name,
        isOfficial: true,
        playerColorHex: official.colorHex,
        matchesPlayed: 0,
        wins: 0,
        totalPE: 0,
        totalVP: 0,
        sumBalancedVPPercent: 0,
        highestVP: 0,
      });
    }
  }

  for (const match of filteredMatches) {
    // Check if multiple winners
    const winners = match.playerResults.filter(r => r.isWinner);
    const isTieForWinner = winners.length > 1;

    for (const res of match.playerResults) {
      if (!includeVisitors && !res.isOfficial) {
        continue;
      }

      let p = playerMap.get(res.playerId);
      if (!p) {
        p = {
          playerId: res.playerId,
          playerName: res.playerName,
          isOfficial: res.isOfficial,
          playerColorHex: res.playerColorHex,
          matchesPlayed: 0,
          wins: 0,
          totalPE: 0,
          totalVP: 0,
          sumBalancedVPPercent: 0,
          highestVP: 0,
        };
        playerMap.set(res.playerId, p);
      }

      p.matchesPlayed += 1;
      if (res.isWinner) {
        p.wins += 1;
      }
      const pe = res.pe ?? calculatePE(res.vp, match.targetVP, res.isWinner, isTieForWinner);
      p.totalPE = Number((p.totalPE + pe).toFixed(2));
      p.totalVP += res.vp;
      p.sumBalancedVPPercent += res.balancedVPPercent;
      if (res.vp > p.highestVP) {
        p.highestVP = res.vp;
      }
    }
  }

  const list: PlayerStanding[] = Array.from(playerMap.values()).map(p => {
    const avgVP = p.matchesPlayed > 0 ? Number((p.totalVP / p.matchesPlayed).toFixed(2)) : 0;
    const avgPE = p.matchesPlayed > 0 ? Number((p.totalPE / p.matchesPlayed).toFixed(2)) : 0;
    const winRate = p.matchesPlayed > 0 ? Number(((p.wins / p.matchesPlayed) * 100).toFixed(1)) : 0;
    const avgBalancedVPPercent = p.matchesPlayed > 0
      ? Number((p.sumBalancedVPPercent / p.matchesPlayed).toFixed(2))
      : 0;

    return {
      playerId: p.playerId,
      playerName: p.playerName,
      isOfficial: p.isOfficial,
      playerColorHex: p.playerColorHex,
      matchesPlayed: p.matchesPlayed,
      wins: p.wins,
      totalPE: p.totalPE,
      avgPE,
      totalVP: p.totalVP,
      avgVP,
      winRate,
      avgBalancedVPPercent,
      highestVP: p.highestVP,
      rank: 1,
    };
  });

  list.sort((a, b) => {
    if (b.totalPE !== a.totalPE) return b.totalPE - a.totalPE;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.totalVP !== a.totalVP) return b.totalVP - a.totalVP;
    return b.avgBalancedVPPercent - a.avgBalancedVPPercent;
  });

  let currentRank = 1;
  list.forEach((item, index) => {
    if (index > 0) {
      const prev = list[index - 1];
      if (item.totalPE === prev.totalPE && item.wins === prev.wins && item.totalVP === prev.totalVP && item.matchesPlayed === prev.matchesPlayed) {
        item.rank = prev.rank;
        return;
      } else {
        currentRank = index + 1;
      }
    }
    item.rank = currentRank;
  });

  return list;
}

/**
 * Computes Annual Ranking across the 4 Seasons for the 4 Official Players.
 * Temporada 2026: Reconstrução por Valor Esperado para o Inverno (135 PE, 130 PE, 115 PE, 115 PE)
 * + soma de PE das partidas disputadas nas demais estações (Primavera, Verão, Outono).
 * Temporada 2027+: 100% soma de partidas de todas as 4 estações.
 */
export function calculateAnnualRanking(matches: Match[], seasonYear: number = 2026): AnnualStanding[] {
  const result: Record<string, AnnualStanding> = {};

  for (const p of OFFICIAL_PLAYERS) {
    result[p.id] = {
      playerId: p.id,
      playerName: p.name,
      colorHex: p.colorHex,
      pointsBySeason: {
        Inverno: 0,
        Primavera: 0,
        Verão: 0,
        Outono: 0,
      },
      seasonRanks: {
        Inverno: null,
        Primavera: null,
        Verão: null,
        Outono: null,
      },
      totalAnnualPoints: 0,
      rank: 1,
    };
  }

  // 1. Inverno: Utiliza a Reconstrução por Valor Esperado (135/130/115/115 PE) para 2026
  if (seasonYear === 2026) {
    for (const item of WINTER_S1_OFFICIAL) {
      if (result[item.playerId]) {
        const basePE = PONTOS_BASE_INVERNO_2026[item.playerId] || item.pePoints || 115.0;
        result[item.playerId].pointsBySeason.Inverno = basePE;
        result[item.playerId].seasonRanks.Inverno = item.rank;
        result[item.playerId].totalAnnualPoints = basePE;
      }
    }
  }

  // 2. Demais Estações (ou todas em 2027+): soma direta dos Pontos de Eficiência (PE)
  const seasonsToProcess: Season[] = seasonYear === 2026
    ? ['Primavera', 'Verão', 'Outono']
    : ['Inverno', 'Primavera', 'Verão', 'Outono'];

  for (const season of seasonsToProcess) {
    const seasonMatches = matches.filter(m => m.season === season);
    if (seasonMatches.length === 0) continue;

    const seasonStandings = calculateStandings(matches, season, false);

    seasonStandings.forEach(standing => {
      const peTotal = standing.totalPE;
      const pos = standing.rank;
      if (result[standing.playerId]) {
        result[standing.playerId].pointsBySeason[season] = peTotal;
        result[standing.playerId].seasonRanks[season] = pos;
        result[standing.playerId].totalAnnualPoints = Number((result[standing.playerId].totalAnnualPoints + peTotal).toFixed(2));
      }
    });
  }

  const annualList = Object.values(result);

  annualList.sort((a, b) => {
    if (b.totalAnnualPoints !== a.totalAnnualPoints) {
      return b.totalAnnualPoints - a.totalAnnualPoints;
    }
    // Tiebreaker: compare Inverno rank
    const rankA = a.seasonRanks.Inverno || 99;
    const rankB = b.seasonRanks.Inverno || 99;
    return rankA - rankB;
  });

  annualList.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return annualList;
}
