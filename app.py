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
    """
    Convierte '90+3' -> 93, '45' -> 45.
    Si algo no cuadra, devuelve -1 para marcar revisión.
    """
    if s is None:
        return -1
    s = s.strip()
    if not s:
        return -1
    if "+" in s:
        partes = s.split("+", 1)
        try:
            base = int(partes[0])
            extra = int(partes[1])
            return base + extra
        except Exception:
            return -1
    try:
        return int(s)
    except Exception:
        return -1

def clean_name(s: str) -> str:
    """Limpieza básica: quita saltos y espacios repetidos."""
    if s is None:
        return ""
    s = s.replace("\n", " ")
    s = " ".join(s.split())
    return s

# ⚠️ En los informes suele escribirse: "(30) Entra A por (25) Sale B Min: 62"
# Si en tus PDFs el orden es inverso, pon SUB_ORDER_IN_FIRST = False
SUB_ORDER_IN_FIRST = True

# Patrones Regex (robustos para Informe Arbitral)
pat_gol = re.compile(r"Gol de\s*\((\d+)\)\s+(.+?)\s+Min:\s*(\d+(?:\+\d+)?)", re.IGNORECASE)
pat_tarjeta = re.compile(
    r"(Amarilla|Roja(?:\s*\(.*?\))?|Roja\s*Directa)\s*de\s*\((\d+)\)\s+(.+?)\s+Min:\s*(\d+(?:\+\d+)?)",
    re.IGNORECASE
)
pat_sub = re.compile(
    r"\((\d+)\)\s+(.+?)\s+por\s+\((\d+)\)\s+(.+?)\s+Min:\s*(\d+(?:\+\d+)?)",
    re.IGNORECASE
)

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
                min_value=1,
                max_value=num_pages,
                value=default_page,
                step=1,
            )

            # Extraer texto de la página seleccionada
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
        # 4) Parsing de eventos
        # =========================
        text = raw_text if raw_text else ""

        # --- Goles ---
        goles = []
        for m in pat_gol.finditer(text):
            dorsal = m.group(1)
            nombre = clean_name(m.group(2))
            minuto_str = m.group(3)
            goles.append(
                {
                    "dorsal": dorsal,
                    "jugadora": nombre,
                    "minuto_txt": minuto_str,
                    "minuto": parse_minuto(minuto_str),
                }
            )
        df_goles = (
            pd.DataFrame(goles).sort_values("minuto")
            if goles
            else pd.DataFrame(columns=["dorsal", "jugadora", "minuto_txt", "minuto"])
        )

        # --- Tarjetas ---
        tarjetas = []
        for m in pat_tarjeta.finditer(text):
            tipo = clean_name(m.group(1))
            dorsal = m.group(2)
            nombre = clean_name(m.group(3))
            minuto_str = m.group(4)
            tarjetas.append(
                {
                    "tipo": tipo,
                    "dorsal": dorsal,
                    "jugadora": nombre,
                    "minuto_txt": minuto_str,
                    "minuto": parse_minuto(minuto_str),
                }
            )
        df_tarjetas = (
            pd.DataFrame(tarjetas).sort_values(["minuto", "tipo"])
            if tarjetas
            else pd.DataFrame(columns=["tipo", "dorsal", "jugadora", "minuto_txt", "minuto"])
        )

        # --- Sustituciones ---
        subs = []
        for m in pat_sub.finditer(text):
            dorsal_a = m.group(1)
            nombre_a = clean_name(m.group(2))
            dorsal_b = m.group(3)
            nombre_b = clean_name(m.group(4))
            minuto_str = m.group(5)

            if SUB_ORDER_IN_FIRST:
                entra_dorsal, entra_nombre = dorsal_a, nombre_a
                sale_dorsal, sale_nombre = dorsal_b, nombre_b
            else:
                entra_dorsal, entra_nombre = dorsal_b, nombre_b
                sale_dorsal, sale_nombre = dorsal_a, nombre_a

            subs.append(
                {
                    "entra_dorsal": entra_dorsal,
                    "entra": entra_nombre,
                    "sale_dorsal": sale_dorsal,
                    "sale": sale_nombre,
                    "minuto_txt": minuto_str,
                    "minuto": parse_minuto(minuto_str),
                }
            )
        df_subs = (
            pd.DataFrame(subs).sort_values("minuto")
            if subs
            else pd.DataFrame(columns=["entra_dorsal", "entra", "sale_dorsal", "sale", "minuto_txt", "minuto"])
        )

        # =========================
        # 5) Mostrar tablas
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
