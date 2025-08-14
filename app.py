import streamlit as st
import pdfplumber
from unidecode import unidecode
import re
import pandas as pd
from collections import Counter

# =========================
# Configuración de la página
# =========================
st.set_page_config(page_title="Análisis de Sustituciones – Beta", page_icon="⚽", layout="wide")
st.title("Análisis de Sustituciones – Beta (Liga MX Femenil)")
st.write("Sube el PDF del Informe Arbitral para procesarlo y analizarlo.")

# =========================
# Utilidades genéricas
# =========================
def parse_minuto(s: str) -> int:
    """Convierte '90+3' -> 93, '45' -> 45. Si no cuadra, devuelve -1."""
    if not s:
        return -1
    s = s.strip()
    if "+" in s:
        try:
            base, extra = s.split("+", 1)
            return int(base) + int(extra)
        except Exception:
            return -1
    try:
        return int(s)
    except Exception:
        return -1

def clean_name(s: str) -> str:
    """Quita saltos de línea y espacios repetidos."""
    if s is None:
        return ""
    s = s.replace("\n", " ")
    return " ".join(s.split()).strip()

def norm(s: str) -> str:
    """Normaliza (minúsculas, sin acentos, espacios compactos)."""
    return re.sub(r"\s+", " ", unidecode(s or "").strip().lower())

# =========================
# Catálogo de equipos (canónico + alias)
# =========================
TEAM_CANONICAL = [
    "america","atlas","atletico san luis","chivas","cruz azul","juarez","leon","mazatlan",
    "necaxa","pachuca","puebla","pumas","queretaro","rayadas","santos","tigres","tijuana","toluca"
]

TEAM_ALIASES = {
    # canónico: aliases que pueden aparecer en PDFs
    "america": ["america", "club america"],
    "atlas": ["atlas", "club atlas"],
    "atletico san luis": ["atletico san luis", "atlético san luis", "san luis"],
    "chivas": ["chivas", "guadalajara", "club guadalajara"],
    "cruz azul": ["cruz azul", "cd cruz azul", "club cruz azul"],
    "juarez": ["juarez", "fc juarez", "bravas"],
    "leon": ["leon", "club leon"],
    "mazatlan": ["mazatlan", "mazatlan fc"],
    "necaxa": ["necaxa", "club necaxa"],
    "pachuca": ["pachuca", "tuzas", "cf pachuca"],
    "puebla": ["puebla", "club puebla", "puebla fc"],
    "pumas": ["pumas", "universidad", "unam", "universidad nacional"],
    "queretaro": ["queretaro", "querétaro", "gallos", "gallos blancos"],
    "rayadas": ["rayadas", "monterrey femenil", "cf monterrey femenil", "monterrey"],
    "santos": ["santos", "santos laguna"],
    "tigres": ["tigres", "tigres uanl", "uanl"],
    "tijuana": ["tijuana", "xolas", "club tijuana"],
    "toluca": ["toluca", "deportivo toluca"],
}

PRETTY = {
    "america": "América","atlas":"Atlas","atletico san luis":"Atlético San Luis","chivas":"Chivas",
    "cruz azul":"Cruz Azul","juarez":"Juárez","leon":"León","mazatlan":"Mazatlán","necaxa":"Necaxa",
    "pachuca":"Pachuca","puebla":"Puebla","pumas":"Pumas","queretaro":"Querétaro","rayadas":"Rayadas",
    "santos":"Santos","tigres":"Tigres","tijuana":"Tijuana","toluca":"Toluca"
}

def canon_to_pretty(canon: str) -> str:
    return PRETTY.get(canon, canon.title())

def alias_to_canon(token: str) -> str | None:
    """Intenta convertir un alias textual al canónico."""
    t = norm(token)
    for canon, aliases in TEAM_ALIASES.items():
        for al in aliases:
            na = norm(al)
            if t == na or na in t or t in na:
                return canon
    return None

def detect_match_teams(full_text: str) -> list[str]:
    """
    Detecta hasta DOS equipos canónicos a partir del texto de TODO el PDF:
    - Patrones tipo 'A vs B', 'A v B', 'A contra B', 'A - B'/'A — B'
    - Barrido por alias en todo el texto (frecuencia)
    """
    if not full_text:
        return []

    txt = unidecode(full_text)
    flat = norm(txt)

    # 1) Patrones explícitos de enfrentamiento
    pat = re.compile(
        r"([A-Za-zÁÉÍÓÚÜÑñ\.\s]+?)\s*(?:vs\.?|v|contra|—|-)\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)",
        re.IGNORECASE
    )
    m = pat.search(txt)
    found = set()
    if m:
        a, b = m.group(1), m.group(2)
        ca, cb = alias_to_canon(a), alias_to_canon(b)
        if ca: found.add(ca)
        if cb: found.add(cb)
        if len(found) == 2:
            return list(found)

    # 2) Campos tipo Local/Visitante
    for pat_local in [r"local\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)", r"equipo\s*local\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)"]:
        ml = re.search(pat_local, txt, flags=re.IGNORECASE)
        if ml:
            ca = alias_to_canon(ml.group(1))
            if ca: found.add(ca)
    for pat_visit in [r"visitante\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)", r"equipo\s*visitante\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)"]:
        mv = re.search(pat_visit, txt, flags=re.IGNORECASE)
        if mv:
            cb = alias_to_canon(mv.group(1))
            if cb: found.add(cb)
    if len(found) == 2:
        return list(found)

    # 3) Barrido por alias en todo el texto (frecuencia) y devuelve los dos más probables
    hits = []
    for canon, aliases in TEAM_ALIASES.items():
        for al in aliases:
            if norm(al) in flat:
                hits.append(canon)
                break

    if hits:
        order = [t for t, _ in Counter(hits).most_common()]
        uniq = []
        for t in order:
            if t not in uniq:
                uniq.append(t)
        return uniq[:2]

    return []

# =========================
# Parámetros en sidebar
# =========================
st.sidebar.header("Parámetros")
ventana_min = st.sidebar.number_input("Ventana post-cambio (min)", min_value=5, max_value=30, value=10, step=1)

# =========================
# 1) Cargador de PDF
# =========================
uploaded_file = st.file_uploader("Subir PDF", type=["pdf"])

if uploaded_file is not None:
    st.success(f"Archivo subido: {uploaded_file.name}")

    try:
        # Abrimos TODO el PDF para detección de equipos y elegimos página de eventos
        with pdfplumber.open(uploaded_file) as pdf:
            num_pages = len(pdf.pages)
            all_text = "\n".join([p.extract_text() or "" for p in pdf.pages])

            default_page = 2 if num_pages >= 2 else 1
            page_to_read = st.number_input(
                "¿Qué página quieres leer para extraer eventos?",
                min_value=1, max_value=num_pages, value=default_page, step=1
            )
            raw_text = pdf.pages[page_to_read - 1].extract_text() or ""

        # Vista previa del texto de la página seleccionada
        if raw_text.strip():
            st.subheader("Texto extraído (página seleccionada)")
            st.text_area("Contenido", unidecode(raw_text), height=240)
        else:
            st.warning("No se detectó texto en esa página (puede ser escaneado).")

        # === Detección de equipos ===
        teams_detected = detect_match_teams(all_text)  # ej. ["puebla", "pumas"]
        human_detected = [canon_to_pretty(t) for t in teams_detected] or ["(no detectados)"]
        st.caption(f"Equipos detectados: {', '.join(human_detected)}")

        # Sugerir "mi equipo": si Pumas aparece, úsalo; si no, el primero detectado; si nada, Pumas
        suggest_my = "pumas" if "pumas" in teams_detected else (teams_detected[0] if teams_detected else "pumas")

        my_team_canon = st.selectbox(
            "Selecciona tu equipo en este partido",
            options=TEAM_CANONICAL,
            index=TEAM_CANONICAL.index(suggest_my) if suggest_my in TEAM_CANONICAL else TEAM_CANONICAL.index("pumas"),
            format_func=canon_to_pretty
        )

        # Oponente: el otro detectado distinto a mi equipo
        opp_team_canon = None
        for t in teams_detected:
            if t != my_team_canon:
                opp_team_canon = t
                break

        # Permitir corrección manual del nombre del rival
        opp_team_input = st.text_input(
            "Equipo rival (auto si fue detectado; editable)",
            value=canon_to_pretty(opp_team_canon) if opp_team_canon else ""
        )
        if not opp_team_input.strip():
            opp_team_input = "Rival"

        my_team = canon_to_pretty(my_team_canon)
        opp_team = opp_team_input.strip()
        st.caption(f"Usaremos etiquetas: **{my_team}** / **{opp_team}**")

        # =========================
        # 2) Regex y extracción de eventos (en la página seleccionada)
        # =========================
        norm_text = re.sub(r"\s+", " ", raw_text or "").strip()

        GOL = re.compile(
            r"Gol de\s*\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+Min:\s*(\d+(?:\+\d+)?)",
            re.IGNORECASE
        )
        TARJ = re.compile(
            r"(Amarilla|Roja(?:\s*\(.*?\))?|Roja\s*Directa)\s*de\s*\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+Min:\s*(\d+(?:\+\d+)?)",
            re.IGNORECASE
        )
        SUB = re.compile(
            r"\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+por\s+\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+Min:\s*(\d+(?:\+\d+)?)",
            re.IGNORECASE
        )

        goles, tarjetas, subs, timeline = [], [], [], []
        order_counter = 0
        i, N = 0, len(norm_text)

        while i < N:
            mg = GOL.search(norm_text, i)
            mt = TARJ.search(norm_text, i)
            ms = SUB.search(norm_text, i)
            candidates = []
            if mg: candidates.append(("GOL", mg.start(), mg))
            if mt: candidates.append(("TARJ", mt.start(), mt))
            if ms: candidates.append(("SUB", ms.start(), ms))
            if not candidates:
                break
            tipo, _, m = sorted(candidates, key=lambda x: x[1])[0]

            if tipo == "GOL":
                dorsal = m.group(1)
                nombre = clean_name(m.group(2)).replace("Min:", "").strip()
                minuto_txt = m.group(3)
                minuto = parse_minuto(minuto_txt)
                goles.append({"dorsal": dorsal, "jugadora": nombre, "minuto_txt": minuto_txt, "minuto": minuto})
                timeline.append({"order": order_counter, "minuto": minuto, "minuto_txt": minuto_txt,
                                 "evento": "Gol", "detalle": f"Gol de ({dorsal}) {nombre}"})
            elif tipo == "TARJ":
                tipo_t = clean_name(m.group(1))
                dorsal = m.group(2)
                nombre = clean_name(m.group(3)).replace("Min:", "").strip()
                minuto_txt = m.group(4)
                minuto = parse_minuto(minuto_txt)
                tarjetas.append({"tipo": tipo_t, "dorsal": dorsal, "jugadora": nombre,
                                 "minuto_txt": minuto_txt, "minuto": minuto})
                timeline.append({"order": order_counter, "minuto": minuto, "minuto_txt": minuto_txt,
                                 "evento": f"Tarjeta {tipo_t}", "detalle": f"({dorsal}) {nombre}"})
            else:  # Sustitución: (SALE) B por (ENTRA) A Min:X
                sale_dorsal = m.group(1)
                sale_nombre = clean_name(m.group(2)).replace("Min:", "").strip()
                entra_dorsal = m.group(3)
                entra_nombre = clean_name(m.group(4)).replace("Min:", "").strip()
                minuto_txt = m.group(5)
                minuto = parse_minuto(minuto_txt)
                subs.append({"entra_dorsal": entra_dorsal, "entra": entra_nombre,
                             "sale_dorsal": sale_dorsal, "sale": sale_nombre,
                             "minuto_txt": minuto_txt, "minuto": minuto})
                timeline.append({"order": order_counter, "minuto": minuto, "minuto_txt": minuto_txt,
                                 "evento": "Sustitución",
                                 "detalle": f"Entra ({entra_dorsal}) {entra_nombre} por ({sale_dorsal}) {sale_nombre}"})
            order_counter += 1
            i = m.end()

        # =========================
        # 3) DataFrames base
        # =========================
        df_goles = pd.DataFrame(goles).sort_values("minuto") if goles else pd.DataFrame(columns=["dorsal", "jugadora", "minuto_txt", "minuto"])
        df_subs  = pd.DataFrame(subs )[["entra_dorsal","entra","sale_dorsal","sale","minuto_txt","minuto"]].sort_values("minuto") if subs else pd.DataFrame(columns=["entra_dorsal","entra","sale_dorsal","sale","minuto_txt","minuto"])
        df_tj    = pd.DataFrame(tarjetas).sort_values(["minuto","tipo"]) if tarjetas else pd.DataFrame(columns=["tipo","dorsal","jugadora","minuto_txt","minuto"])
        df_tl    = pd.DataFrame(timeline)[["minuto","minuto_txt","evento","detalle","order"]].sort_values(["minuto","order"]) if timeline else pd.DataFrame(columns=["minuto","minuto_txt","evento","detalle"])

        # =========================
        # 4) Asignar equipos con multiselects (goles/sustituciones) + autogoles
        # =========================
        st.divider()
        st.subheader("Asignar equipos a los eventos")

        # --- Goles ---
        if not df_goles.empty:
            goal_labels = [f"{i+1}. {row['minuto_txt']} — {row['jugadora']} ({row['dorsal']})"
                           for i, row in df_goles.reset_index(drop=True).iterrows()]
            idx_g = list(range(len(goal_labels)))

            goles_opp_idx = st.multiselect(
                f"Selecciona **goles de {opp_team}** (los no seleccionados se marcan como {my_team})",
                options=idx_g, default=[], format_func=lambda i: goal_labels[i]
            )
            autogoles_idx = st.multiselect(
                "¿Alguno fue **autogol**? (marca los que lo fueron)",
                options=idx_g, default=[], format_func=lambda i: goal_labels[i],
                help="Bandera informativa. El equipo beneficiado es el que marques arriba."
            )

            df_goles_edit = df_goles.copy().reset_index(drop=True)
            df_goles_edit["equipo"] = [opp_team if i in goles_opp_idx else my_team for i in idx_g]
            df_goles_edit["autogol"] = [i in autogoles_idx for i in idx_g]

            st.write("**Goles (con equipo y autogol)**")
            st.dataframe(df_goles_edit, use_container_width=True, hide_index=True)
        else:
            df_goles_edit = df_goles
            st.info("No se detectaron goles.")

        # --- Sustituciones ---
        if not df_subs.empty:
            sub_labels = [f"{i+1}. Min {row['minuto']} — Entra {row['entra']} por {row['sale']}"
                          for i, row in df_subs.reset_index(drop=True).iterrows()]
            idx_s = list(range(len(sub_labels)))

            subs_opp_idx = st.multiselect(
                f"Selecciona **sustituciones de {opp_team}** (las no seleccionadas se marcan como {my_team})",
                options=idx_s, default=[], format_func=lambda i: sub_labels[i]
            )

            df_subs_edit = df_subs.copy().reset_index(drop=True)
            df_subs_edit["equipo"] = [opp_team if i in subs_opp_idx else my_team for i in idx_s]

            st.write("**Sustituciones (con equipo)**")
            st.dataframe(df_subs_edit, use_container_width=True, hide_index=True)
        else:
            df_subs_edit = df_subs
            st.info("No se detectaron sustituciones.")

        # =========================
        # 5) Tablas base + Línea de tiempo
        # =========================
        st.divider()
        st.subheader("Eventos detectados (base)")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.write("**Sustituciones (base)**")
            st.dataframe(df_subs, use_container_width=True, hide_index=True)
        with col2:
            st.write("**Goles (base)**")
            st.dataframe(df_goles, use_container_width=True, hide_index=True)
        with col3:
            st.write("**Tarjetas**")
            st.dataframe(df_tj, use_container_width=True, hide_index=True)

        st.caption(f"Resumen — Sustituciones: {len(df_subs)} | Goles: {len(df_goles)} | Tarjetas: {len(df_tj)}")

        st.subheader("Línea de tiempo (cronología del partido)")
        if not df_tl.empty:
            st.dataframe(df_tl.drop(columns=["order"]), use_container_width=True, hide_index=True)
        else:
            st.info("No se detectaron eventos para la línea de tiempo.")

        # =========================
        # 6) Marcador al momento del cambio e Impacto
        # =========================
        st.divider()
        st.subheader("Marcador al momento del cambio e impacto")

        def build_score_series(goals_df: pd.DataFrame, my_team: str, opp_team: str):
            """
            Devuelve lista de tuplas (minuto, goles_my, goles_opp) ordenadas por minuto.
            Requiere columnas: 'minuto' (int) y 'equipo' (my_team/opp_team).
            """
            if goals_df.empty or "equipo" not in goals_df.columns:
                return []
            g = goals_df.sort_values("minuto").reset_index(drop=True)
            series = []
            my, opp = 0, 0
            for _, row in g.iterrows():
                if row["equipo"] == my_team:
                    my += 1
                elif row["equipo"] == opp_team:
                    opp += 1
                series.append((int(row["minuto"]), my, opp))
            return series

        def score_at(series, t: int):
            """Marcador hasta el minuto t (inclusive)."""
            my, opp = 0, 0
            for m, s_my, s_opp in series:
                if m <= t:
                    my, opp = s_my, s_opp
                else:
                    break
            return my, opp

        def puntos_por_estado(my_g: int, opp_g: int) -> int:
            """0 si perdiendo, 1 si empatando, 3 si ganando."""
            if my_g > opp_g:
                return 3
            if my_g == opp_g:
                return 1
            return 0

        # Serie acumulada y marcador final
        score_series = build_score_series(df_goles_edit, my_team, opp_team)
        my_final = opp_final = 0
        if score_series:
            my_final, opp_final = score_series[-1][1], score_series[-1][2]
        puntos_finales = puntos_por_estado(my_final, opp_final)

        # Calcular para cada sustitución de mi equipo
        impacto_rows = []
        if not df_subs_edit.empty:
            subs_my = df_subs_edit[df_subs_edit["equipo"] == my_team].copy().reset_index(drop=True)

            for _, row in subs_my.iterrows():
                t = int(row["minuto"])
                w_end = t + int(ventana_min)

                # Game state al momento del cambio
                my_t, opp_t = score_at(score_series, t)
                puntos_momento = puntos_por_estado(my_t, opp_t)

                # Etiqueta de game state textual
                if my_t > opp_t:
                    game_state = "Ganando"
                elif my_t < opp_t:
                    game_state = "Perdiendo"
                else:
                    game_state = "Empatando"

                # Impacto por puntos (tu lógica)
                delta_puntos = puntos_finales - puntos_momento

                if puntos_momento == 0 and puntos_finales == 3:
                    etiqueta = "IMPACTO MUY POSITIVO"
                elif puntos_momento == 0 and puntos_finales == 1:
                    etiqueta = "IMPACTO MEDIO"
                elif puntos_momento == 0 and puntos_finales == 0:
                    etiqueta = "IMPACTO NEUTRO"
                elif puntos_momento == 1 and puntos_finales == 3:
                    etiqueta = "IMPACTO POSITIVO"
                elif puntos_momento == 1 and puntos_finales == 1:
                    etiqueta = "IMPACTO NEUTRO"
                elif puntos_momento == 1 and puntos_finales == 0:
                    etiqueta = "IMPACTO NEGATIVO"
                elif puntos_momento == 3 and puntos_finales == 3:
                    etiqueta = "IMPACTO NEUTRO"
                elif puntos_momento == 3 and puntos_finales == 1:
                    etiqueta = "IMPACTO NEGATIVO"
                elif puntos_momento == 3 and puntos_finales == 0:
                    etiqueta = "IMPACTO MUY NEGATIVO"
                else:
                    etiqueta = "IMPACTO (revisar)"

                # (Opcional) Impacto inmediato en ventana (se mantiene como referencia)
                my_post = 0
                opp_post = 0
                if not df_goles_edit.empty:
                    for _, g in df_goles_edit.iterrows():
                        gmin = int(g["minuto"])
                        if t < gmin <= w_end:
                            if g["equipo"] == my_team:
                                my_post += 1
                            elif g["equipo"] == opp_team:
                                opp_post += 1
                impacto_ventana = my_post - opp_post

                impacto_rows.append({
                    "minuto_cambio": t,
                    "entra": row["entra"],
                    "sale": row["sale"],
                    "equipo_cambio": my_team,
                    "marcador_momento": f"{my_t}-{opp_t}",
                    "game_state": game_state,
                    "puntos_momento": puntos_momento,
                    "puntos_finales": puntos_finales,
                    "delta_puntos": delta_puntos,
                    "etiqueta_impacto_puntos": etiqueta,
                    "ventana_min": ventana_min,
                    "goles_mi_equipo_post": my_post,
                    "goles_rival_post": opp_post,
                    "impacto_ventana": impacto_ventana
                })

        cols = [
            "minuto_cambio","entra","sale","equipo_cambio",
            "marcador_momento","game_state","puntos_momento","puntos_finales",
            "delta_puntos","etiqueta_impacto_puntos",
            "ventana_min","goles_mi_equipo_post","goles_rival_post","impacto_ventana"
        ]
        df_impacto = pd.DataFrame(impacto_rows)[cols] if impacto_rows else pd.DataFrame(columns=cols)

        if not df_impacto.empty:
            st.dataframe(df_impacto.sort_values("minuto_cambio"), use_container_width=True, hide_index=True)
        else:
            st.info("Marca arriba los **goles de cada equipo** y las **sustituciones de tu equipo** para calcular el impacto.")

    except Exception as e:
        st.error(f"No se pudo leer o procesar el PDF. Detalle técnico: {e}")
else:
    st.info("⬆️ Arriba puedes subir el PDF del Informe Arbitral.")
