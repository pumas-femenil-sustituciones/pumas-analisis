import streamlit as st

# Librerías para leer PDF y normalizar texto
import pdfplumber
from unidecode import unidecode

# Configuración básica de la app
st.set_page_config(page_title="Pumas Femenil – Beta", page_icon="⚽", layout="wide")
st.title("Análisis de Sustituciones – Pumas Femenil (Beta)")
st.write("Sube el PDF del Informe Arbitral para procesarlo y analizarlo.")

# 1) Cargador de PDFs
uploaded_file = st.file_uploader("Subir PDF", type=["pdf"])

if uploaded_file is not None:
    st.success(f"Archivo subido: {uploaded_file.name}")

    try:
        # 2) Abrimos el PDF
        with pdfplumber.open(uploaded_file) as pdf:
            num_pages = len(pdf.pages)
            st.caption(f"El PDF tiene {num_pages} página(s).")

            # Por defecto leemos la página 2 (Informe Arbitral), si existe
            default_page = 2 if num_pages >= 2 else 1
            page_to_read = st.number_input(
                "¿Qué página quieres leer?",
                min_value=1,
                max_value=num_pages,
                value=default_page,
                step=1
            )

            # 3) Extraemos texto de la página elegida
            raw_text = pdf.pages[page_to_read - 1].extract_text() or ""

       import re
import pandas as pd

# --- Utilidades ---
def parse_minuto(s: str) -> int:
    """
    Convierte '90+3' -> 93, '45' -> 45.
    Si algo no cuadra, devuelve -1 para que lo puedas identificar.
    """
    s = s.strip()
    if "+" in s:
        base, extra = s.split("+", 1)
        try:
            return int(base) + int(extra)
        except:
            return -1
    try:
        return int(s)
    except:
        return -1

def clean_name(s: str) -> str:
    # Limpieza básica de nombres
    return " ".join(s.replace("\n", " ").split())

# ⚠️ Por defecto asumimos que en la línea de sustitución
# "A por B" significa: A ENTRA por B SALE.
# Si en tus PDFs el orden es inverso, cambia a False.
SUB_ORDER_IN_FIRST = True

# --- Patrones (robustos para el estilo del Informe Arbitral) ---
# Gol: "Gol de (14) Apellidos Nombres Min: 52"
pat_gol = re.compile(r"Gol de\s*\((\d+)\)\s+(.+?)\s+Min:\s*(\d+(?:\+\d+)?)", re.IGNORECASE)

# Tarjetas: "Amarilla de (28) Apellidos Nombres Min: 63"
# También cubre "Roja (doble amarilla)" o "Roja Directa"
pat_tarjeta = re.compile(
    r"(Amarilla|Roja(?:\s*\(.*?\))?|Roja\s*Directa)\s*de\s*\((\d+)\)\s+(.+?)\s+Min:\s*(\d+(?:\+\d+)?)",
    re.IGNORECASE
)

# Sustituciones: "(30) Nombre A por (25) Nombre B Min: 45"
pat_sub = re.compile(
    r"\((\d+)\)\s+(.+?)\s+por\s+\((\d+)\)\s+(.+?)\s+Min:\s*(\d+(?:\+\d+)?)",
    re.IGNORECASE
)

text = raw_text if raw_text else ""
lines_dbg = [l.strip() for l in text.splitlines() if l.strip()]

# --- Goles ---
goles = []
for m in pat_gol.finditer(text):
    dorsal = m.group(1)
    nombre = clean_name(m.group(2))
    minuto_str = m.group(3)
    goles.append({
        "dorsal": dorsal,
        "jugadora": nombre,
        "minuto_txt": minuto_str,
        "minuto": parse_minuto(minuto_str)
    })
df_goles = pd.DataFrame(goles).sort_values("minuto") if goles else pd.DataFrame(columns=["dorsal","jugadora","minuto_txt","minuto"])

# --- Tarjetas ---
tarjetas = []
for m in pat_tarjeta.finditer(text):
    tipo = clean_name(m.group(1))
    dorsal = m.group(2)
    nombre = clean_name(m.group(3))
    minuto_str = m.group(4)
    tarjetas.append({
        "tipo": tipo,
        "dorsal": dorsal,
        "jugadora": nombre,
        "minuto_txt": minuto_str,
        "minuto": parse_minuto(minuto_str)
    })
df_tarjetas = pd.DataFrame(tarjetas).sort_values(["minuto","tipo"]) if tarjetas else pd.DataFrame(columns=["tipo","dorsal","jugadora","minuto_txt","minuto"])

# --- Sustituciones ---
subs = []
for m in pat_sub.finditer(text):
    dorsal_a = m.group(1); nombre_a = clean_name(m.group(2))
    dorsal_b = m.group(3); nombre_b = clean_name(m.group(4))
    minuto_str = m.group(5)
    if SUB_ORDER_IN_FIRST:
        entra_dorsal, entra_nombre = dorsal_a, nombre_a
        sale_dorsal,  sale_nombre  = dorsal_b, nombre_b
    else:
        entra_dorsal, entra_nombre = dorsal_b, nombre_b
        sale_dorsal,  sale_nombre  = dorsal_a, nombre_a
    subs.append({
        "entra_dorsal": entra_dorsal,
        "entra": entra_nombre,
        "sale_dorsal": sale_dorsal,
        "sale": sale_nombre,
        "minuto_txt": minuto_str,
        "minuto": parse_minuto(minuto_str)
    })
df_subs = pd.DataFrame(subs).sort_values("minuto") if subs else pd.DataFrame(columns=["entra_dorsal","entra","sale_dorsal","sale","minuto_txt","minuto"])

# --- Mostrar resultados en la app ---
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

# Pequeño resumen
st.caption(
    f"Resumen — Sustituciones: {len(df_subs)} | Goles: {len(df_goles)} | Tarjetas: {len(df_tarjetas)}"
)
