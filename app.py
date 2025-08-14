import streamlit as st
import pdfplumber
from unidecode import unidecode
import re
import pandas as pd

# =========================
# Configuración de la página
# =========================
st.set_page_config(page_title="Pumas Femenil – Beta", page_icon="⚽", layout="wide")
st.title("Análisis de Sustituciones – Pumas Femenil (Beta)")
st.write("Sube el PDF del Informe Arbitral para procesarlo y analizarlo.")

# =========================
# Utilidades
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
        except:
            return -1
    try:
        return int(s)
    except:
        return -1

def clean_name(s: str) -> str:
    """Quita saltos y espacios repetidos."""
    if s is None:
        return ""
    s = s.replace("\n", " ")
    return " ".join(s.split()).strip()

# Tus informes usan "SALE por ENTRA" → ponemos False
SUB_ORDER_IN_FIRST = False

# =========================
# Sidebar (parámetros)
# =========================
st.sidebar.header("Parámetros del análisis")
pumas_side = st.sidebar.selectbox("¿Quién es Pumas?", ["Local", "Visitante"], index=0)
ventana_min = st.sidebar.number_input("Ventana post-cambio (min)", min_value=5, max_value=30, value=10, step=1)

# =========================
# 1) Cargador de PDF
# =========================
uploaded_file = st.file_uploader("Subir PDF", type=["pdf"])

if uploaded_file is not None:
    st.success(f"Archivo subido: {uploaded_file.name}")

    try:
        # =========================
        # 2) Abrimos el PDF y elegimos página
        # =========================
        with pdfplumber.open(uploaded_file) as pdf:
            num_pages = len(pdf.pages)
            st.caption(f"El PDF tiene {num_pages} página(s).")
            default_page = 2 if num_pages >= 2 else 1

            page_to_read = st.number_input(
                "¿Qué página quieres leer?",
                min_value=1, max_value=num_pages, value=default_page, step=1
            )

            raw_text = pdf.pages[page_to_read - 1].extract_text() or ""

        # =========================
        # 3) Vista previa del texto
        # =========================
        if raw_text.strip():
            st.subheader("Texto extraído")
            st.text_area("Contenido", unidecode(raw_text), height=300)
            st.download_button(
                label="Descargar texto extraído (.txt)",
                data=unidecode(raw_text),
                file_name=f"{uploaded_file.name}.txt",
                mime="text/plain",
            )
        else:
            st.warning(
                "No se detectó texto en esa página. Puede ser una imagen escaneada. "
                "Más adelante podemos añadir OCR gratuito o captura manual."
            )

        # =========================
        # 4) Normalización y Patrones
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
        # (SALE) Nombre B por (ENTRA) Nombre A Min:X
        SUB = re.compile(
            r"\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+por\s+\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+Min:\s*(\d+(?:\+\d+)?)",
            re.IGNORECASE
        )

        # =========================
        # 5) Escáner secuencial (y línea de tiempo)
        # =========================
        goles, tarjetas, subs = [], [], []
        timeline = []
        order_counter = 0

        i = 0
        N = len(norm_text)
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

            else:  # SUB (SALE por ENTRA)
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
        # 6) DataFrames base
        # =========================
        df_goles = (pd.DataFrame(goles).sort_values("minuto")
                    if goles else pd.DataFrame(columns=["dorsal", "jugadora", "minuto_txt", "minuto"]))
        df_tarjetas = (pd.DataFrame(tarjetas).sort_values(["minuto", "tipo"])
                       if tarjetas else pd.DataFrame(columns=["tipo", "dorsal", "jugadora", "minuto_txt", "minuto"]))
        df_subs = (pd.DataFrame(subs)[["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"]]
                   .sort_values("minuto")
                   if subs else pd.DataFrame(columns=["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"]))
        df_timeline = (pd.DataFrame(timeline)[["minuto", "minuto_txt", "evento", "detalle", "order"]]
                       .sort_values(["minuto", "order"])
                       if timeline else pd.DataFrame(columns=["minuto", "minuto_txt", "evento", "detalle"]))

        # =========================
        # 7) Mostrar tablas
        # =========================
        st.divider()
        st.subheader("Eventos detectados")

        col1, col2, col3 = st.columns(3)
        with col1:
            st.write("**Sustituciones (sin equipo asignado aún)**")
            st.dataframe(df_subs, use_container_width=True, hide_index=True)
        with col2:
            st.write("**Goles (sin equipo asignado aún)**")
            st.dataframe(df_goles, use_container_width=True, hide_index=True)
        with col3:
            st.write("**Tarjetas**")
            st.dataframe(df_tarjetas, use_container_width=True, hide_index=True)

        st.caption(f"Resumen — Sustituciones: {len(df_subs)} | Goles: {len(df_goles)} | Tarjetas: {len(df_tarjetas)}")

        st.subheader("Línea de tiempo (cronología del partido)")
        if not df_timeline.empty:
            st.dataframe(df_timeline.drop(columns=["order"]), use_container_width=True, hide_index=True)
        else:
            st.info("No se detectaron eventos para la línea de tiempo.")

        # =========================
        # 8) Asignar equipos (Pumas / Rival) para goles y sustituciones
        # =========================
        st.divider()
        st.subheader("Asignar equipos a los eventos")

        # Goles: agregar columna 'equipo' editable
        if not df_goles.empty:
            df_goles_edit = df_goles.copy()
            if "equipo" not in df_goles_edit.columns:
                df_goles_edit["equipo"] = "Pumas"  # valor por defecto; puedes cambiarlo
            df_goles_edit = st.data_editor(
                df_goles_edit,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "equipo": st.column_config.SelectboxColumn(
                        "equipo (gol)",
                        options=["Pumas", "Rival"],
                        help="Indica si el gol fue de Pumas o del Rival",
                        default="Pumas",
                    )
                }
            )
        else:
            df_goles_edit = df_goles

        # Sustituciones: agregar columna 'equipo' editable
        if not df_subs.empty:
            df_subs_edit = df_subs.copy()
            if "equipo" not in df_subs_edit.columns:
                df_subs_edit["equipo"] = "Pumas"  # por defecto
            df_subs_edit = st.data_editor(
                df_subs_edit,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "equipo": st.column_config.SelectboxColumn(
                        "equipo (cambio)",
                        options=["Pumas", "Rival"],
                        help="Indica qué equipo realizó la sustitución",
                        default="Pumas",
                    )
                }
            )
        else:
            df_subs_edit = df_subs

        # =========================
        # 9) Marcador minuto a minuto y estado al cambio
        # =========================
        st.divider()
        st.subheader("Marcador al momento del cambio e impacto")

        # Construir marcador acumulado a partir de goles etiquetados
        def build_score_series(goals_df):
            # goals_df: requiere columnas 'minuto' y 'equipo'
            goals_sorted = goals_df.sort_values("minuto").reset_index(drop=True)
            series = []  # lista de (minuto, pumas, rival)
            pumas = 0
            rival = 0
            for _, row in goals_sorted.iterrows():
                if row.get("equipo") == "Pumas":
                    pumas += 1
                elif row.get("equipo") == "Rival":
                    rival += 1
                series.append((int(row["minuto"]), pumas, rival))
            return series

        score_series = build_score_series(df_goles_edit) if not df_goles_edit.empty else []

        def score_at(minuto):
            """Devuelve (pumas, rival) hasta ese minuto inclusive."""
            p, r = 0, 0
            for m, sp, sr in score_series:
                if m <= minuto:
                    p, r = sp, sr
                else:
                    break
            return p, r

        # =========================
        # 10) Impacto por sustitución (solo Pumas)
        # =========================
        impacto_rows = []
        if not df_subs_edit.empty:
            subs_pumas = df_subs_edit[df_subs_edit["equipo"] == "Pumas"].copy().reset_index(drop=True)

            for _, row in subs_pumas.iterrows():
                t = int(row["minuto"])
                w_end = t + int(ventana_min)

                # Marcador al momento del cambio
                p_t, r_t = score_at(t)
                marcador_momento = f"{p_t}-{r_t}"
                game_state = "Empatando"
                if p_t > r_t:
                    game_state = "Ganando"
                elif p_t < r_t:
                    game_state = "Perdiendo"

                # Goles en la ventana posterior (t, w_end]
                p_post = 0
                r_post = 0
                for _, g in df_goles_edit.iterrows():
                    gmin = int(g["minuto"])
                    if t < gmin <= w_end:
                        if g["equipo"] == "Pumas":
                            p_post += 1
                        elif g["equipo"] == "Rival":
                            r_post += 1

                impacto = p_post - r_post

                impacto_rows.append({
                    "minuto_cambio": t,
                    "entra": row["entra"],
                    "sale": row["sale"],
                    "marcador_momento": marcador_momento,
                    "game_state": game_state,
                    "ventana": f"{t+1}-{w_end}",
                    "goles_pumas_post": p_post,
                    "goles_rival_post": r_post,
                    "impacto": impacto
                })

        df_impacto = (pd.DataFrame(impacto_rows)
                      if impacto_rows else pd.DataFrame(columns=[
                          "minuto_cambio","entra","sale","marcador_momento","game_state",
                          "ventana","goles_pumas_post","goles_rival_post","impacto"
                      ]))

        if not df_impacto.empty:
            st.dataframe(df_impacto.sort_values("minuto_cambio"), use_container_width=True, hide_index=True)
        else:
            st.info("Asigna equipos a goles y sustituciones arriba para calcular el impacto (solo cambios de Pumas).")

    except Exception as e:
        st.error(f"No se pudo leer o procesar el PDF. Detalle técnico: {e}")
else:
    st.info("⬆️ Arriba puedes subir el PDF del Informe Arbitral.")
