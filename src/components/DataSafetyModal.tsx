import React, { useRef, useState } from 'react';
import { ShieldCheck, Download, Upload, FileText, CheckCircle2, AlertTriangle, X, Database, GitBranch, RefreshCw } from 'lucide-react';
import { Match } from '../types';
import { downloadBackupJSON, downloadBackupCSV, importMatchesJSON } from '../api';

interface DataSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  onMatchesUpdated: (newMatches: Match[]) => void;
}

export const DataSafetyModal: React.FC<DataSafetyModalProps> = ({
  isOpen,
  onClose,
  matches,
  onMatchesUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [copiedGitCommand, setCopiedGitCommand] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    downloadBackupJSON(matches);
  };

  const handleDownloadCSV = () => {
    downloadBackupCSV(matches);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        throw new Error('O arquivo selecionado não contém um formato de lista válido.');
      }

      const success = await importMatchesJSON(parsed);
      if (success) {
        onMatchesUpdated(parsed);
        setImportStatus(`Sucesso! ${parsed.length} partidas restauradas.`);
      } else {
        setImportStatus('Falha ao restaurar no servidor, mas salvo no navegador.');
      }
    } catch (err: any) {
      setImportStatus(`Erro ao importar: ${err?.message || 'Arquivo inválido'}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const gitSnippet = `# 1. Salvar suas partidas locais antes de atualizar:
git add data/catan_matches.json catan_torneio_dados.csv
git commit -m "feat: salvar partidas registradas de Catan"

# 2. Enviar com segurança para seu repositório no GitHub:
git push origin main`;

  const copyGitToClipboard = () => {
    navigator.clipboard.writeText(gitSnippet);
    setCopiedGitCommand(true);
    setTimeout(() => setCopiedGitCommand(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-auto max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-stone-100">
                Segurança dos Dados & Backup
              </h2>
              <p className="text-xs text-stone-400">
                Garantia de que nenhuma partida será perdida ao atualizar ou usar o GitHub.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Database Status */}
        <div className="bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-stone-300">
            <Database size={16} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold block text-stone-200">
                Banco de Dados Atual
              </span>
              <span className="text-[11px] text-stone-400">
                {matches.length} {matches.length === 1 ? 'partida registrada' : 'partidas registradas'} nesta temporada
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold">
            <CheckCircle2 size={13} />
            <span>Duplo Espelho Ativo</span>
          </div>
        </div>

        {/* Action Buttons: Download JSON & CSV */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-stone-300 block">
            1. Baixar Cópia Offline Imediata (Recomendado):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleDownloadJSON}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <Download size={15} />
              <span>Baixar Backup (.json)</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold rounded-xl text-xs border border-stone-700 transition-all active:scale-[0.98]"
            >
              <FileText size={15} className="text-amber-400" />
              <span>Exportar Planilha (.csv)</span>
            </button>
          </div>
        </div>

        {/* Restore Backup Section */}
        <div className="space-y-2 pt-1 border-t border-stone-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-300">
              2. Restaurar / Importar de Arquivo:
            </span>
          </div>
          <div className="bg-stone-950/60 border border-stone-800 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-stone-400">
              Perdeu algo após uma atualização? Selecione seu arquivo <code>.json</code> para restaurar na hora.
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl border border-stone-700 transition-all"
            >
              <Upload size={14} className="text-emerald-400" />
              <span>{isImporting ? 'Restaurando...' : 'Carregar Arquivo'}</span>
            </button>
          </div>
          {importStatus && (
            <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900/60 p-2.5 rounded-xl">
              {importStatus}
            </div>
          )}
        </div>

        {/* GitHub Safety Guide */}
        <div className="space-y-2 pt-1 border-t border-stone-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
            <GitBranch size={15} className="text-amber-400" />
            <span>3. Como Enviar para o GitHub sem Sobrescrever Seus Dados:</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Se você adicionou partidas no app e quer publicar o código no GitHub, certifique-se de incluir os arquivos de dados no commit:
          </p>
          <div className="relative bg-stone-950 p-3 rounded-xl border border-stone-800 font-mono text-[11px] text-amber-200/90 leading-relaxed overflow-x-auto">
            <pre className="whitespace-pre">{gitSnippet}</pre>
            <button
              onClick={copyGitToClipboard}
              className="absolute top-2 right-2 px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[10px] font-sans transition-colors"
            >
              {copiedGitCommand ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
