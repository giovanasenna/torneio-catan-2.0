import { ANNUAL_POINTS_TABLE, OFFICIAL_PLAYERS, PONTOS_BASE_INVERNO_2026, SEASONS, WINTER_S1_OFFICIAL } from '../constants';
import { AnnualStanding, Match, MatchTimelinePoint, PlayerEvolutionPoint, PlayerStanding, Season } from '../types';

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
 * Se houver partidas registradas de Inverno (15 partidas: vencedor 10 PV, demais 9 PV no Catan jogo base),
 * soma as partidas reais. Caso contrário, utiliza a base inicial oficial de 2026.
 */
export function calculateStandings(
  matches: Match[],
  seasonFilter?: Season | 'all',
  includeVisitors: boolean = false,
  seasonYear: number = 2026
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

  const hasWinterMatches = matches.some(m => m.season === 'Inverno');
  const isAllSeasons2026 = (seasonFilter === 'all') && seasonYear === 2026;

  // Pre-seed official players so they always appear in standings
  if (!includeVisitors || seasonFilter !== 'all' || isAllSeasons2026) {
    for (const official of OFFICIAL_PLAYERS) {
      const winterData = WINTER_S1_OFFICIAL.find(w => w.playerId === official.id);
      // Apenas adiciona pontos estáticos de base se NÃO houver partidas reais de Inverno no banco
      const winterBasePE = (isAllSeasons2026 && !hasWinterMatches && winterData)
        ? (PONTOS_BASE_INVERNO_2026[official.id] || winterData.pePoints || 141.0)
        : 0;
      const winterMatches = (isAllSeasons2026 && !hasWinterMatches && winterData) ? (winterData.wins + winterData.losses) : 0;
      const winterWins = (isAllSeasons2026 && !hasWinterMatches && winterData) ? (winterData.wins || 0) : 0;

      playerMap.set(official.id, {
        playerId: official.id,
        playerName: official.name,
        isOfficial: true,
        playerColorHex: official.colorHex,
        matchesPlayed: winterMatches,
        wins: winterWins,
        totalPE: winterBasePE,
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
 * Se houver partidas registradas no Inverno, calcula diretamente a pontuação de Inverno a partir delas.
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

  const hasWinterMatches = matches.some(m => m.season === 'Inverno');

  if (hasWinterMatches) {
    const seasonsToProcess: Season[] = ['Inverno', 'Primavera', 'Verão', 'Outono'];
    for (const season of seasonsToProcess) {
      const seasonMatches = matches.filter(m => m.season === season);
      if (seasonMatches.length === 0) continue;

      const seasonStandings = calculateStandings(matches, season, false, seasonYear);

      seasonStandings.forEach(standing => {
        const peTotal = standing.totalPE;
        const pos = standing.rank;
        if (result[standing.playerId]) {
          result[standing.playerId].pointsBySeason[season] = peTotal;
          result[standing.playerId].seasonRanks[season] = pos;
          result[standing.playerId].totalAnnualPoints = Number(
            (result[standing.playerId].totalAnnualPoints + peTotal).toFixed(2)
          );
        }
      });
    }
  } else {
    // Fallback: se não houver partidas de Inverno no banco, usa os pontos consolidados oficiais
    if (seasonYear === 2026) {
      for (const item of WINTER_S1_OFFICIAL) {
        if (result[item.playerId]) {
          const basePE = PONTOS_BASE_INVERNO_2026[item.playerId] || item.pePoints || 141.0;
          result[item.playerId].pointsBySeason.Inverno = basePE;
          result[item.playerId].seasonRanks.Inverno = item.rank;
          result[item.playerId].totalAnnualPoints = basePE;
        }
      }
    }

    const seasonsToProcess: Season[] = ['Primavera', 'Verão', 'Outono'];
    for (const season of seasonsToProcess) {
      const seasonMatches = matches.filter(m => m.season === season);
      if (seasonMatches.length === 0) continue;

      const seasonStandings = calculateStandings(matches, season, false, seasonYear);

      seasonStandings.forEach(standing => {
        const peTotal = standing.totalPE;
        const pos = standing.rank;
        if (result[standing.playerId]) {
          result[standing.playerId].pointsBySeason[season] = peTotal;
          result[standing.playerId].seasonRanks[season] = pos;
          result[standing.playerId].totalAnnualPoints = Number(
            (result[standing.playerId].totalAnnualPoints + peTotal).toFixed(2)
          );
        }
      });
    }
  }

  const annualList = Object.values(result);

  annualList.sort((a, b) => {
    if (b.totalAnnualPoints !== a.totalAnnualPoints) {
      return b.totalAnnualPoints - a.totalAnnualPoints;
    }
    const rankA = a.seasonRanks.Inverno || 99;
    const rankB = b.seasonRanks.Inverno || 99;
    return rankA - rankB;
  });

  annualList.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return annualList;
}

/**
 * Calculates the chronological evolution of points (PE) for the official players over time.
 * Inclui todas as partidas em ordem cronológica (Inverno 1..15 + Primavera + ...).
 */
export function calculateTimelineEvolution(
  matches: Match[],
  seasonYear: number = 2026
): MatchTimelinePoint[] {
  const timeline: MatchTimelinePoint[] = [];
  const hasWinterMatches = matches.some(m => m.season === 'Inverno');

  const cumulativeMap: Record<string, number> = {};
  for (const official of OFFICIAL_PLAYERS) {
    if (hasWinterMatches) {
      // Começa no zero antes da 1ª partida do ano
      cumulativeMap[official.id] = 0;
    } else {
      // Fallback: se não houver partidas de Inverno, começa com a base consolidada
      const winterData = WINTER_S1_OFFICIAL.find(w => w.playerId === official.id);
      const base = seasonYear === 2026
        ? (PONTOS_BASE_INVERNO_2026[official.id] || winterData?.pePoints || 141.0)
        : 0;
      cumulativeMap[official.id] = base;
    }
  }

  // Ponto Inicial no gráfico
  const initialPlayers: Record<string, PlayerEvolutionPoint> = {};
  for (const official of OFFICIAL_PLAYERS) {
    const base = cumulativeMap[official.id];
    initialPlayers[official.id] = {
      playerId: official.id,
      playerName: official.name,
      colorHex: official.colorHex,
      peGained: base,
      cumulativePE: base,
    };
  }

  timeline.push({
    index: 0,
    matchId: 'base-inicio',
    label: hasWinterMatches ? 'Início do Torneio (Pré-temporada)' : 'Inverno 2026 (Base Oficial)',
    shortLabel: hasWinterMatches ? 'Início' : 'Base Inverno',
    date: '2026-07-01',
    season: 'Inverno',
    scenarioName: hasWinterMatches ? 'Início do Circuito' : '15 Partidas Iniciais Consolidadas',
    players: initialPlayers,
  });

  // Ordena as partidas cronologicamente (da mais antiga para a mais recente)
  const sortedMatches = [...matches].sort((a, b) => {
    const dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;
    return (a.id || '').localeCompare(b.id || '');
  });

  sortedMatches.forEach((m, idx) => {
    const winners = m.playerResults.filter(r => r.isWinner);
    const isTieForWinner = winners.length > 1;

    const currentPlayers: Record<string, PlayerEvolutionPoint> = {};

    for (const official of OFFICIAL_PLAYERS) {
      const res = m.playerResults.find(
        r => r.playerId === official.id || r.playerName.toLowerCase() === official.name.toLowerCase()
      );
      let peGained = 0;
      if (res) {
        peGained = res.pe ?? calculatePE(res.vp, m.targetVP, res.isWinner, isTieForWinner);
        cumulativeMap[official.id] = Number((cumulativeMap[official.id] + peGained).toFixed(2));
      }

      currentPlayers[official.id] = {
        playerId: official.id,
        playerName: official.name,
        colorHex: official.colorHex,
        peGained,
        cumulativePE: cumulativeMap[official.id],
      };
    }

    timeline.push({
      index: idx + 1,
      matchId: m.id,
      label: `${m.id} • ${m.scenarioName}`,
      shortLabel: m.id,
      date: m.date,
      season: m.season,
      scenarioName: m.scenarioName,
      players: currentPlayers,
    });
  });

  return timeline;
}
