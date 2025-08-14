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
# Parámetros en sidebar (informativos)
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
        # 7) Multiselects para determinar equipo y autogoles
        # =========================
        st.divider()
        st.subheader("Asignar equipos a los eventos")

        # --- Goles ---
        if not df_goles.empty:
            goal_labels = [f"{i+1}. {row['minuto_txt']} — {row['jugadora']} ({row['dorsal']})"
                           for i, row in df_goles.reset_index(drop=True).iterrows()]
            idx_range_goals = list(range(len(goal_labels)))

            goles_rival_idx = st.multiselect(
                "Selecciona **goles del Rival** (los no seleccionados se marcan como Pumas)",
                options=idx_range_goals,
                default=[],  # SIN defaults fijos
                format_func=lambda i: goal_labels[i]
            )

            autogoles_idx = st.multiselect(
                "¿Alguno fue **autogol**? (marca los que lo fueron)",
                options=idx_range_goals,
                default=[],
                format_func=lambda i: goal_labels[i],
                help="Se marca la bandera 'autogol' para referencia. El equipo beneficiado es el que selecciones arriba."
            )

            df_goles_edit = df_goles.copy().reset_index(drop=True)
            df_goles_edit["equipo"] = ["Rival" if i in goles_rival_idx else "Pumas" for i in idx_range_goals]
            df_goles_edit["autogol"] = [i in autogoles_idx for i in idx_range_goals]

            st.write("**Goles (con equipo y autogol)**")
            st.dataframe(df_goles_edit, use_container_width=True, hide_index=True)
        else:
            df_goles_edit = df_goles
            st.info("No se detectaron goles.")

        # --- Sustituciones ---
        if not df_subs.empty:
            sub_labels = [f"{i+1}. Min {row['minuto']} — Entra {row['entra']} por {row['sale']}"
                          for i, row in df_subs.reset_index(drop=True).iterrows()]
            idx_range_subs = list(range(len(sub_labels)))

            subs_rival_idx = st.multiselect(
                "Selecciona **sustituciones del Rival** (las no seleccionadas se marcan como Pumas)",
                options=idx_range_subs,
                default=[],  # SIN defaults fijos
                format_func=lambda i: sub_labels[i]
            )

            df_subs_edit = df_subs.copy().reset_index(drop=True)
            df_subs_edit["equipo"] = ["Rival" if i in subs_rival_idx else "Pumas" for i in idx_range_subs]

            st.write("**Sustituciones (con equipo)**")
            st.dataframe(df_subs_edit, use_container_width=True, hide_index=True)
        else:
            df_subs_edit = df_subs
            st.info("No se detectaron sustituciones.")

        # =========================
        # 8) Tablas base + Línea de tiempo (referencia)
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

        # Nota: Dejamos el cálculo de marcador/impacto para el siguiente paso
        # una vez confirmes que las asignaciones por multiselect quedaron bien.

    except Exception as e:
        st.error(f"No se pudo leer o procesar el PDF. Detalle técnico: {e}")
else:
    st.info("⬆️ Arriba puedes subir el PDF del Informe Arbitral.")
