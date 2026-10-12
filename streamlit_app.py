"""
Torneio das 4 Estações de Catan - Aplicação Streamlit
======================================================
Aplicação completa em Python utilizando Streamlit, Pandas e Plotly
para gerenciamento do Torneio das 4 Estações de Catan.

Suporta:
- Salvamento e carregamento via CSV local ('catan_torneio_dados.csv')
- Conexão nativa e colaborativa com Google Sheets via st.connection('gsheets', type=GSheetsConnection)
- Registro completo de partidas a partir da Primavera
- Histórico fechado Winter S1: Zhang (1º - 6V), Rodrigo (2º - 5V), Giovana (3º - 2V), Jhonata (3º - 2V)
- Aba de Regras, Siglas e Critérios de Desempate
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import date
import os

# -----------------------------------------------------------------------------
# CONFIGURAÇÃO DA PÁGINA
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Torneio das 4 Estações de Catan",
    page_icon="🎲",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# CONSTANTES E REGRAS DO TORNEIO
# -----------------------------------------------------------------------------
ESTACOES = ["Inverno", "Primavera", "Verão", "Outono"]
ESTACAO_PADRAO = "Primavera"

JOGADORES_OFICIAIS = {
    "Zhang": {"cor_nome": "Amarelo", "cor_hex": "#EAB308", "texto": "#000000"},
    "Rodrigo": {"cor_nome": "Azul", "cor_hex": "#2563EB", "texto": "#FFFFFF"},
    "Giovana": {"cor_nome": "Vermelho", "cor_hex": "#DC2626", "texto": "#FFFFFF"},
    "Jhonata": {"cor_nome": "Branco", "cor_hex": "#F8FAFC", "texto": "#000000"}
}

CENARIOS_CATAN = {
    "Catan Jogo Base": {"categoria": "Base", "meta_pv": 10},
    "Cenário 1: Rumo a Novas Margens": {"categoria": "Navegantes", "meta_pv": 14},
    "Cenário 2: As Quatro Ilhas": {"categoria": "Navegantes", "meta_pv": 13},
    "Cenário 3: Oceania": {"categoria": "Navegantes", "meta_pv": 12},
    "Cenário 4: Através do Deserto": {"categoria": "Navegantes", "meta_pv": 14},
    "Cenário 5: O Povo Perdido": {"categoria": "Navegantes", "meta_pv": 13},
    "Cenário 6: Mercadorias para Catan": {"categoria": "Navegantes", "meta_pv": 14},
    "Cenário 7: As Ilhas dos Piratas": {"categoria": "Navegantes", "meta_pv": 10},
    "Cenário 8: As Maravilhas de Catan": {"categoria": "Navegantes", "meta_pv": 10},
    "Cenário 9: Um Novo Mundo": {"categoria": "Navegantes", "meta_pv": 12},
    "Personalizado": {"categoria": "Custom", "meta_pv": 10}
}

# Pontuação e Configurações de Eficiência
PONTOS_ANUAIS = {1: 10, 2: 6, 3: 3, 4: 1}
ARQUIVO_CSV_LOCAL = "catan_torneio_dados.csv"

# Pontos Base Oficiais de 2026 - Reconstrução Histórica por Valor Esperado (12 PE vitória + 7 PE derrota)
PONTOS_BASE_INVERNO_2026 = {
    "Zhang": 135.0,    # (6 * 12.0) + (9 * 7.0)
    "Rodrigo": 130.0,  # (5 * 12.0) + (10 * 7.0)
    "Gina": 115.0,     # (2 * 12.0) + (13 * 7.0)
    "Giovana": 115.0,  # Alias para compatibilidade
    "Jhonata": 115.0   # (2 * 12.0) + (13 * 7.0)
}

# -----------------------------------------------------------------------------
# FÓRMULAS OFICIAIS DE PONTUAÇÃO (OPÇÃO 3: EFICIÊNCIA POR CENÁRIO)
# -----------------------------------------------------------------------------
def calcular_pe_partida(pv_jogador: float, meta_pv_cenario: float, is_vencedor: bool, empate_vitoria: bool = False) -> float:
    """
    Calcula os Pontos de Eficiência (PE) de um jogador em uma partida.
    Opção 3: Eficiência por Cenário.
    - PE = (PV_jogador / Meta_PV_cenario) * 10 + Bônus de Vitória
    - Vitória isolada: +2.0 PE (teto cravado em 12.0 PE)
    - Empate em 1º lugar: bônus dividido (+1.0 PE para cada)
    """
    if meta_pv_cenario <= 0:
        return 0.0

    bonus = 1.0 if (is_vencedor and empate_vitoria) else (2.0 if is_vencedor else 0.0)
    pe = (pv_jogador / meta_pv_cenario) * 10.0 + bonus

    # Teto oficial de pontuação: 12.0 PE para o vencedor isolado
    if is_vencedor and not empate_vitoria:
        pe = min(12.0, pe)

    return round(pe, 2)

# -----------------------------------------------------------------------------
# CARREGAMENTO E PERSISTÊNCIA DE DADOS
# -----------------------------------------------------------------------------
def get_initial_dataframe():
    """Retorna os dados oficiais do Winter S1 (Zhang 6V, Rodrigo 5V, Giovana 2V, Jhonata 2V)."""
    winter_matches = [
        ("W01", "2026-07-05", "Catan Jogo Base", 10, "Zhang", [("Zhang", 10, True), ("Rodrigo", 8, False), ("Giovana", 7, False), ("Jhonata", 7, False)]),
        ("W02", "2026-07-10", "Catan Jogo Base", 10, "Rodrigo", [("Rodrigo", 10, True), ("Zhang", 8, False), ("Giovana", 7, False), ("Jhonata", 7, False)]),
        ("W03", "2026-07-15", "Cenário 1: Rumo a Novas Margens", 14, "Zhang", [("Zhang", 14, True), ("Rodrigo", 11, False), ("Giovana", 9, False), ("Jhonata", 9, False)]),
        ("W04", "2026-07-20", "Cenário 2: As Quatro Ilhas", 13, "Rodrigo", [("Rodrigo", 13, True), ("Zhang", 10, False), ("Giovana", 8, False), ("Jhonata", 8, False)]),
        ("W05", "2026-07-25", "Catan Jogo Base", 10, "Giovana", [("Giovana", 10, True), ("Rodrigo", 8, False), ("Zhang", 8, False), ("Jhonata", 7, False)]),
        ("W06", "2026-07-30", "Cenário 3: Oceania", 12, "Zhang", [("Zhang", 12, True), ("Rodrigo", 10, False), ("Jhonata", 8, False), ("Giovana", 8, False)]),
        ("W07", "2026-08-04", "Cenário 4: Através do Deserto", 14, "Rodrigo", [("Rodrigo", 14, True), ("Zhang", 11, False), ("Giovana", 9, False), ("Jhonata", 9, False)]),
        ("W08", "2026-08-09", "Catan Jogo Base", 10, "Jhonata", [("Jhonata", 10, True), ("Rodrigo", 8, False), ("Zhang", 8, False), ("Giovana", 7, False)]),
        ("W09", "2026-08-14", "Catan Jogo Base", 10, "Zhang", [("Zhang", 10, True), ("Rodrigo", 8, False), ("Giovana", 7, False), ("Jhonata", 7, False)]),
        ("W10", "2026-08-19", "Cenário 5: O Povo Perdido", 13, "Rodrigo", [("Rodrigo", 13, True), ("Zhang", 10, False), ("Jhonata", 8, False), ("Giovana", 8, False)]),
        ("W11", "2026-08-24", "Cenário 3: Oceania", 12, "Giovana", [("Giovana", 12, True), ("Zhang", 9, False), ("Rodrigo", 9, False), ("Jhonata", 8, False)]),
        ("W12", "2026-08-29", "Cenário 6: Mercadorias para Catan", 14, "Zhang", [("Zhang", 14, True), ("Rodrigo", 11, False), ("Jhonata", 9, False), ("Giovana", 9, False)]),
        ("W13", "2026-09-02", "Catan Jogo Base", 10, "Jhonata", [("Jhonata", 10, True), ("Zhang", 8, False), ("Rodrigo", 8, False), ("Giovana", 7, False)]),
        ("W14", "2026-09-07", "Catan Jogo Base", 10, "Rodrigo", [("Rodrigo", 10, True), ("Zhang", 8, False), ("Giovana", 7, False), ("Jhonata", 7, False)]),
        ("W15", "2026-09-12", "Catan Jogo Base", 10, "Zhang", [("Zhang", 10, True), ("Rodrigo", 8, False), ("Giovana", 7, False), ("Jhonata", 7, False)]),
    ]

    rows = []
    for m_id, dt, scen, meta, winner, players in winter_matches:
        tot_pv = sum(p[1] for p in players)
        for p_name, pv, is_win in players:
            # No Inverno, vitória = 12.0 PE e derrota competitiva = 7.0 PE
            pe = 12.0 if is_win else 7.0
            rows.append({
                "Partida_ID": m_id,
                "Data": dt,
                "Estacao": "Inverno",
                "Cenario": scen,
                "Meta_PV": meta,
                "Expansao_5_6": False,
                "Vencedor": winner,
                "Jogador": p_name,
                "Oficial": True,
                "PV": pv,
                "PV_Normalizado": round(pv / meta, 3),
                "VP_Percent_Balanceado": round((pv / tot_pv) * 100, 2),
                "PE": pe,
                "Venceu": is_win,
                "Notas": "Winter S1 - Consolidado"
            })
    return pd.DataFrame(rows)

def load_data():
    """Carrega dados via Google Sheets ou CSV local."""
    if "gsheets" in st.secrets:
        try:
            from streamlit_gsheets import GSheetsConnection
            conn = st.connection("gsheets", type=GSheetsConnection)
            df = conn.read(ttl="5m")
            if df is not None and not df.empty:
                return df
        except Exception:
            pass

    if os.path.exists(ARQUIVO_CSV_LOCAL):
        try:
            return pd.read_csv(ARQUIVO_CSV_LOCAL)
        except Exception:
            pass

    df = get_initial_dataframe()
    df.to_csv(ARQUIVO_CSV_LOCAL, index=False)
    return df

def save_data(df):
    """Persiste dados no arquivo local e no Google Sheets (se configurado)."""
    df.to_csv(ARQUIVO_CSV_LOCAL, index=False)
    if "gsheets" in st.secrets:
        try:
            from streamlit_gsheets import GSheetsConnection
            conn = st.connection("gsheets", type=GSheetsConnection)
            conn.update(data=df)
        except Exception:
            pass

# -----------------------------------------------------------------------------
# CÁLCULOS ESTATÍSTICOS
# -----------------------------------------------------------------------------
def calculate_leaderboard(df, estacao="Primavera", apenas_oficiais=True):
    if df.empty:
        return pd.DataFrame()

    sub = df[df["Estacao"] == estacao] if estacao != "Geral" else df
    if apenas_oficiais:
        sub = sub[sub["Oficial"] == True]

    if sub.empty:
        return pd.DataFrame()

    # Garante coluna PE se não existir
    if "PE" not in sub.columns:
        sub = sub.copy()
        sub["PE"] = sub.apply(
            lambda r: calcular_pe_partida(r.get("PV", 0), r.get("Meta_PV", 10), r.get("Venceu", False)),
            axis=1
        )

    grouped = sub.groupby("Jogador").agg(
        Partidas=("Partida_ID", "nunique"),
        Vitorias=("Venceu", lambda x: int(x.sum())),
        PE_Total=("PE", lambda x: round(x.sum(), 2)),
        PE_Medio=("PE", lambda x: round(x.mean(), 2)),
        PV_Total=("PV", "sum"),
        PV_Medio=("PV", lambda x: round(x.mean(), 2)),
        Media_VP_Balanceado=("VP_Percent_Balanceado", lambda x: round(x.mean(), 2)),
        Maior_PV=("PV", "max")
    ).reset_index()

    grouped["Taxa_Vitoria_Pct"] = round((grouped["Vitorias"] / grouped["Partidas"]) * 100, 1)

    grouped = grouped.sort_values(
        by=["PE_Total", "Vitorias", "PV_Total", "Media_VP_Balanceado"],
        ascending=[False, False, False, False]
    ).reset_index(drop=True)

    grouped.index = grouped.index + 1
    grouped.index.name = "Posição"
    return grouped

def calculate_annual_circuit(df, ano_temporada: int = 2026):
    """
    Calcula o Ranking Anual do Torneio das 4 Estações.
    - Temporada 2026: Reconstrução histórica do Inverno (135/130/115/115 PE) + PE das partidas de Primavera, Verão e Outono.
    - Temporadas 2027+: 100% soma de todas as partidas de todas as estações (sem pontos base).
    """
    jogadores_anual = ["Zhang", "Rodrigo", "Giovana", "Jhonata"]
    dados_jogadores = {
        j: {"Inverno": 0.0, "Primavera": 0.0, "Verão": 0.0, "Outono": 0.0, "Partidas": 0}
        for j in jogadores_anual
    }

    if ano_temporada == 2026:
        # Reconstrução histórica do Inverno 2026 (15 partidas: 12 PE por vitória + 7 PE por derrota)
        for j in jogadores_anual:
            pts_inverno = PONTOS_BASE_INVERNO_2026.get(j, PONTOS_BASE_INVERNO_2026.get("Gina" if j == "Giovana" else j, 0.0))
            dados_jogadores[j]["Inverno"] = pts_inverno
            dados_jogadores[j]["Partidas"] = 15
        estacoes_dinamicas = ["Primavera", "Verão", "Outono"]
    else:
        # 2027+: apuração 100% partida a partida de todas as estações
        estacoes_dinamicas = ["Inverno", "Primavera", "Verão", "Outono"]

    if not df.empty:
        df_calc = df.copy()
        if "PE" not in df_calc.columns:
            df_calc["PE"] = df_calc.apply(
                lambda r: calcular_pe_partida(r.get("PV", 0), r.get("Meta_PV", 10), r.get("Venceu", False)),
                axis=1
            )

        for est in estacoes_dinamicas:
            sub = df_calc[(df_calc["Estacao"] == est) & (df_calc["Oficial"] == True)]
            if not sub.empty:
                for j in jogadores_anual:
                    nomes_match = [j]
                    if j == "Giovana":
                        nomes_match.append("Gina")
                    sub_j = sub[sub["Jogador"].isin(nomes_match)]
                    if not sub_j.empty:
                        pe_soma = float(sub_j["PE"].sum())
                        pj_soma = int(sub_j["Partida_ID"].nunique())
                        dados_jogadores[j][est] = round(pe_soma, 2)
                        dados_jogadores[j]["Partidas"] += pj_soma

    rows = []
    col_inverno_label = "Inverno (Base)" if ano_temporada == 2026 else "Inverno"
    for j in jogadores_anual:
        d = dados_jogadores[j]
        total_pe = round(d["Inverno"] + d["Primavera"] + d["Verão"] + d["Outono"], 2)
        pj = d["Partidas"]
        media_pe = round(total_pe / pj, 2) if pj > 0 else 0.0

        rows.append({
            "Jogador": j,
            "Cor": JOGADORES_OFICIAIS.get(j, {}).get("cor_nome", ""),
            col_inverno_label: d["Inverno"],
            "Primavera": d["Primavera"],
            "Verão": d["Verão"],
            "Outono": d["Outono"],
            "Partidas": pj,
            "Média PE/Jogo": media_pe,
            "Pontos_Anuais": total_pe
        })

    an_df = pd.DataFrame(rows).sort_values(by="Pontos_Anuais", ascending=False).reset_index(drop=True)
    an_df.index = an_df.index + 1
    an_df.index.name = "Posição"
    return an_df

# -----------------------------------------------------------------------------
# INTERFACE PRINCIPAL
# -----------------------------------------------------------------------------
df = load_data()

# Seletor de Tema no Sidebar do Streamlit
st.sidebar.title("🎲 Menu & Configurações")
st.sidebar.markdown("**Torneio 4 Estações de Catan**")
tema_visual = st.sidebar.radio(
    "🎨 Modo de Exibição:",
    ["🌙 Modo Escuro (Taberna)", "☀️ Modo Claro (Pergaminho)"],
    index=0
)

if "Modo Claro" in tema_visual:
    st.markdown("""
        <style>
        .stApp {
            background-color: #F8F6F0;
            color: #1C1917;
        }
        [data-testid="stSidebar"] {
            background-color: #F1EDE3;
        }
        .stMarkdown, p, span, label, [data-testid="stWidgetLabel"] {
            color: #1C1917 !important;
        }
        h1, h2, h3, h4 {
            color: #78350F !important;
        }
        .stTabs [data-baseweb="tab"] {
            color: #44403C !important;
        }
        .stTabs [aria-selected="true"] {
            color: #B45309 !important;
            border-bottom-color: #B45309 !important;
        }
        </style>
    """, unsafe_allow_html=True)

st.title("🎲 Torneio das 4 Estações de Catan")
st.markdown("Circuito Anual 2026 • **Edição Atual: Primavera** • Winter S1 Encerrado")

tab_leaderboard, tab_registro, tab_anual, tab_regras, tab_graficos, tab_historico = st.tabs([
    "🏆 Classificação",
    "📝 Registrar Partida (Primavera+)",
    "🌍 Ranking Anual",
    "📖 Regras & Siglas",
    "📈 Gráficos & Estatísticas",
    "📜 Histórico Completo"
])

# ABA 1: CLASSIFICAÇÃO
with tab_leaderboard:
    col_est, col_filter = st.columns([2, 1])
    with col_est:
        estacao_selecionada = st.selectbox("Selecione a Estação:", ESTACOES + ["Geral"], index=1)
    with col_filter:
        incluir_convidados = st.checkbox("Incluir Visitantes no Placar", value=False)

    lb = calculate_leaderboard(df, estacao=estacao_selecionada, apenas_oficiais=not incluir_convidados)

    if not lb.empty:
        top_cols = st.columns(min(len(lb), 3))
        for idx, col in enumerate(top_cols):
            if idx < len(lb):
                player_row = lb.iloc[idx]
                medal = "🥇" if idx == 0 else ("🥈" if idx == 1 else "🥉")
                with col:
                    st.metric(
                        label=f"{medal} {idx+1}º Lugar • {player_row['Jogador']}",
                        value=f"{int(player_row['Vitorias'])} Vitórias",
                        delta=f"{int(player_row['PV_Total'])} PV Totais"
                    )

        st.dataframe(
            lb.style.format({
                "Taxa_Vitoria_Pct": "{:.1f}%",
                "Media_VP_Balanceado": "{:.2f}%",
                "PV_Medio": "{:.2f}"
            }),
            use_container_width=True
        )
    else:
        st.info("Nenhuma partida registrada na Primavera ainda. Vá para a aba 'Registrar Partida' para cadastrar a primeira!")

# ABA 2: REGISTRO DE PARTIDA
with tab_registro:
    st.subheader("Registrar Nova Partida (Edição Primavera)")
    with st.form("form_partida", clear_on_submit=True):
        c1, c2, c3 = st.columns(3)
        with c1:
            data_partida = st.date_input("Data da Partida", value=date.today())
        with c2:
            estacao_partida = st.selectbox("Estação do Torneio", ["Primavera", "Verão", "Outono"], index=0)
        with c3:
            cenario_nome = st.selectbox("Modo de Jogo / Cenário", list(CENARIOS_CATAN.keys()), index=0)

        meta_padrao = CENARIOS_CATAN[cenario_nome]["meta_pv"]
        c4, c5 = st.columns(2)
        with c4:
            meta_pv = st.number_input("Meta de PV do Cenário", min_value=8, max_value=25, value=meta_padrao)
        with c5:
            expansao_5_6 = st.checkbox("Mesa com Expansão 5-6 Jogadores", value=False)

        c_f1, c_f2 = st.columns(2)
        with c_f1:
            foto_tabuleiro_inicial = st.file_uploader("🌱 Foto do Tabuleiro Inicial (Setup, Opcional):", type=["png", "jpg", "jpeg"], key="foto_init")
            if foto_tabuleiro_inicial is not None:
                st.image(foto_tabuleiro_inicial, caption="Setup Inicial do Tabuleiro", use_column_width=True)
                st.success("✅ Foto do setup inicial carregada!")
        with c_f2:
            foto_tabuleiro = st.file_uploader("📸 Foto do Tabuleiro Final (Fim de Jogo, Opcional):", type=["png", "jpg", "jpeg"], key="foto_final")
            if foto_tabuleiro is not None:
                st.image(foto_tabuleiro, caption="Fim de Jogo / Pontuação", use_column_width=True)
                st.info("💡 Foto anexada! Revise e ajuste os pontos de cada jogador abaixo antes de salvar.")

        st.markdown("---")
        st.markdown("**Selecione os Jogadores Presentes (3 a 6 participantes):**")

        jogadores_selecionados = []
        chk_cols = st.columns(4)
        for i, (nome, info) in enumerate(JOGADORES_OFICIAIS.items()):
            with chk_cols[i]:
                if st.checkbox(f"{nome} ({info['cor_nome']})", value=True, key=f"chk_{nome}"):
                    jogadores_selecionados.append({"nome": nome, "oficial": True})

        novos_visitantes = st.text_input("Nomes de Visitantes (separados por vírgula):")
        if novos_visitantes.strip():
            for v in novos_visitantes.split(","):
                v_clean = v.strip()
                if v_clean:
                    jogadores_selecionados.append({"nome": f"{v_clean} (Visitante)", "oficial": False})

        st.markdown("---")
        st.markdown("**Pontos de Vitória (PV) Obtidos:**")

        pontuacoes = {}
        if len(jogadores_selecionados) >= 2:
            pv_cols = st.columns(len(jogadores_selecionados))
            for i, jog in enumerate(jogadores_selecionados):
                with pv_cols[i]:
                    pontuacoes[jog["nome"]] = st.number_input(
                        f"PV {jog['nome']}",
                        min_value=0,
                        max_value=30,
                        value=8 if jog["oficial"] else 6,
                        key=f"pv_{jog['nome']}"
                    )

        notas_obs = st.text_area("Observações da Partida:")
        submitted = st.form_submit_button("💾 Salvar Partida no Torneio", use_container_width=True)

        if submitted:
            num_jogs = len(jogadores_selecionados)
            if num_jogs < 3 or num_jogs > 6:
                st.error("A partida deve conter entre 3 e 6 jogadores.")
            else:
                total_mesa_pv = sum(pontuacoes.values())
                max_pv = max(pontuacoes.values())
                vencedores = [j for j, p in pontuacoes.items() if p == max_pv]
                empate_vitoria = len(vencedores) > 1
                vencedor = ", ".join(vencedores) if empate_vitoria else vencedores[0]

                novo_id = f"P{len(df[df['Estacao'] == estacao_partida]['Partida_ID'].unique()) + 1:02d}"
                novas_linhas = []

                for jog in jogadores_selecionados:
                    j_nome = jog["nome"]
                    pv = pontuacoes[j_nome]
                    pv_norm = round(pv / meta_pv, 3)
                    vp_balanceado = round((pv / total_mesa_pv) * (num_jogs / 4) * 100, 2) if total_mesa_pv > 0 else 0
                    venceu = (pv == max_pv)
                    pe = calcular_pe_partida(pv, meta_pv, venceu, empate_vitoria)

                    novas_linhas.append({
                        "Partida_ID": novo_id,
                        "Data": str(data_partida),
                        "Estacao": estacao_partida,
                        "Cenario": cenario_nome,
                        "Meta_PV": int(meta_pv),
                        "Expansao_5_6": expansao_5_6,
                        "Vencedor": vencedor,
                        "Jogador": j_nome,
                        "Oficial": jog["oficial"],
                        "PV": int(pv),
                        "PV_Normalizado": pv_norm,
                        "VP_Percent_Balanceado": vp_balanceado,
                        "PE": pe,
                        "Venceu": venceu,
                        "Notas": notas_obs
                    })

                df = pd.concat([df, pd.DataFrame(novas_linhas)], ignore_index=True)
                save_data(df)
                st.success(f"Partida {novo_id} registrada com sucesso! Vencedor: {vencedor}")
                st.rerun()

# -----------------------------------------------------------------------------
# FUNÇÃO DA ABA DE REGRAS COMPLETA (REGULAMENTO OFICIAL ATUALIZADO)
# -----------------------------------------------------------------------------
def render_aba_regras():
    st.subheader("📖 Regulamento Oficial: Eficiência por Cenário & Diretrizes")

    st.info("✨ **Atualização de Regulamento (Opção 3 - Eficiência por Cenário):** Sistema calibrado para equalizar partidas do Jogo Base (10 PV) e cenários com expansão Navegantes (12 a 14 PV), garantindo justiça matemática absoluta no Torneio das 4 Estações.")

    # 1. APRESENTAÇÃO DO NOVO SISTEMA
    st.markdown("### 1. Novo Sistema de Pontuação: Eficiência por Cenário (PE)")
    st.markdown("""
    Com a inclusão dos cenários da expansão **Navegantes**, as partidas passaram a ter metas variadas entre **10, 12, 13 e 14 Pontos de Vitória (PV)**.
    
    Somar apenas os PVs brutos gerava distorção competitiva: um jogador que fizesse 11 PV em um mapa longo de 14 PV somaria mais que o vencedor de 10 PV no Jogo Base, o que prejudicava quem vencia jogos menores. A **Opção 3 (Eficiência por Cenário)** resolve isso tornando cada partida equivalente em peso.
    """)

    c_f1, c_f2 = st.columns(2)
    with c_f1:
        st.markdown("""
        #### 📐 Fórmula Oficial de PE por Partida
        $$PE = \\left(\\frac{PV_{\\text{jogador}}}{Meta\\_PV_{\\text{cenario}}}\\right) \\times 10 + \\text{Bônus de Vitória}$$
        - **Bônus de Vitória Isolada:** **+2.0 PE**
        - **Bônus de Empate em 1º Lugar:** **+1.0 PE** para cada jogador empatado
        - **Teto Máximo do Vencedor:** cravado rigorosamente em **12.0 PE** tanto no Jogo Base (10 PV) quanto em Navegantes (12 a 14 PV).
        """)
    with c_f2:
        st.markdown("""
        #### 💡 Exemplos Comparativos Práticos
        - **Jogo Base (Meta: 10 PV):**
          - Vencedor com 10 PV: $(10/10) \\times 10 + 2.0 =$ **12.0 PE**
          - 2º Lugar com 9 PV: $(9/10) \\times 10 + 0 =$ **9.0 PE**
        - **Navegantes Cenário 1 (Meta: 14 PV):**
          - Vencedor com 14 PV: $(14/14) \\times 10 + 2.0 =$ **12.0 PE**
          - 2º Lugar com 11 PV: $(11/14) \\times 10 + 0 =$ **7.86 PE**
        """)

    st.markdown("---")

    # 2. TRANSPARÊNCIA MATEMÁTICA: INVERNO 2026
    st.markdown("### 2. Transparência Matemática: Como o Inverno 2026 Foi Calculado")
    st.markdown("""
    A temporada inaugural (**Winter S1 / Inverno 2026**) contou com **15 partidas disputadas**, das quais possuímos o registro oficial consolidado do número de vitórias e derrotas:
    - 🥇 **Zhang:** 6 Vitórias / 9 Derrotas
    - 🥈 **Rodrigo:** 5 Vitórias / 10 Derrotas
    - 🥉 **Gina (Giovana):** 2 Vitórias / 13 Derrotas
    - 🥉 **Jhonata:** 2 Vitórias / 13 Derrotas
    """)

    st.markdown("""
    > **Por que não utilizamos pontuação arbitrária de tabela fixa (ex: 10, 6, 2, 2 pontos)?**  
    > Se atribuíssemos apenas 10 ou 6 pontos para o Inverno, todo o peso de 15 partidas equivaleria a apenas uma partida da Primavera (que distribui até 12 PE por vitória). O Inverno seria praticamente apagado da história anual.
    
    Para respeitar as 15 partidas jogadas sem penalizar quem correu atrás, aplicamos a **Reconstrução por Valor Esperado**:
    - **Vitória no Inverno:** Teto oficial de **12.0 PE**
    - **Derrota Competitiva:** Média competitiva de mesa disputada de **7.0 PE** (correspondente a 70% de eficiência em disputas acirradas)
    """)

    tabela_inverno = pd.DataFrame([
        {"Posição": "🥇 1º", "Jogador": "Zhang", "Vitórias": "6 (× 12.0 PE)", "Derrotas": "9 (× 7.0 PE)", "Cálculo": "72.0 + 63.0", "Pontos Base Inverno 2026": "135.0 PE"},
        {"Posição": "🥈 2º", "Jogador": "Rodrigo", "Vitórias": "5 (× 12.0 PE)", "Derrotas": "10 (× 7.0 PE)", "Cálculo": "60.0 + 70.0", "Pontos Base Inverno 2026": "130.0 PE"},
        {"Posição": "🥉 3º", "Jogador": "Gina (Giovana)", "Vitórias": "2 (× 12.0 PE)", "Derrotas": "13 (× 7.0 PE)", "Cálculo": "24.0 + 91.0", "Pontos Base Inverno 2026": "115.0 PE"},
        {"Posição": "🥉 3º", "Jogador": "Jhonata", "Vitórias": "2 (× 12.0 PE)", "Derrotas": "13 (× 7.0 PE)", "Cálculo": "24.0 + 91.0", "Pontos Base Inverno 2026": "115.0 PE"}
    ])
    st.table(tabela_inverno)

    st.success("🎯 **Circuito 100% Aberto:** A diferença entre o 1º colocado (135 PE) e os 3º colocados (115 PE) é de apenas **20 PE**. Isso equivale a cerca de **3 a 4 partidas de recuperação** na Primavera, mantendo a disputa pelo título totalmente viva e equilibrada!")

    st.markdown("---")

    # 3. PRÓXIMAS ESTAÇÕES E TEMPORADAS FUTURAS
    st.markdown("### 3. Dinâmica das Próximas Estações e Temporadas Futuras")
    c_e1, c_e2 = st.columns(2)
    with c_e1:
        st.markdown("""
        #### 🌱 Primavera, Verão e Outono 2026
        - Cada partida disputada tem seus PVs reais registrados na mesa.
        - Os PE são gerados **automaticamente pela fórmula de Eficiência por Cenário**.
        - O Ranking Anual 2026 é a soma direta contínua:
          $$\\text{Pontos Anuais} = \\text{Base Inverno (2026)} + \\sum PE_{\\text{Primavera}} + \\sum PE_{\\text{Verão}} + \\sum PE_{\\text{Outono}}$$
        """)
    with c_e2:
        st.markdown("""
        #### 🚀 Temporadas Futuras (2027+)
        - A partir de 2027, o circuito começa no primeiro dia do Inverno com apuração **100% partida a partida**.
        - A flag de temporada remove os pontos base e calcula a soma pura de PE desde o jogo 1 até a última partida do ano.
        """)

    st.markdown("---")

    # 4. FAIR PLAY, TEMPO E PREMIAÇÃO
    st.markdown("### 4. Diretrizes de Mesa, Fair Play & Premiações Oficiais")
    c_p1, c_p2 = st.columns(2)
    with c_p1:
        st.markdown("""
        #### ⚖️ Regras de Convivência e Fair Play
        - ⏱️ **Tempo de Turno Sugerido:** Até **3 minutos por turno** para manter a fluidez da partida.
        - 🚫 **Proibido Espiar Cartas:** Espiar cartas de desenvolvimento ou recursos de adversários é estritamente vedado.
        - 🤝 **Kingmaking Proibido:** Trocas com benefício nulo ou favorecimento intencional de um competidor resultam em penalidade arbitral *(ex: rebaixamento compulsório de uma cidade para aldeia)*.
        """)
    with c_p2:
        st.markdown("""
        #### 🍻 Premiações Oficiais
        - 🍺 **Campeão da Estação (Trimestral):**  
          O vencedor da estação tem sua conta e consumo de comemoração **100% pagos pelos 3 perdedores** no tradicional **Bar Salete**.
        - 🏆 **Grande Campeão Anual:**  
          Troféu Perpétuo das 4 Estações de Catan e premiação de prestígio a ser homologada pela mesa diretora.
        """)

# ABA 3: RANKING ANUAL
with tab_anual:
    c_an1, c_an2 = st.columns([3, 1])
    with c_an1:
        st.subheader("🏆 Ranking do Circuito Anual (4 Estações)")
        st.markdown("Acúmulo de **Pontos de Eficiência (PE)** ao longo de todas as 4 Estações de Catan.")
    with c_an2:
        ano_selecionado = st.selectbox("Temporada:", [2026, 2027], index=0)

    st.markdown("""
    **Ponto de Partida Oficial - Winter S1 (Inverno 2026 por Valor Esperado):**
    - 🥇 **Zhang:** 135.0 PE *(6 Vitórias × 12.0 + 9 Derrotas × 7.0)*
    - 🥈 **Rodrigo:** 130.0 PE *(5 Vitórias × 12.0 + 10 Derrotas × 7.0)*
    - 🥉 **Gina (Giovana):** 115.0 PE *(2 Vitórias × 12.0 + 13 Derrotas × 7.0)*
    - 🥉 **Jhonata:** 115.0 PE *(2 Vitórias × 12.0 + 13 Derrotas × 7.0)*
    """)
    an_df = calculate_annual_circuit(df, ano_temporada=ano_selecionado)
    st.dataframe(
        an_df.style.format({
            "Inverno (Base)" if ano_selecionado == 2026 else "Inverno": "{:.1f}",
            "Primavera": "{:.2f}",
            "Verão": "{:.2f}",
            "Outono": "{:.2f}",
            "Média PE/Jogo": "{:.2f}",
            "Pontos_Anuais": "{:.2f}"
        }),
        use_container_width=True
    )

# ABA 4: REGRAS E SIGLAS
with tab_regras:
    render_aba_regras()

# ABA 5: GRÁFICOS
with tab_graficos:
    st.subheader("Estatísticas do Torneio")
    lb_geral = calculate_leaderboard(df, estacao="Geral", apenas_oficiais=True)
    if not lb_geral.empty:
        fig_bar = px.bar(
            lb_geral,
            x="Jogador",
            y="Taxa_Vitoria_Pct",
            color="Jogador",
            color_discrete_map={k: v["cor_hex"] for k, v in JOGADORES_OFICIAIS.items()},
            labels={"Taxa_Vitoria_Pct": "Taxa de Vitória (%)"}
        )
        st.plotly_chart(fig_bar, use_container_width=True)

# ABA 6: HISTÓRICO
with tab_historico:
    st.subheader("Histórico Completo de Partidas")
    st.dataframe(df, use_container_width=True)
    csv_bytes = df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Baixar Dados em CSV",
        data=csv_bytes,
        file_name="catan_torneio_dados.csv",
        mime="text/csv",
        use_container_width=True
    )
