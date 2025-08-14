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

        # 4) Mostramos el texto (normalizado para evitar problemas de acentos raros)
        if raw_text.strip():
            st.subheader("Texto extraído")
            st.text_area("Contenido", unidecode(raw_text), height=400)

            # Botón para descargar el texto
            st.download_button(
                label="Descargar texto extraído (.txt)",
                data=unidecode(raw_text),
                file_name=f"{uploaded_file.name}.txt",
                mime="text/plain",
            )
            st.info("✅ Listo. Mañana usaremos este texto para detectar goles, sustituciones y tarjetas.")
        else:
            st.warning("No se detectó texto en esa página. Es posible que el PDF sea una imagen escaneada. "
                       "En ese caso, mañana vemos opciones para captura manual u OCR gratuito.")

    except Exception as e:
        st.error(f"No se pudo leer el PDF. Detalle técnico: {e}")
