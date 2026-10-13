import React, { useState } from 'react';
import { X, Copy, Check, Share2, Smartphone, ExternalLink, QrCode, MessageCircle, HelpCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'link' | 'install' | 'streamlit'>('link');

  if (!isOpen) return null;

  // Real App URL from environment or current window origin
  const appUrl = typeof window !== 'undefined' && window.location.origin.includes('run.app')
    ? window.location.origin
    : 'https://ais-pre-x25wkfabeocer5zp5ul5it-455020153824.us-east1.run.app';

  const shareText = `🎲 Torneio das 4 Estações de Catan - Confira o ranking oficial da edição Primavera e cadastre novas partidas pelo link: ${appUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Torneio das 4 Estações de Catan',
        text: 'Acesse o placar e registre partidas do nosso circuito anual de Catan!',
        url: appUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  // QR Code SVG generator using Google Chart API or standard QR service for crisp display
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}&bgcolor=1c1917&color=f59e0b&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Share2 className="text-amber-400" size={20} />
            <h2 className="text-base sm:text-lg font-bold font-serif text-amber-100">
              Compartilhar & Acessar no Celular
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-3 border-b border-stone-800 bg-stone-950/50 text-xs text-center font-medium">
          <button
            onClick={() => setActiveSubTab('link')}
            className={`py-3 transition-colors ${
              activeSubTab === 'link'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold bg-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Link & QR Code
          </button>
          <button
            onClick={() => setActiveSubTab('install')}
            className={`py-3 transition-colors ${
              activeSubTab === 'install'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold bg-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            App no Celular
          </button>
          <button
            onClick={() => setActiveSubTab('streamlit')}
            className={`py-3 transition-colors ${
              activeSubTab === 'streamlit'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold bg-stone-900'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Publicar no Streamlit
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {activeSubTab === 'link' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-xl text-xs text-emerald-200 flex items-start gap-2">
                <span className="font-bold text-emerald-400 text-sm">✓</span>
                <div>
                  <strong>Seu app já está online e publicado!</strong> Qualquer pessoa com o link pode abrir no celular, ver o placar e cadastrar partidas. As partidas são salvas de forma colaborativa para todos.
                </div>
              </div>

              {/* QR Code and Scan info */}
              <div className="flex flex-col items-center justify-center p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
                <div className="w-44 h-44 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center bg-stone-900 shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code do Torneio Catan"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-stone-200 block">
                    Escaneie com a câmera do celular
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Ideal para abrir na mesa de jogo durante a partida
                  </span>
                </div>
              </div>

              {/* Link Input & Copy */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                  Link Direto da Aplicação
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs font-mono text-stone-200 focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold transition-colors min-h-[44px] shrink-0"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Native Share */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors min-h-[44px]"
                >
                  <MessageCircle size={16} />
                  <span>Enviar no WhatsApp</span>
                </a>

                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
                >
                  <Share2 size={16} />
                  <span>Compartilhar Nativo</span>
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'install' && (
            <div className="space-y-4 text-xs text-stone-300 leading-relaxed">
              <div className="flex items-center gap-2 text-stone-100 font-semibold text-sm">
                <Smartphone size={18} className="text-amber-400" />
                <span>Como transformar em aplicativo no celular (PWA / Ícone na tela)</span>
              </div>
              <p>
                Qualquer jogador pode salvar o link diretamente na tela inicial do celular. Ele funcionará com visual de aplicativo nativo, sem barra de navegação do navegador:
              </p>

              {/* iPhone iOS Steps */}
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🍎 No iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-stone-400">
                  <li>Abra o link do torneio no <strong>Safari</strong>.</li>
                  <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</li>
                  <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                </ol>
              </div>

              {/* Android Steps */}
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🤖 No Android (Google Chrome / Samsung):</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-stone-400">
                  <li>Abra o link do torneio no <strong>Chrome</strong>.</li>
                  <li>Toque no menu de <strong>três pontos (⋮)</strong> no canto superior direito.</li>
                  <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>Confirme o nome do aplicativo e toque em <strong>Instalar</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeSubTab === 'streamlit' && (
            <div className="space-y-4 text-xs text-stone-300 leading-relaxed">
              <div className="flex items-center gap-2 text-stone-100 font-semibold text-sm">
                <ExternalLink size={18} className="text-amber-400" />
                <span>Como hospedar no Streamlit Community Cloud (100% Gratuito)</span>
              </div>
              <p>
                Caso você queira rodar a versão em Python do arquivo <code className="text-amber-300">streamlit_app.py</code> que geramos:
              </p>

              <ol className="list-decimal pl-4 space-y-2 text-stone-400">
                <li>
                  <strong className="text-stone-200">Criar repositório no GitHub:</strong>
                  <br />Crie um repositório (ex: <code className="text-stone-300">torneio-catan</code>) e inclua os arquivos <code className="text-amber-300">streamlit_app.py</code>, <code className="text-amber-300">requirements.txt</code> e <code className="text-amber-300">catan_torneio_dados.csv</code>.
                </li>
                <li>
                  <strong className="text-stone-200">Acessar o Streamlit Community Cloud:</strong>
                  <br />Acesse <a href="https://share.streamlit.io" target="_blank" rel="noreferrer" className="text-amber-400 underline">share.streamlit.io</a> e faça login com sua conta do GitHub.
                </li>
                <li>
                  <strong className="text-stone-200">Criar novo App:</strong>
                  <br />Clique em <em>"New app"</em>, selecione seu repositório, defina o arquivo principal como <code className="text-stone-300">streamlit_app.py</code> e clique em <em>Deploy</em>.
                </li>
                <li>
                  <strong className="text-stone-200">Sincronização com Google Sheets (Opcional):</strong>
                  <br />Em <em>Settings &gt; Secrets</em>, cole suas credenciais de Service Account para leitura e escrita automática na planilha Google.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors min-h-[40px]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
