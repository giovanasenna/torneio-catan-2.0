import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUP_DIR = path.resolve(DATA_DIR, 'backups');
const DATA_FILE = path.resolve(DATA_DIR, 'catan_matches.json');
const DEFAULT_DATA_FILE = path.resolve(DATA_DIR, 'default_matches.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function getDefaultMatches(): any[] {
  try {
    if (fs.existsSync(DEFAULT_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DEFAULT_DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading default matches:', err);
  }
  return [];
}

// Ensure data directory and initial file exist
function getMatches(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const defaults = getDefaultMatches();
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
      return defaults;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading matches data:', err);
    return getDefaultMatches();
  }
}

function saveMatches(matches: any[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Automated rolling backups: if existing file has matches, preserve it before modifying
    if (fs.existsSync(DATA_FILE)) {
      try {
        const existingRaw = fs.readFileSync(DATA_FILE, 'utf-8');
        const existing = JSON.parse(existingRaw);
        if (Array.isArray(existing) && existing.length > 0) {
          const backupLatest = path.resolve(BACKUP_DIR, 'catan_matches_backup_latest.json');
          fs.writeFileSync(backupLatest, existingRaw, 'utf-8');

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupTimed = path.resolve(BACKUP_DIR, `catan_matches_backup_${timestamp}.json`);
          fs.writeFileSync(backupTimed, existingRaw, 'utf-8');
        }
      } catch (bErr) {
        console.warn('Backup warning:', bErr);
      }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(matches, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing matches data:', err);
    return false;
  }
}

// API Endpoints
app.post('/api/analyze-board', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', scenarioName, targetVP } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma foto enviada para análise.' });
    }

    let cleanBase64 = imageBase64;
    let detectedMime = mimeType;
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      cleanBase64 = parts[1];
      const mimeMatch = parts[0].match(/data:(.*?);/);
      if (mimeMatch && mimeMatch[1]) {
        detectedMime = mimeMatch[1];
      }
    }

    const prompt = `Você é um árbitro especialista e contador oficial do jogo Catan (Colonizadores de Catan e Catan Navegantes).
Analise a foto fornecida do tabuleiro de Catan (ou de uma folha de anotações / placar final).
Sua missão é identificar as peças no mapa e calcular os Pontos de Vitória (PV) de cada jogador conforme as regras oficiais:
- Cada Aldeia (Settlement / Povoado): 1 PV
- Cada Cidade (City): 2 PV
- Maior Estrada (Longest Road): 2 PV (concedido ao jogador com a rede contínua de estradas/navios mais longa, mín. 5)
- Maior Exército (Largest Army): 2 PV (concedido ao jogador com 3+ cavaleiros ativados)
- Cartas de Ponto de Vitória / Pontos de Vitória de Cenário (se visíveis no tabuleiro, fichas de ilha, maravilhas ou tokens).

Contexto da Partida:
- Cenário: "${scenarioName || 'Catan Base'}"
- Meta de Vitória: ${targetVP || 10} PV

Jogadores Oficiais do Torneio (identifique prioritariamente por essas cores):
- Branco: Jhonata (matchedPlayerId: "jhonata", matchedPlayerName: "Jhonata")
- Azul: Rodrigo (matchedPlayerId: "rodrigo", matchedPlayerName: "Rodrigo")
- Vermelho: Giovana (matchedPlayerId: "giovana", matchedPlayerName: "Giovana")
- Amarelo: Zhang (matchedPlayerId: "zhang", matchedPlayerName: "Zhang")
Se houver jogadores com outras cores visíveis (como Verde, Laranja, Marrom, etc.), identifique-os como Visitantes (ex: "Visitante Verde").

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown nem texto fora do JSON) no seguinte formato:
{
  "detectedPlayers": [
    {
      "colorName": "Branco" | "Azul" | "Vermelho" | "Amarelo" | string,
      "matchedPlayerId": "jhonata" | "rodrigo" | "giovana" | "zhang" | string,
      "matchedPlayerName": "Jhonata" | "Rodrigo" | "Giovana" | "Zhang" | string,
      "settlements": number,
      "cities": number,
      "hasLongestRoad": boolean,
      "hasLargestArmy": boolean,
      "vpCards": number,
      "bonusVP": number,
      "estimatedVP": number,
      "confidence": "high" | "medium" | "low",
      "notes": "Detalhamento sucinto das peças identificadas no tabuleiro"
    }
  ],
  "winnerDetected": "Nome do jogador com mais pontos",
  "boardDescription": "Resumo visual claro das construções observadas",
  "tipsForReview": "Lembrete: verifique se os jogadores possuem cartas de desenvolvimento com Ponto de Vitória ocultas na mão!"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: detectedMime,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);

    return res.json(parsed);
  } catch (err: any) {
    console.error('Erro ao analisar foto do tabuleiro:', err);
    return res.status(500).json({
      error: 'Não foi possível analisar a imagem do tabuleiro automaticamente.',
      details: err?.message || String(err),
    });
  }
});

app.get('/api/matches', (_req, res) => {
  const matches = getMatches();
  res.json(matches);
});

// Import JSON endpoint
app.post('/api/matches/import', (req, res) => {
  const newMatches = req.body;
  if (!Array.isArray(newMatches)) {
    return res.status(400).json({ error: 'Formato inválido. Esperado um array de partidas.' });
  }

  // Basic validation
  for (const m of newMatches) {
    if (!m.id || !m.season || !Array.isArray(m.playerResults)) {
      return res.status(400).json({ error: `Partida inválida detectada: ${m.id || 'sem ID'}` });
    }
  }

  saveMatches(newMatches);
  res.json({ success: true, count: newMatches.length, matches: newMatches });
});

app.post('/api/matches', (req, res) => {
  const match = req.body;
  if (!match || !match.season || !match.scenarioId || !Array.isArray(match.playerResults)) {
    return res.status(400).json({ error: 'Dados da partida incompletos ou inválidos.' });
  }

  const matches = getMatches();
  const existingIdx = matches.findIndex((m: any) => m.id === match.id);
  if (existingIdx >= 0) {
    matches[existingIdx] = match;
  } else {
    matches.unshift(match);
  }

  saveMatches(matches);
  res.status(201).json(match);
});

app.put('/api/matches/:id', (req, res) => {
  const matchId = req.params.id;
  const updatedMatch = req.body;
  const matches = getMatches();
  const idx = matches.findIndex((m: any) => m.id === matchId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Partida não encontrada.' });
  }

  matches[idx] = updatedMatch;
  saveMatches(matches);
  res.json(updatedMatch);
});

app.delete('/api/matches/:id', (req, res) => {
  const matchId = req.params.id;
  let matches = getMatches();
  const initialLen = matches.length;
  matches = matches.filter((m: any) => m.id !== matchId);

  if (matches.length === initialLen) {
    return res.status(404).json({ error: 'Partida não encontrada.' });
  }

  saveMatches(matches);
  res.json({ success: true, id: matchId });
});

app.post('/api/matches/reset', (_req, res) => {
  const defaults = getDefaultMatches();
  saveMatches(defaults);
  res.json({ success: true, matches: defaults });
});

// CSV Export Endpoint
app.get('/api/export/csv', (_req, res) => {
  const matches = getMatches();
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
    'Observações'
  ];

  const rows: string[] = [headers.join(',')];

  for (const m of matches) {
    for (const p of m.playerResults) {
      const row = [
        `"${m.id}"`,
        `"${m.date}"`,
        `"${m.season}"`,
        `"${(m.scenarioName || '').replace(/"/g, '""')}"`,
        m.targetVP,
        m.is5to6Players ? 'Sim' : 'Não',
        `"${(m.winnerName || '').replace(/"/g, '""')}"`,
        `"${(p.playerName || '').replace(/"/g, '""')}"`,
        p.isOfficial ? 'Sim' : 'Não',
        p.vp,
        p.normalizedVP,
        p.balancedVPPercent,
        p.isWinner ? 'Sim' : 'Não',
        `"${(m.notes || '').replace(/"/g, '""')}"`
      ];
      rows.push(row.join(','));
    }
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="torneio_catan_4_estacoes.csv"');
  res.send('\uFEFF' + rows.join('\r\n'));
});

// JSON Backup Download Endpoint
app.get('/api/backup/download', (_req, res) => {
  const matches = getMatches();
  const timestamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="catan_matches_backup_${timestamp}.json"`);
  res.send(JSON.stringify(matches, null, 2));
});

// Backup Status & Recovery Info Endpoint
app.get('/api/backup/status', (_req, res) => {
  const matches = getMatches();
  let backupsCount = 0;
  if (fs.existsSync(BACKUP_DIR)) {
    backupsCount = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).length;
  }
  res.json({
    totalMatches: matches.length,
    dataFileExists: fs.existsSync(DATA_FILE),
    backupsCount,
    lastBackupAvailable: fs.existsSync(path.resolve(BACKUP_DIR, 'catan_matches_backup_latest.json')),
  });
});

async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const distExists = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || distExists;

  if (isProduction && distExists) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Torneio Catan server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
