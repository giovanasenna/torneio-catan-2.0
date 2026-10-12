import React from 'react';
import { BookOpen, Scale, Award, Trophy, HelpCircle, Calculator, CheckCircle2, Flame, Users, Clock, Beer, Sparkles, ShieldCheck } from 'lucide-react';

export const GlossaryTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-amber-400" size={22} />
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-amber-100">
              Regulamento Oficial, Fórmulas & Diretrizes
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Manual de regras de pontuação (Opção 3: Eficiência por Cenário), justiça estatística, desempates e fair play.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-950 px-3.5 py-2 rounded-xl border border-stone-800 text-xs text-amber-300">
          <Scale size={16} className="shrink-0" />
          <span>Regulamento 2026 Atualizado</span>
        </div>
      </div>

      {/* SECTION 1: NOVO SISTEMA - EFICIÊNCIA POR CENÁRIO */}
      <div className="bg-stone-900 border border-amber-900/50 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <Calculator className="text-amber-400" size={20} />
          <h2 className="text-base font-bold text-amber-200 uppercase tracking-wide">
            1. Novo Sistema de Pontuação: Eficiência por Cenário (PE)
          </h2>
        </div>

        <div className="text-xs sm:text-sm text-stone-300 space-y-3 leading-relaxed">
          <p>
            Com a introdução dos cenários da expansão <strong>Navegantes</strong>, as partidas deixaram de ter meta única de 10 PV e passaram a exigir entre <strong>10, 12, 13 e 14 Pontos de Vitória (PV)</strong>.
          </p>
          <p>
            Somar diretamente os PVs brutos gerava distorção injusta: um jogador que fizesse 11 PV em um mapa de 14 PV somaria mais do que quem vencesse uma partida clássica de 10 PV no Jogo Base. O <strong>Sistema de Eficiência por Cenário (PE)</strong> equaliza todas as mesas:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-950/80 border border-amber-500/30 p-4 rounded-xl space-y-2.5">
            <span className="text-xs font-bold text-amber-300 uppercase block tracking-wider">
              📐 Fórmula Oficial de PE por Partida
            </span>
            <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 font-mono text-xs sm:text-sm text-amber-200 text-center">
              PE = (PV_jogador / Meta_PV_cenario) × 10 + Bônus de Vitória
            </div>
            <ul className="text-xs text-stone-300 space-y-1.5 pt-1">
              <li>• <strong>Bônus de Vitória Isolada:</strong> <span className="text-amber-400 font-bold">+2.0 PE</span></li>
              <li>• <strong>Bônus de Empate em 1º Lugar:</strong> <span className="text-amber-400 font-bold">+1.0 PE</span> para cada empatado</li>
              <li>• <strong>Teto Máximo do Vencedor:</strong> rigorosamente cravado em <span className="text-amber-300 font-bold">12.0 PE</span> tanto no Jogo Base (10 PV) quanto em Navegantes (14 PV).</li>
            </ul>
          </div>

          <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-xl space-y-2.5">
            <span className="text-xs font-bold text-emerald-400 uppercase block tracking-wider">
              💡 Exemplos Práticos Comparativos
            </span>
            <div className="space-y-2 text-xs text-stone-300">
              <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                <span className="font-semibold text-stone-200 block">Catan Jogo Base (Meta: 10 PV)</span>
                • Vencedor (10 PV): <code className="text-amber-300">(10/10) × 10 + 2.0 = 12.0 PE</code><br />
                • 2º Lugar (9 PV): <code className="text-stone-300">(9/10) × 10 + 0 = 9.0 PE</code>
              </div>
              <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                <span className="font-semibold text-stone-200 block">Navegantes Cenário 1 (Meta: 14 PV)</span>
                • Vencedor (14 PV): <code className="text-amber-300">(14/14) × 10 + 2.0 = 12.0 PE</code><br />
                • 2º Lugar (11 PV): <code className="text-stone-300">(11/14) × 10 + 0 = 7.86 PE</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TRANSPARÊNCIA MATEMÁTICA - INVERNO 2026 */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <ShieldCheck className="text-blue-400" size={20} />
          <h2 className="text-base font-bold text-stone-200 uppercase tracking-wide">
            2. Transparência Matemática: Como o Inverno 2026 Foi Calculado
          </h2>
        </div>

        <div className="text-xs sm:text-sm text-stone-300 space-y-2 leading-relaxed">
          <p>
            O <strong>Winter S1 (Inverno 2026)</strong> teve <strong>15 partidas disputadas no total</strong>, sem registro detalhado de PVs de cada jogo:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
            <div className="bg-stone-950 p-2.5 rounded-lg border border-amber-500/30 text-amber-300">
              Zhang: 6V / 9D
            </div>
            <div className="bg-stone-950 p-2.5 rounded-lg border border-blue-500/30 text-blue-300">
              Rodrigo: 5V / 10D
            </div>
            <div className="bg-stone-950 p-2.5 rounded-lg border border-red-500/30 text-red-300">
              Gina: 2V / 13D
            </div>
            <div className="bg-stone-950 p-2.5 rounded-lg border border-stone-600 text-stone-200">
              Jhonata: 2V / 13D
            </div>
          </div>
        </div>

        <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl space-y-2 text-xs sm:text-sm text-stone-300">
          <strong className="text-amber-300 block">Por que não utilizamos pontuação arbitrária (ex: 10, 6, 2, 2 pontos)?</strong>
          <p className="text-xs text-stone-400 leading-relaxed">
            Se o Inverno concedesse apenas 10 ou 6 pontos fixos, todo o esforço de 15 partidas equivaleria a apenas 1 partida na Primavera (que distribui até 12 PE por vitória). O Inverno seria praticamente irrelevante no placar final do ano.
          </p>
          <p className="text-xs text-stone-400 leading-relaxed">
            Para respeitar o histórico de 15 jogos disputados, aplicamos a <strong>Reconstrução por Valor Esperado</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-mono">
            <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
              🏆 <strong>Vitória no Inverno:</strong> 12.0 PE (teto padrão)
            </div>
            <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
              ⚔️ <strong>Derrota Disputada:</strong> 7.0 PE (média de mesa de 70%)
            </div>
          </div>
        </div>

        {/* Tabela Demonstrativa */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950/70 text-stone-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Colocação</th>
                <th className="py-2.5 px-3">Jogador</th>
                <th className="py-2.5 px-3">Vitórias (12 PE)</th>
                <th className="py-2.5 px-3">Derrotas (7 PE)</th>
                <th className="py-2.5 px-3 font-mono text-amber-300">Pontos Base Inverno 2026</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-200">
              <tr>
                <td className="py-2.5 px-3 font-bold text-amber-400">🥇 1º Lugar</td>
                <td className="py-2.5 px-3 font-semibold">Zhang</td>
                <td className="py-2.5 px-3 font-mono">6 × 12.0 = 72.0 PE</td>
                <td className="py-2.5 px-3 font-mono">9 × 7.0 = 63.0 PE</td>
                <td className="py-2.5 px-3 font-mono font-bold text-amber-400">135.0 PE</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-400">🥈 2º Lugar</td>
                <td className="py-2.5 px-3 font-semibold">Rodrigo</td>
                <td className="py-2.5 px-3 font-mono">5 × 12.0 = 60.0 PE</td>
                <td className="py-2.5 px-3 font-mono">10 × 7.0 = 70.0 PE</td>
                <td className="py-2.5 px-3 font-mono font-bold text-blue-400">130.0 PE</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-red-400">🥉 3º Lugar</td>
                <td className="py-2.5 px-3 font-semibold">Gina (Giovana)</td>
                <td className="py-2.5 px-3 font-mono">2 × 12.0 = 24.0 PE</td>
                <td className="py-2.5 px-3 font-mono">13 × 7.0 = 91.0 PE</td>
                <td className="py-2.5 px-3 font-mono font-bold text-red-400">115.0 PE</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-slate-300">🥉 3º Lugar</td>
                <td className="py-2.5 px-3 font-semibold">Jhonata</td>
                <td className="py-2.5 px-3 font-mono">2 × 12.0 = 24.0 PE</td>
                <td className="py-2.5 px-3 font-mono">13 × 7.0 = 91.0 PE</td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-300">115.0 PE</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <Sparkles size={16} className="shrink-0 text-emerald-400" />
          <span>
            <strong>Circuito Totalmente Aberto:</strong> A diferença entre o 1º colocado (135 PE) e o 3º colocado (115 PE) é de apenas <strong>20 PE</strong>, o que equivale a 3 a 4 partidas de recuperação na Primavera!
          </span>
        </div>
      </div>

      {/* SECTION 3: PRÓXIMAS ESTAÇÕES E 2027+ */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <Trophy className="text-amber-400" size={18} />
          <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
            3. Como Funciona nas Próximas Estações e em 2027+
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-300">
          <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <strong className="text-amber-400 block text-sm">🌱 Primavera, Verão e Outono 2026</strong>
            <p className="text-stone-400 leading-relaxed">
              A partir da Primavera 2026, cada ponto conquistado em mesa vai direto para a fórmula oficial:
            </p>
            <div className="bg-stone-900 p-2 rounded font-mono text-[11px] text-stone-200">
              Pontos_Anuais = Base_Inverno (2026) + PE_Primavera + PE_Verão + PE_Outono
            </div>
          </div>

          <div className="bg-stone-950/70 p-4 rounded-xl border border-stone-800 space-y-1.5">
            <strong className="text-amber-400 block text-sm">🚀 Temporadas Futuras (2027+)</strong>
            <p className="text-stone-400 leading-relaxed">
              A partir de 2027, o ano inteiro será apurado partida a partida desde o primeiro dia do Inverno, somando 100% dos PEs disputados sem necessidade de pontuação base de transição.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: FAIR PLAY, TEMPO E PREMIAÇÕES */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <Award className="text-amber-400" size={18} />
          <h2 className="text-sm font-bold text-stone-200 uppercase tracking-wide">
            4. Diretrizes de Fair Play, Tempo de Turno & Premiações
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-950/80 p-4 rounded-xl border border-stone-800 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
              <Clock size={16} />
              <span>Conduta de Mesa e Tempo</span>
            </div>
            <ul className="text-xs text-stone-300 space-y-2">
              <li>
                ⏱️ <strong>Tempo Sugerido por Turno:</strong> Até <strong>3 minutos por turno</strong> para manter o ritmo e dinamismo de jogo.
              </li>
              <li>
                🚫 <strong>Proibição de Espiar Cartas:</strong> É estritamente proibido espiar a mão de recursos ou desenvolvimento dos adversários.
              </li>
              <li>
                🤝 <strong>Kingmaking Proibido:</strong> Trocas assimétricas de benefício unilateral ou doações propositais para coroar um vencedor acarretam penalidade de mesa <em>(ex: rebaixamento sumário de cidade para aldeia)</em>.
              </li>
            </ul>
          </div>

          <div className="bg-stone-950/80 p-4 rounded-xl border border-stone-800 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
              <Beer size={16} />
              <span>Premiações Oficiais</span>
            </div>
            <ul className="text-xs text-stone-300 space-y-2">
              <li>
                🍻 <strong>Premiação por Estação (Trimestral):</strong> A comemoração e o consumo do campeão da estação são <strong>100% pagos pelos outros 3 competidores</strong> no tradicional <strong>Bar Salete</strong>.
              </li>
              <li>
                🏆 <strong>Premiação Anual do Circuito:</strong> Troféu Perpétuo de Grande Campeão das 4 Estações de Catan e premiação exclusiva a ser homologada pelo grupo.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
