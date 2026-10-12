import { Match, MatchPlayerResult, Season } from '../types';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
}

const HEADERS = [
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

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive
 * pre-populated with tournament matches and formatted headers.
 */
export async function createTournamentSpreadsheet(
  accessToken: string,
  matches: Match[]
): Promise<SpreadsheetInfo> {
  const title = `Torneio das 4 Estações de Catan - ${new Date().getFullYear()}`;

  // 1. Create spreadsheet with title and default sheet name "Partidas"
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Partidas',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Erro ao criar planilha: ${errorText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Populate values
  await exportMatchesToSheet(accessToken, spreadsheetId, matches);

  return {
    id: spreadsheetId,
    title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Exports/overwrites matches into the "Partidas" sheet.
 */
export async function exportMatchesToSheet(
  accessToken: string,
  spreadsheetId: string,
  matches: Match[]
): Promise<boolean> {
  // Convert matches to 2D array of rows
  const rows: any[][] = [HEADERS];

  for (const m of matches) {
    for (const p of m.playerResults) {
      rows.push([
        m.id,
        m.date,
        m.season,
        m.scenarioName,
        m.targetVP,
        m.is5to6Players ? 'Sim' : 'Não',
        m.winnerName,
        p.playerName,
        p.isOfficial ? 'Sim' : 'Não',
        p.vp,
        p.normalizedVP,
        p.balancedVPPercent,
        p.isWinner ? 'Sim' : 'Não',
        m.notes || '',
      ]);
    }
  }

  // 1. Clear existing sheet values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Partidas!A1:Z5000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // 2. Write new rows
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Partidas!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Partidas!A1',
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Erro ao sincronizar com Google Sheets: ${errorText}`);
  }

  return true;
}

/**
 * Imports matches from the Google Sheet back into the app format.
 */
export async function importMatchesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Match[]> {
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Partidas!A1:N5000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!readRes.ok) {
    const errorText = await readRes.text();
    throw new Error(`Erro ao ler dados da planilha: ${errorText}`);
  }

  const data = await readRes.json();
  const rows = data.values as string[][];

  if (!rows || rows.length <= 1) {
    return [];
  }

  // Group rows by Partida_ID
  const matchMap = new Map<string, {
    id: string;
    date: string;
    season: Season;
    scenarioName: string;
    targetVP: number;
    is5to6Players: boolean;
    winnerName: string;
    notes: string;
    playerResults: MatchPlayerResult[];
  }>();

  // Skip header (row 0)
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 10) continue;

    const [
      matchId,
      date,
      season,
      scenarioName,
      targetVPStr,
      is5to6Str,
      winnerName,
      playerName,
      isOfficialStr,
      vpStr,
      normVPStr,
      balVPStr,
      isWinnerStr,
      notesStr,
    ] = r;

    if (!matchId) continue;

    const vp = parseInt(vpStr, 10) || 0;
    const isOfficial = isOfficialStr === 'Sim' || isOfficialStr === 'true';
    const isWinner = isWinnerStr === 'Sim' || isWinnerStr === 'true';
    const normalizedVP = parseFloat(normVPStr) || 0;
    const balancedVPPercent = parseFloat(balVPStr) || 0;

    let match = matchMap.get(matchId);
    if (!match) {
      match = {
        id: matchId,
        date: date || new Date().toISOString().split('T')[0],
        season: (season as Season) || 'Primavera',
        scenarioName: scenarioName || 'Catan Jogo Base',
        targetVP: parseInt(targetVPStr, 10) || 10,
        is5to6Players: is5to6Str === 'Sim' || is5to6Str === 'true',
        winnerName: winnerName || playerName,
        notes: notesStr || '',
        playerResults: [],
      };
      matchMap.set(matchId, match);
    }

    // Determine color
    let colorHex = '#8B5CF6';
    const pLower = playerName.toLowerCase();
    if (pLower.includes('jhonata')) colorHex = '#F8FAFC';
    else if (pLower.includes('rodrigo')) colorHex = '#2563EB';
    else if (pLower.includes('giovana')) colorHex = '#DC2626';
    else if (pLower.includes('zhang')) colorHex = '#EAB308';

    match.playerResults.push({
      playerId: `player-${playerName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      playerName,
      isOfficial,
      playerColorHex: colorHex,
      vp,
      normalizedVP,
      balancedVPPercent,
      isWinner,
    });
  }

  const resultMatches: Match[] = [];
  for (const m of matchMap.values()) {
    resultMatches.push({
      ...m,
      scenarioId: m.scenarioName.toLowerCase().includes('base') ? 'base' : 'seafarers-1',
      winnerId: m.playerResults.find(p => p.isWinner)?.playerId || m.playerResults[0]?.playerId || 'w',
      createdAt: new Date().toISOString(),
    });
  }

  return resultMatches;
}

/**
 * Fetches basic metadata for a given spreadsheet ID.
 */
export async function getSpreadsheetInfo(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetInfo> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Não foi possível acessar a planilha informada. Verifique o ID ou as permissões.');
  }

  const data = await res.json();
  return {
    id: spreadsheetId,
    title: data.properties?.title || 'Planilha de Catan',
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
