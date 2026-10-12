import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  ExternalLink,
  Upload,
  Download,
  Plus,
  Link,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Match } from '../types';
import {
  getAccessToken,
  googleSignIn,
  googleSignOut,
  initAuth,
} from '../services/googleAuth';
import {
  createTournamentSpreadsheet,
  exportMatchesToSheet,
  getSpreadsheetInfo,
  importMatchesFromSheet,
  SpreadsheetInfo,
} from '../services/googleSheets';

interface GoogleSheetsPanelProps {
  matches: Match[];
  onMatchesUpdated: (newMatches: Match[]) => void;
  showToast: (msg: string) => void;
}

const STORAGE_SPREADSHEET_ID = 'catan_linked_spreadsheet_id';

export const GoogleSheetsPanel: React.FC<GoogleSheetsPanelProps> = ({
  matches,
  onMatchesUpdated,
  showToast,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [linkedSheet, setLinkedSheet] = useState<SpreadsheetInfo | null>(null);
  const [inputSheetUrlOrId, setInputSheetUrlOrId] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    type: 'export' | 'import';
    title: string;
    description: string;
  } | null>(null);

  // Initialize auth listener
  useEffect(() => {
    initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    // Load previously saved spreadsheet ID
    const savedId = localStorage.getItem(STORAGE_SPREADSHEET_ID);
    if (savedId) {
      setLinkedSheet({
        id: savedId,
        title: 'Planilha Vinculada de Catan',
        url: `https://docs.google.com/spreadsheets/d/${savedId}/edit`,
      });
    }
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(`Conectado como ${res.user.displayName || res.user.email}!`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('Falha ao autenticar com o Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleSignOut();
    setUser(null);
    setToken(null);
    showToast('Desconectado da conta Google.');
  };

  const extractSpreadsheetId = (urlOrId: string): string => {
    const clean = urlOrId.trim();
    const match = clean.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return clean;
  };

  const handleCreateNewSheet = async () => {
    if (!token) return;
    setLoadingAction('create');
    try {
      const info = await createTournamentSpreadsheet(token, matches);
      setLinkedSheet(info);
      localStorage.setItem(STORAGE_SPREADSHEET_ID, info.id);
      showToast('Planilha criada com sucesso no seu Google Drive!');
    } catch (err: any) {
      console.error('Error creating sheet:', err);
      showToast(err.message || 'Erro ao criar planilha.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLinkExistingSheet = async () => {
    if (!token) return;
    const sheetId = extractSpreadsheetId(inputSheetUrlOrId);
    if (!sheetId) {
      showToast('Por favor, informe uma URL ou ID de planilha válido.');
      return;
    }

    setLoadingAction('link');
    try {
      const info = await getSpreadsheetInfo(token, sheetId);
      setLinkedSheet(info);
      localStorage.setItem(STORAGE_SPREADSHEET_ID, info.id);
      setInputSheetUrlOrId('');
      showToast('Planilha vinculada com sucesso!');
    } catch (err: any) {
      console.error('Error linking sheet:', err);
      showToast(err.message || 'Erro ao vincular planilha.');
    } finally {
      setLoadingAction(null);
    }
  };

  const executeExport = async () => {
    if (!token || !linkedSheet) return;
    setShowConfirmModal(null);
    setLoadingAction('export');
    try {
      await exportMatchesToSheet(token, linkedSheet.id, matches);
      showToast(`Todas as ${matches.length} partidas foram enviadas para o Google Sheets!`);
    } catch (err: any) {
      console.error('Error exporting to sheet:', err);
      showToast(err.message || 'Erro ao sincronizar com Google Sheets.');
    } finally {
      setLoadingAction(null);
    }
  };

  const executeImport = async () => {
    if (!token || !linkedSheet) return;
    setShowConfirmModal(null);
    setLoadingAction('import');
    try {
      const importedMatches = await importMatchesFromSheet(token, linkedSheet.id);
      if (importedMatches.length === 0) {
        showToast('Nenhuma partida encontrada na aba "Partidas" desta planilha.');
      } else {
        onMatchesUpdated(importedMatches);
        showToast(`${importedMatches.length} partidas importadas com sucesso da planilha!`);
      }
    } catch (err: any) {
      console.error('Error importing from sheet:', err);
      showToast(err.message || 'Erro ao importar dados da planilha.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-stone-100">
              Integração com Google Sheets Oficial
            </h2>
            <p className="text-xs text-stone-400">
              Sincronize partidas em tempo real com sua planilha no Google Drive.
            </p>
          </div>
        </div>

        {/* User Auth State / Google Button */}
        {user ? (
          <div className="flex items-center gap-2.5 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 text-xs">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuário'}
                className="w-6 h-6 rounded-full border border-stone-700"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 pr-1">
              <span className="font-semibold text-stone-200 block truncate max-w-[120px]">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-stone-400 hover:text-red-400 p-1"
              title="Desconectar do Google"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-900 font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 min-h-[40px]"
          >
            <svg viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isLoggingIn ? 'Conectando...' : 'Conectar com Google'}</span>
          </button>
        )}
      </div>

      {!user ? (
        <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl text-xs text-stone-300 space-y-2">
          <div className="font-semibold text-amber-300">
            Conecte sua conta do Google para habilitar o Google Sheets:
          </div>
          <p className="text-stone-400">
            Ao conectar com o Google, você poderá criar uma planilha automática no seu Google Drive com todas as partidas do torneio, ou vincular uma planilha existente para importar e exportar pontuações em 1 clique.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Linked Spreadsheet Status */}
          {linkedSheet ? (
            <div className="p-3.5 bg-stone-950 border border-emerald-900/60 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs text-stone-200 truncate">
                    {linkedSheet.title}
                  </span>
                </div>
                <a
                  href={linkedSheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                >
                  <span>Abrir no Google Sheets</span>
                  <ExternalLink size={13} />
                </a>
              </div>
              <div className="text-[11px] font-mono text-stone-400 truncate">
                ID da Planilha: {linkedSheet.id}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-400">
              Nenhuma planilha vinculada ainda. Escolha uma das opções abaixo para começar:
            </div>
          )}

          {/* Action Buttons Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Create new sheet */}
            <button
              onClick={handleCreateNewSheet}
              disabled={loadingAction !== null}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 min-h-[42px]"
            >
              <Plus size={15} />
              <span>
                {loadingAction === 'create'
                  ? 'Criando Planilha...'
                  : 'Criar Nova Planilha no Drive'}
              </span>
            </button>

            {/* Export matches to sheet */}
            <button
              onClick={() => {
                if (!linkedSheet) {
                  showToast('Vincule ou crie uma planilha primeiro.');
                  return;
                }
                setShowConfirmModal({
                  type: 'export',
                  title: 'Enviar Partidas para o Google Sheets?',
                  description: `Isso irá atualizar a aba "Partidas" da sua planilha com todas as ${matches.length} partidas registradas no app.`,
                });
              }}
              disabled={loadingAction !== null || !linkedSheet}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 min-h-[42px]"
            >
              <Upload size={15} className="text-amber-400" />
              <span>
                {loadingAction === 'export'
                  ? 'Sincronizando...'
                  : 'Enviar Dados para a Planilha'}
              </span>
            </button>

            {/* Import matches from sheet */}
            <button
              onClick={() => {
                if (!linkedSheet) {
                  showToast('Vincule ou crie uma planilha primeiro.');
                  return;
                }
                setShowConfirmModal({
                  type: 'import',
                  title: 'Importar Partidas do Google Sheets?',
                  description:
                    'Isso irá ler os dados da aba "Partidas" da planilha e sincronizar com o torneio no app.',
                });
              }}
              disabled={loadingAction !== null || !linkedSheet}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 min-h-[42px]"
            >
              <Download size={15} className="text-emerald-400" />
              <span>
                {loadingAction === 'import'
                  ? 'Importando...'
                  : 'Carregar Dados da Planilha'}
              </span>
            </button>
          </div>

          {/* Link existing sheet input */}
          <div className="pt-2 border-t border-stone-800/80">
            <label className="block text-xs font-semibold text-stone-400 mb-1.5">
              Vincular Planilha Existente por URL ou ID:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cole o link completo do Google Sheets ou o ID da planilha..."
                value={inputSheetUrlOrId}
                onChange={e => setInputSheetUrlOrId(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 min-h-[40px]"
              />
              <button
                onClick={handleLinkExistingSheet}
                disabled={loadingAction !== null || !inputSheetUrlOrId.trim()}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold border border-stone-700 transition-colors disabled:opacity-50 shrink-0 min-h-[40px]"
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Destructive / Mutating operations (MANDATORY per workspace skill) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 max-w-md w-full text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-100 font-serif">
                  {showConfirmModal.title}
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  {showConfirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-3.5 py-2 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={
                  showConfirmModal.type === 'export'
                    ? executeExport
                    : executeImport
                }
                className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
