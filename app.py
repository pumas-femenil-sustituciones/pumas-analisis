import streamlit as st

st.set_page_config(page_title="Pumas Femenil – Beta", page_icon="⚽", layout="wide")
st.title("Análisis de Sustituciones – Pumas Femenil (Beta)")

st.write("Sube el PDF del Informe Arbitral para procesarlo y analizarlo.")

# 1) Cargador de PDFs
uploaded_file = st.file_uploader("Subir PDF", type=["pdf"])

if uploaded_file is not None:
    st.success(f"Archivo subido: {uploaded_file.name}")
    # Aquí, en el siguiente paso, leeremos y extraeremos el texto/eventos
