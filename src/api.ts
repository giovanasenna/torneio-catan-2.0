import { INITIAL_MATCHES } from './constants';
import { BoardAnalysisResult, Match } from './types';
import {
  getMatchesFromFirestore,
  saveMatchToFirestore,
  deleteMatchFromFirestore,
  syncMatchesToFirestore,
} from './services/firebase';

const LOCAL_STORAGE_KEY = 'catan_tournament_matches_v1';

export async function analyzeBoardPhoto(
  imageBase64: string,
  scenarioName: string,
  targetVP: number
): Promise<BoardAnalysisResult> {
  const res = await fetch('/api/analyze-board', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      scenarioName,
      targetVP,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Falha na comunicação com o servidor de IA.' }));
    throw new Error(errorData.error || 'Erro ao analisar foto com IA');
  }

  return res.json();
}

export async function fetchMatches(): Promise<Match[]> {
  // 1. Read local cache first (for offline support and auto-recovery)
  let localMatches: Match[] = [];
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localMatches = parsed;
      }
    } catch {
      // ignore parse error
    }
  }

  // 2. Fetch from Cloud Firestore (shared real-time database across all friends' devices)
  try {
    const firestoreMatches = await getMatchesFromFirestore();

    // Auto-Recovery: if user registered matches locally over the weekend that aren't in Firestore yet,
    // automatically sync them up so all friends see them!
    if (localMatches.length > 0) {
      const firestoreIds = new Set(firestoreMatches.map(m => m.id));
      const missingInCloud = localMatches.filter(m => !firestoreIds.has(m.id));
      if (missingInCloud.length > 0) {
        console.log(`Sincronizando ${missingInCloud.length} partidas locais com o Cloud Firestore...`);
        await syncMatchesToFirestore(missingInCloud);
        const combined = [...firestoreMatches, ...missingInCloud];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
        return combined;
      }
    }

    if (firestoreMatches.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(firestoreMatches));
      return firestoreMatches;
    }
  } catch (cloudErr) {
    console.warn('Erro ao carregar do Firestore, tentando servidor secundário:', cloudErr);
  }

  // 3. Fallback to Express backend
  try {
    const res = await fetch('/api/matches');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        syncMatchesToFirestore(data).catch(() => {});
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend fetch failed, using local storage fallback:', err);
  }

  // 4. Return local matches or initial state
  if (localMatches.length > 0) {
    syncMatchesToFirestore(localMatches).catch(() => {});
    return localMatches;
  }

  return INITIAL_MATCHES;
}

export async function saveMatch(match: Match): Promise<Match> {
  // 1. Update local cache immediately
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  let current: Match[] = [];
  if (cached) {
    try {
      current = JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  const existingIdx = current.findIndex(m => m.id === match.id);
  const updated = [...current];
  if (existingIdx >= 0) {
    updated[existingIdx] = match;
  } else {
    updated.unshift(match);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  // 2. Save directly to Cloud Firestore so all friends see it instantly!
  try {
    await saveMatchToFirestore(match);
  } catch (cloudErr) {
    console.warn('Firestore save failed:', cloudErr);
  }

  // 3. Save to Express server as backup
  try {
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend save failed, saved in cloud and local storage:', err);
  }

  return match;
}

export async function deleteMatch(matchId: string): Promise<boolean> {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const current: Match[] = JSON.parse(cached);
      const updated = current.filter(m => m.id !== matchId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  try {
    await deleteMatchFromFirestore(matchId);
  } catch (cloudErr) {
    console.warn('Firestore delete failed:', cloudErr);
  }

  try {
    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend delete failed:', err);
    return true;
  }
}

export async function resetMatchesToInitial(): Promise<Match[]> {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MATCHES));
  try {
    await fetch('/api/matches/reset', { method: 'POST' });
  } catch (err) {
    console.warn('Backend reset failed:', err);
  }
  return INITIAL_MATCHES;
}

export async function importMatchesJSON(newMatches: Match[]): Promise<boolean> {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMatches));
  try {
    await syncMatchesToFirestore(newMatches);
  } catch (cloudErr) {
    console.warn('Firestore sync failed during import:', cloudErr);
  }
  try {
    const res = await fetch('/api/matches/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatches),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend import failed, saved in localStorage:', err);
    return true;
  }
}

export function exportMatchesToCSV(matches: Match[]): string {
  const headers = [
    'Partida_ID',
    'Data',
    'Estação',
    'Cenário',
    'Meta_PV',
    'Expansão_5_6',
    'Vencedor',
    'Jogador',
    'Oficial',
    'PV',
    'PV_Normalizado',
    'VP_Percent_Balanceado',
    'Venceu',
    'Observações',
  ];

  const rows: string[] = [headers.join(',')];

  for (const m of matches) {
    for (const p of m.playerResults) {
      const row = [
        `"${m.id}"`,
        `"${m.date}"`,
        `"${m.season}"`,
        `"${m.scenarioName.replace(/"/g, '""')}"`,
        m.targetVP,
        m.is5to6Players ? 'Sim' : 'Não',
        `"${m.winnerName.replace(/"/g, '""')}"`,
        `"${p.playerName.replace(/"/g, '""')}"`,
        p.isOfficial ? 'Sim' : 'Não',
        p.vp,
        p.normalizedVP,
        p.balancedVPPercent,
        p.isWinner ? 'Sim' : 'Não',
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ];
      rows.push(row.join(','));
    }
  }

  return '\uFEFF' + rows.join('\r\n');
}

export function triggerDownloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBackupJSON(matches: Match[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const jsonStr = JSON.stringify(matches, null, 2);
  triggerDownloadFile(jsonStr, `catan_matches_backup_${dateStr}.json`, 'application/json');
}

export function downloadBackupCSV(matches: Match[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const csvStr = exportMatchesToCSV(matches);
  triggerDownloadFile(csvStr, `catan_torneio_dados_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}
