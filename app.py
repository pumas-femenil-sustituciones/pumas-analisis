import streamlit as st
import pdfplumber
from unidecode import unidecode
import re
import pandas as pd
from collections import Counter

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
    if s is None:
        return ""
    s = s.replace("\n", " ")
    return " ".join(s.split()).strip()

# En tus informes: "SALE por ENTRA"
SUB_ORDER_IN_FIRST = False

# =========================
# Parámetros en sidebar
# =========================
st.sidebar.header("Parámetros")
pumas_side = st.sidebar.selectbox("¿Quién es Pumas?", ["Local", "Visitante"], index=0)
ventana_min = st.sidebar.number_input("Ventana post-cambio (min)", min_value=5, max_value=30, value=10, step=1)

# =========================
# Detección de rival
# =========================
TEAMS_FEMENIL = [
    "pumas", "america", "chivas", "atlas", "tigres", "rayadas",
    "pachuca", "leon", "toluca", "queretaro", "cruz azul", "necaxa", "tijuana",
    "santos", "mazatlan", "juarez", "atletico san luis", "puebla"
]

def detect_rival_name(raw_text: str, pumas_name: str = "Pumas") -> str:
    if not raw_text:
        return "Rival"

    txt = unidecode(raw_text)
    txt_norm = re.sub(r"\s+", " ", txt).strip()
    low = txt_norm.lower()

    m = re.search(r"\b([A-Za-zÁÉÍÓÚÜÑñ\s\.]+?)\s*(?:vs\.?|contra|\-)\s*([A-Za-zÁÉÍÓÚÜÑñ\s\.]+?)\b", txt, flags=re.IGNORECASE)
    candidates = []
    if m:
        a = clean_name(m.group(1))
        b = clean_name(m.group(2))
        candidates.extend([a, b])

    present = []
    for t in TEAMS_FEMENIL:
        if t in low:
            present.append(t)

    pretty_map = {
        "america": "América",
        "chivas": "Chivas",
        "atlas": "Atlas",
        "tigres": "Tigres",
        "rayadas": "Rayadas",
        "pachuca": "Pachuca",
        "leon": "León",
        "toluca": "Toluca",
        "queretaro": "Querétaro",
        "cruz azul": "Cruz Azul",
        "necaxa": "Necaxa",
        "tijuana": "Tijuana",
        "santos": "Santos",
        "mazatlan": "Mazatlán",
        "juarez": "Juárez",
        "atletico san luis": "Atlético San Luis",
        "puebla": "Puebla",
        "pumas": "Pumas",
    }

    norm_pumas = unidecode(pumas_name).lower()
    if candidates:
        for c in candidates:
            if "pumas" not in unidecode(c).lower():
                return c.strip().title()

    counts = Counter(present)
    if counts:
        for team, _ in counts.most_common():
            if team != "pumas":
                return pretty_map.get(team, team.title())

    return "Rival"

# =========================
# 1) Cargador de PDF
# =========================
uploaded_file = st.file_uploader("Subir PDF", type=["pdf"])

if uploaded_file is not None:
    st.success(f"Archivo subido: {uploaded_file.name}")

    try:
        with pdfplumber.open(uploaded_file) as pdf:
            num_pages = len(pdf.pages)
            st.caption(f"El PDF tiene {num_pages} página(s).")
            default_page = 2 if num_pages >= 2 else 1

            page_to_read = st.number_input(
                "¿Qué página quieres leer?",
                min_value=1, max_value=num_pages, value=default_page, step=1
            )

            raw_text = pdf.pages[page_to_read - 1].extract_text() or ""

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
            st.warning("No se detectó texto en esa página.")

        rival_detected = detect_rival_name(raw_text, pumas_name="Pumas")
        rival_name = st.text_input("Equipo rival detectado (puedes corregirlo):", value=rival_detected)
        st.caption(f"Etiquetas usarán: Pumas / {rival_name}")

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
            else:
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

        df_goles = pd.DataFrame(goles).sort_values("minuto") if goles else pd.DataFrame(columns=["dorsal", "jugadora", "minuto_txt", "minuto"])
        df_subs = pd.DataFrame(subs)[["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"]].sort_values("minuto") if subs else pd.DataFrame(columns=["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"])
        df_tarjetas = pd.DataFrame(tarjetas).sort_values(["minuto", "tipo"]) if tarjetas else pd.DataFrame(columns=["tipo", "dorsal", "jugadora", "minuto_txt", "minuto"])
        df_timeline = pd.DataFrame(timeline)[["minuto", "minuto_txt", "evento", "detalle", "order"]].sort_values(["minuto", "order"]) if timeline else pd.DataFrame(columns=["minuto", "minuto_txt", "evento", "detalle"])

        st.divider()
        st.subheader("Asignar equipos a los eventos")

        if not df_goles.empty:
            goal_labels = [f"{i+1}. {row['minuto_txt']} — {row['jugadora']} ({row['dorsal']})" for i, row in df_goles.reset_index(drop=True).iterrows()]
            idx_range_goals = list(range(len(goal_labels)))
            goles_rival_idx = st.multiselect(f"Selecciona **goles de {rival_name}**", options=idx_range_goals, default=[], format_func=lambda i: goal_labels[i])
            autogoles_idx = st.multiselect("¿Alguno fue **autogol**?", options=idx_range_goals, default=[], format_func=lambda i: goal_labels[i])
            df_goles_edit = df_goles.copy().reset_index(drop=True)
            df_goles_edit["equipo"] = [rival_name if i in goles_rival_idx else "Pumas" for i in idx_range_goals]
            df_goles_edit["autogol"] = [i in autogoles_idx for i in idx_range_goals]
            st.write("**Goles (con equipo y autogol)**")
            st.dataframe(df_goles_edit, use_container_width=True, hide_index=True)
        else:
            df_goles_edit = df_goles
            st.info("No se detectaron goles.")

        if not df_subs.empty:
            sub_labels = [f"{i+1}. Min {row['minuto']} — Entra {row['entra']} por {row['sale']}" for i, row in df_subs.reset_index(drop=True).iterrows()]
            idx_range_subs = list(range(len(sub_labels)))
            subs_rival_idx = st.multiselect(f"Selecciona **sustituciones de {rival_name}**", options=idx_range_subs, default=[], format_func=lambda i: sub_labels[i])
            df_subs_edit = df_subs.copy().reset_index(drop=True)
            df_subs_edit["equipo"] = [rival_name if i in subs_rival_idx else "Pumas" for i in idx_range_subs]
            st.write("**Sustituciones (con equipo)**")
            st.dataframe(df_subs_edit, use_container_width=True, hide_index=True)
        else:
            df_subs_edit = df_subs
            st.info("No se detectaron sustituciones.")

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

    except Exception as e:
        st.error(f"No se pudo leer o procesar el PDF. Detalle técnico: {e}")
else:
    st.info("⬆️ Arriba puedes subir el PDF del Informe Arbitral.")
