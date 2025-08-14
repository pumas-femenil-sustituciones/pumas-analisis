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

# ⚠️ Tus informes usan "SALE por ENTRA" → ponemos False
SUB_ORDER_IN_FIRST = False

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
        # 5) Escáner secuencial
        # =========================
        goles, tarjetas, subs = [], [], []
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
                minuto_str = m.group(3)
                goles.append({
                    "dorsal": dorsal,
                    "jugadora": nombre,
                    "minuto_txt": minuto_str,
                    "minuto": parse_minuto(minuto_str),
                })
            elif tipo == "TARJ":
                tipo_t = clean_name(m.group(1))
                dorsal = m.group(2)
                nombre = clean_name(m.group(3)).replace("Min:", "").strip()
                minuto_str = m.group(4)
                tarjetas.append({
                    "tipo": tipo_t,
                    "dorsal": dorsal,
                    "jugadora": nombre,
                    "minuto_txt": minuto_str,
                    "minuto": parse_minuto(minuto_str),
                })
            else:  # SUB (SALE por ENTRA)
                sale_dorsal = m.group(1)
                sale_nombre = clean_name(m.group(2)).replace("Min:", "").strip()
                entra_dorsal = m.group(3)
                entra_nombre = clean_name(m.group(4)).replace("Min:", "").strip()
                minuto_str = m.group(5)

                # Como SUB_ORDER_IN_FIRST=False, guardamos como entra/sale correcto
                subs.append({
                    "entra_dorsal": entra_dorsal,
                    "entra": entra_nombre,
                    "sale_dorsal": sale_dorsal,
                    "sale": sale_nombre,
                    "minuto_txt": minuto_str,
                    "minuto": parse_minuto(minuto_str),
                })

            i = m.end()

        # =========================
        # 6) DataFrames
        # =========================
        df_goles = (
            pd.DataFrame(goles).sort_values("minuto")
            if goles else pd.DataFrame(columns=["dorsal", "jugadora", "minuto_txt", "minuto"])
        )
        df_tarjetas = (
            pd.DataFrame(tarjetas).sort_values(["minuto", "tipo"])
            if tarjetas else pd.DataFrame(columns=["tipo", "dorsal", "jugadora", "minuto_txt", "minuto"])
        )
        df_subs = (
            pd.DataFrame(subs)[["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"]]
            .sort_values("minuto")
            if subs else pd.DataFrame(columns=["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"])
        )

        # =========================
        # 7) Mostrar tablas
        # =========================
        st.divider()
        st.subheader("Eventos detectados")

        col1, col2, col3 = st.columns(3)
        with col1:
            st.write("**Sustituciones**")
            st.dataframe(df_subs, use_container_width=True, hide_index=True)
        with col2:
            st.write("**Goles**")
            st.dataframe(df_goles, use_container_width=True, hide_index=True)
        with col3:
            st.write("**Tarjetas**")
            st.dataframe(df_tarjetas, use_container_width=True, hide_index=True)

        st.caption(
            f"Resumen — Sustituciones: {len(df_subs)} | Goles: {len(df_goles)} | Tarjetas: {len(df_tarjetas)}"
        )

    except Exception as e:
        st.error(f"No se pudo leer o procesar el PDF. Detalle técnico: {e}")
else:
    st.info("⬆️ Arriba puedes subir el PDF del Informe Arbitral.")
