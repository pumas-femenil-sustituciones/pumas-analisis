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

# En tus informes: "SALE por ENTRA"
SUB_ORDER_IN_FIRST = False

# =========================
# Parámetros en sidebar (por ahora informativos)
# =========================
st.sidebar.header("Parámetros")
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
        # 5) Escáner secuencial -> eventos
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
        df_subs = (pd.DataFrame(subs)[["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"]]
                   .sort_values("minuto")
                   if subs else pd.DataFrame(columns=["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"]))
        df_tarjetas = (pd.DataFrame(tarjetas).sort_values(["minuto", "tipo"])
                       if tarjetas else pd.DataFrame(columns=["tipo", "dorsal", "jugadora", "minuto_txt", "minuto"]))
        df_timeline = (pd.DataFrame(timeline)[["minuto", "minuto_txt", "evento", "detalle", "order"]]
                       .sort_values(["minuto", "order"])
                       if timeline else pd.DataFrame(columns=["minuto", "minuto_txt", "evento", "detalle"]))

        # =========================
        # 7) NUEVO — Asignación rápida de equipos (resuelve tus 2 puntos)
        # =========================
        st.divider()
        st.subheader("Asignar equipos a los eventos (rápido)")

        # Goles: multiselect de goles del Rival
        goal_options = [f"{i+1}. {row['minuto_txt']} — {row['jugadora']} ({row['dorsal']})"
                        for i, row in df_goles.reset_index(drop=True).iterrows()]
        # Default: primer gol Rival (índice 0), solo la 1a vez
        if "goal_rival_sel" not in st.session_state:
            st.session_state.goal_rival_sel = [0] if len(goal_options) >= 1 else []
        goal_rival_sel = st.multiselect(
            "Marca los **goles del Rival**",
            options=list(range(len(goal_options))),
            default=st.session_state.goal_rival_sel,
            format_func=lambda idx: goal_options[idx],
            key="ms_goals_rival",
        )

        # Sustituciones: multiselect de cambios del Rival
        sub_options = [f"{i+1}. Min {row['minuto']} — Entra {row['entra']} por {row['sale']}"
                       for i, row in df_subs.reset_index(drop=True).iterrows()]
        # Default: filas 4,7,8,9 Rival (índices base-0 -> 3,6,7,8), solo la 1a vez
        if "sub_rival_sel" not in st.session_state:
            predef = []
            for idx in [3, 6, 7, 8]:
                if idx < len(sub_options):
                    predef.append(idx)
            st.session_state.sub_rival_sel = predef
        sub_rival_sel = st.multiselect(
            "Marca las **sustituciones del Rival**",
            options=list(range(len(sub_options))),
            default=st.session_state.sub_rival_sel,
            format_func=lambda idx: sub_options[idx],
            key="ms_subs_rival",
        )

        # Construimos df_goles_edit / df_subs_edit con la etiqueta de equipo
        df_goles_edit = df_goles.copy()
        if not df_goles_edit.empty:
            df_goles_edit["equipo"] = "Pumas"
            for idx in goal_rival_sel:
                if 0 <= idx < len(df_goles_edit):
                    df_goles_edit.iloc[idx, df_goles_edit.columns.get_loc("equipo")] = "Rival"

        df_subs_edit = df_subs.copy()
        if not df_subs_edit.empty:
            df_subs_edit["equipo"] = "Pumas"
            for idx in sub_rival_sel:
                if 0 <= idx < len(df_subs_edit):
                    df_subs_edit.iloc[idx, df_subs_edit.columns.get_loc("equipo")] = "Rival"

        # Mostrar cómo quedó la asignación
        colA, colB = st.columns(2)
        with colA:
            st.write("**Goles (con equipo asignado)**")
            st.dataframe(df_goles_edit, use_container_width=True, hide_index=True)
        with colB:
            st.write("**Sustituciones (con equipo asignado)**")
            st.dataframe(df_subs_edit, use_container_width=True, hide_index=True)

        # =========================
        # 8) Tablas base + Línea de tiempo (igual que antes)
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
            st.dataframe(df_tarjetas, use_container_width=True, hide_index=True)

        st.caption(f"Resumen — Sustituciones: {len(df_subs)} | Goles: {len(df_goles)} | Tarjetas: {len(df_tarjetas)}")

        st.subheader("Línea de tiempo (cronología del partido)")
        if not df_timeline.empty:
            st.dataframe(df_timeline.drop(columns=["order"]), use_container_width=True, hide_index=True)
        else:
            st.info("No se detectaron eventos para la línea de tiempo.")

        # =========================
        # Nota: el cálculo de marcador/impacto lo revisamos después,
        # cuando confirmes que estos dos puntos ya están correctos.
        # =========================

    except Exception as e:
        st.error(f"No se pudo leer o procesar el PDF. Detalle técnico: {e}")
else:
    st.info("⬆️ Arriba puedes subir el PDF del Informe Arbitral.")
