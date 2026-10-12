import React, { useState } from 'react';
import { Download, Check, Copy, RefreshCw, Database, Terminal, Upload, ShieldCheck } from 'lucide-react';
import { Match } from '../types';
import { exportMatchesToCSV, importMatchesJSON } from '../api';
import { GoogleSheetsPanel } from './GoogleSheetsPanel';

interface DataAndStreamlitTabProps {
  matches: Match[];
  onResetMatches: () => void;
  onMatchesUpdated: (newMatches: Match[]) => void;
  showToast: (msg: string) => void;
}

export const DataAndStreamlitTab: React.FC<DataAndStreamlitTabProps> = ({
  matches,
  onResetMatches,
  onMatchesUpdated,
  showToast,
}) => {
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedSecrets, setCopiedSecrets] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showImportArea, setShowImportArea] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Download CSV
  const handleDownloadCSV = () => {
    const csvContent = exportMatchesToCSV(matches);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'catan_torneio_4_estacoes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download JSON Backup
  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(matches, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catan_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON handler
  const handleImportJSON = async () => {
    setImportStatus(null);
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        setImportStatus('Erro: O arquivo deve conter uma lista (array) de partidas.');
        return;
      }
      const success = await importMatchesJSON(parsed);
      if (success) {
        setImportStatus(`Sucesso! ${parsed.length} partidas importadas. Recarregando página...`);
        onMatchesUpdated(parsed);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus('Erro ao importar partidas no servidor.');
      }
    } catch {
      setImportStatus('Erro: Texto JSON inválido. Verifique o formato.');
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pythonStreamlitCode = `# Torneio das 4 Estações de Catan - Streamlit App
# Execute: streamlit run streamlit_app.py
import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Torneio das 4 Estações de Catan", page_icon="🎲", layout="wide")

if "gsheets" in st.secrets:
    from streamlit_gsheets import GSheetsConnection
    conn = st.connection("gsheets", type=GSheetsConnection)
    df = conn.read(ttl="5m")
else:
    df = pd.read_csv("catan_torneio_dados.csv")

st.title("🎲 Torneio das 4 Estações de Catan")
st.write("Edição Primavera 2026 - Circuito Oficial")
`;

  const secretsExample = `# .streamlit/secrets.toml para Google Sheets:
[connections.gsheets]
spreadsheet = "https://docs.google.com/spreadsheets/d/SEU_ID_DA_PLANILHA/edit"
worksheet = "Partidas"
type = "service_account"
project_id = "boxwood-bond-lh7nb"
`;

  return (
    <div className="space-y-6">
      {/* 1. Official Google Sheets Integration Panel */}
      <GoogleSheetsPanel
        matches={matches}
        onMatchesUpdated={onMatchesUpdated}
        showToast={showToast}
      />

      {/* 2. Header and Quick Exports */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Database className="text-amber-400" size={22} />
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-amber-100">
              Arquitetura de Dados & Backups Locais
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Exporte para arquivos locais ou baixe cópias de segurança em CSV e JSON.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl transition-all min-h-[40px]"
          >
            <Download size={14} className="text-amber-400" />
            <span>Backup JSON</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all min-h-[40px]"
          >
            <Download size={14} />
            <span>Planilha CSV</span>
          </button>
        </div>
      </div>

      {/* Grid: Python Streamlit & Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streamlit Community Cloud Card */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="text-amber-400" size={20} />
              <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
                Script Python Streamlit (streamlit_app.py)
              </h2>
            </div>
            <button
              onClick={() => copyToClipboard(pythonStreamlitCode, setCopiedPython)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
            >
              {copiedPython ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedPython ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            O arquivo modular <strong className="text-amber-300">streamlit_app.py</strong> gerado na raiz suporta o leitor nativo do Google Sheets (<code className="text-stone-300">st-gsheets-connection</code>).
          </p>

          <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-300 font-mono">
            <span className="text-stone-500 block mb-1"># Execução local:</span>
            pip install streamlit pandas plotly st-gsheets-connection<br />
            streamlit run streamlit_app.py
          </div>
        </div>

        {/* Secrets snippet */}
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={20} />
              <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
                Configuração Secrets (secrets.toml)
              </h2>
            </div>
            <button
              onClick={() => copyToClipboard(secretsExample, setCopiedSecrets)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
            >
              {copiedSecrets ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedSecrets ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Para o Streamlit Cloud ler a planilha automaticamente:
          </p>
          <div className="relative bg-stone-950 p-3 rounded-xl border border-stone-800 text-[11px] font-mono text-stone-300 overflow-x-auto">
            <pre>{secretsExample}</pre>
          </div>
        </div>
      </div>

      {/* Manual JSON Import Area */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-stone-200">
              Restaurar / Importar Backup JSON Manual
            </h3>
          </div>
          <button
            onClick={() => setShowImportArea(!showImportArea)}
            className="text-xs text-amber-400 hover:underline"
          >
            {showImportArea ? 'Ocultar' : 'Abrir Importador'}
          </button>
        </div>

        {showImportArea && (
          <div className="space-y-3 pt-2">
            <textarea
              rows={4}
              placeholder="Cole aqui o conteúdo JSON do seu arquivo de backup para restaurar..."
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-400"
            />
            {importStatus && (
              <div className="p-2.5 rounded-lg text-xs bg-stone-950 border border-stone-800 text-stone-200">
                {importStatus}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleImportJSON}
                className="px-4 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl transition-colors min-h-[38px]"
              >
                Restaurar Dados a Partir deste JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Database Maintenance and Reset */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-stone-200">
            Reinicialização com Dados Oficiais de Demonstração
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Restaura o histórico oficial padrão com as partidas de exemplo de Inverno e Primavera.
          </p>
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-300">Confirmar restauração?</span>
            <button
              onClick={() => {
                onResetMatches();
                setConfirmReset(false);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              Sim, Restaurar
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-700 rounded-xl transition-colors"
          >
            <RefreshCw size={14} />
            <span>Restaurar Dados Iniciais</span>
          </button>
        )}
      </div>
    </div>
  );
};
