import streamlit as st
import pdfplumber
from unidecode import unidecode
import re
import pandas as pd
from collections import Counter
import matplotlib.pyplot as plt

# =========================
# Configuración
# =========================
st.set_page_config(page_title="Análisis de Sustituciones – Beta", page_icon="⚽", layout="wide")
st.title("Análisis de Sustituciones – Beta (Liga MX Femenil)")
st.write("Sube el PDF del Informe Arbitral para procesarlo y analizarlo.")

# =========================
# Helpers
# =========================
def parse_minuto(s: str) -> int:
    if not s: return -1
    s = s.strip()
    if "+" in s:
        try:
            a, b = s.split("+", 1)
            return int(a) + int(b)
        except Exception:
            return -1
    try:
        return int(s)
    except Exception:
        return -1

def clean_name(s: str) -> str:
    if s is None: return ""
    s = s.replace("\n", " ")
    return " ".join(s.split()).strip()

def norm(s: str) -> str:
    return re.sub(r"\s+", " ", unidecode(s or "").strip().lower())

def normalize_formation(s: str) -> str:
    if not s: return s
    s = s.replace(" ", "")
    if not s.startswith("1-"):
        s = "1-" + s
    return s

# =========================
# Equipos
# =========================
TEAM_CANONICAL = [
    "america","atlas","atletico san luis","chivas","cruz azul","juarez","leon","mazatlan",
    "necaxa","pachuca","puebla","pumas","queretaro","rayadas","santos","tigres","tijuana","toluca"
]
TEAM_ALIASES = {
    "america": ["america", "club america"],
    "atlas": ["atlas"],
    "atletico san luis": ["atletico san luis","atlético san luis","san luis"],
    "chivas": ["chivas","guadalajara"],
    "cruz azul": ["cruz azul","cd cruz azul","club cruz azul"],
    "juarez": ["juarez","fc juarez","bravas"],
    "leon": ["leon","club leon"],
    "mazatlan": ["mazatlan","mazatlan fc"],
    "necaxa": ["necaxa"],
    "pachuca": ["pachuca","tuzas","cf pachuca"],
    "puebla": ["puebla","club puebla"],
    "pumas": ["pumas","universidad","unam","universidad nacional"],
    "queretaro": ["queretaro","querétaro","gallos"],
    "rayadas": ["rayadas","monterrey femenil","cf monterrey femenil","monterrey"],
    "santos": ["santos","santos laguna"],
    "tigres": ["tigres","tigres uanl","uanl"],
    "tijuana": ["tijuana","xolas"],
    "toluca": ["toluca"]
}
PRETTY = {t: t.title() for t in TEAM_CANONICAL}
PRETTY.update({
    "america":"América","atletico san luis":"Atlético San Luis","cruz azul":"Cruz Azul",
    "juarez":"Juárez","leon":"León","mazatlan":"Mazatlán","puebla":"Puebla",
    "pumas":"Pumas","queretaro":"Querétaro","rayadas":"Rayadas"
})

def canon_to_pretty(c): return PRETTY.get(c, c.title())

def alias_to_canon(token: str) -> str | None:
    t = norm(token)
    for canon, aliases in TEAM_ALIASES.items():
        for al in aliases:
            na = norm(al)
            if na in t or t in na:
                return canon
    return None

def detect_match_teams(full_text: str) -> list[str]:
    if not full_text: return []
    txt = unidecode(full_text)
    flat = norm(txt)

    pat = re.compile(r"([A-Za-zÁÉÍÓÚÜÑñ\.\s]+?)\s*(?:vs\.?|v|contra|—|-)\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)", re.IGNORECASE)
    m = pat.search(txt)
    found = set()
    if m:
        ca, cb = alias_to_canon(m.group(1)), alias_to_canon(m.group(2))
        if ca: found.add(ca)
        if cb: found.add(cb)
        if len(found)==2: return list(found)

    for patl in [r"local\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)", r"equipo\s*local\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)"]:
        ml = re.search(patl, txt, flags=re.IGNORECASE)
        if ml:
            c = alias_to_canon(ml.group(1))
            if c: found.add(c)
    for patv in [r"visitante\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)", r"equipo\s*visitante\s*:\s*([A-Za-zÁÉÍÓÚÜÑñ\.\s]+)"]:
        mv = re.search(patv, txt, flags=re.IGNORECASE)
        if mv:
            c = alias_to_canon(mv.group(1))
            if c: found.add(c)
    if len(found)==2: return list(found)

    hits=[]
    for canon, aliases in TEAM_ALIASES.items():
        for al in aliases:
            if norm(al) in flat:
                hits.append(canon); break
    if hits:
        order = [t for t,_ in Counter(hits).most_common()]
        out=[]
        for t in order:
            if t not in out: out.append(t)
        return out[:2]
    return []

# =========================
# Sidebar
# =========================
st.sidebar.header("Parámetros")
ventana_min = st.sidebar.number_input("Ventana post-cambio (min)", 5, 30, 10, 1)

# =========================
# Cargador PDF
# =========================
uploaded_file = st.file_uploader("Subir PDF", type=["pdf"])

if uploaded_file is not None:
    st.success(f"Archivo subido: {uploaded_file.name}")
    try:
        with pdfplumber.open(uploaded_file) as pdf:
            pages = len(pdf.pages)
            all_text = "\n".join([p.extract_text() or "" for p in pdf.pages])
            default_page = 2 if pages>=2 else 1
            page_to_read = st.number_input("¿Qué página quieres leer para extraer eventos?", 1, pages, default_page, 1)
            raw_text = pdf.pages[page_to_read-1].extract_text() or ""

        if raw_text.strip():
            st.subheader("Texto extraído (página seleccionada)")
            st.text_area("Contenido", unidecode(raw_text), height=220)
        else:
            st.warning("No se detectó texto en esa página (puede ser escaneado).")

        teams_detected = detect_match_teams(all_text)
        st.caption("Equipos detectados: " + ", ".join([canon_to_pretty(t) for t in teams_detected]) if teams_detected else "(no detectados)")
        suggest_my = "pumas" if "pumas" in teams_detected else (teams_detected[0] if teams_detected else "pumas")

        my_team_canon = st.selectbox("Selecciona tu equipo en este partido", TEAM_CANONICAL,
                                     index=TEAM_CANONICAL.index(suggest_my) if suggest_my in TEAM_CANONICAL else TEAM_CANONICAL.index("pumas"),
                                     format_func=canon_to_pretty)
        opp = None
        for t in teams_detected:
            if t != my_team_canon: opp = t; break
        opp_team = st.text_input("Equipo rival (auto si fue detectado; editable)", value=canon_to_pretty(opp) if opp else "") or "Rival"

        my_team = canon_to_pretty(my_team_canon)
        st.caption(f"Usaremos etiquetas: **{my_team}** / **{opp_team}**")

        # =========================
        # Regex & extracción (página seleccionada)
        # =========================
        norm_text = re.sub(r"\s+", " ", raw_text or "").strip()

        GOL = re.compile(r"Gol de\s*\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+Min:\s*(\d+(?:\+\d+)?)", re.IGNORECASE)
        TARJ = re.compile(r"(Amarilla|Roja(?:\s*\(.*?\))?|Roja\s*Directa)\s*de\s*\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+Min:\s*(\d+(?:\+\d+)?)", re.IGNORECASE)
        SUB = re.compile(r"\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+por\s+\((\d+)\)\s+((?:(?!\bMin:).)+?)\s+Min:\s*(\d+(?:\+\d+)?)", re.IGNORECASE)

        goles, tarjetas, subs, timeline = [], [], [], []
        i, N = 0, len(norm_text); order=0
        while i<N:
            mg, mt, ms = GOL.search(norm_text, i), TARJ.search(norm_text, i), SUB.search(norm_text, i)
            cand=[]
            if mg: cand.append(("G", mg.start(), mg))
            if mt: cand.append(("T", mt.start(), mt))
            if ms: cand.append(("S", ms.start(), ms))
            if not cand: break
            kind, _, m = sorted(cand, key=lambda x:x[1])[0]
            if kind=="G":
                dorsal, nombre, minuto_txt = m.group(1), clean_name(m.group(2)).replace("Min:","").strip(), m.group(3)
                minuto = parse_minuto(minuto_txt)
                goles.append({"dorsal":dorsal,"jugadora":nombre,"minuto_txt":minuto_txt,"minuto":minuto})
                timeline.append({"order":order,"minuto":minuto,"minuto_txt":minuto_txt,"evento":"Gol","detalle":f"({dorsal}) {nombre}"})
            elif kind=="T":
                tipo, dorsal, nombre, minuto_txt = clean_name(m.group(1)), m.group(2), clean_name(m.group(3)).replace("Min:","").strip(), m.group(4)
                minuto = parse_minuto(minuto_txt)
                tarjetas.append({"tipo":tipo,"dorsal":dorsal,"jugadora":nombre,"minuto_txt":minuto_txt,"minuto":minuto})
                timeline.append({"order":order,"minuto":minuto,"minuto_txt":minuto_txt,"evento":f"Tarjeta {tipo}","detalle":f"({dorsal}) {nombre}"})
            else:
                sale_d, sale_n, entra_d, entra_n, minuto_txt = m.group(1), clean_name(m.group(2)).replace("Min:","").strip(), m.group(3), clean_name(m.group(4)).replace("Min:","").strip(), m.group(5)
                minuto = parse_minuto(minuto_txt)
                subs.append({"entra_dorsal":entra_d,"entra":entra_n,"sale_dorsal":sale_d,"sale":sale_n,"minuto_txt":minuto_txt,"minuto":minuto})
                timeline.append({"order":order,"minuto":minuto,"minuto_txt":minuto_txt,"evento":"Sustitución","detalle":f"Entra ({entra_d}) {entra_n} por ({sale_d}) {sale_n}"})
            order += 1
            i = m.end()

        df_goles = pd.DataFrame(goles).sort_values("minuto") if goles else pd.DataFrame(columns=["dorsal","jugadora","minuto_txt","minuto"])
        df_subs  = pd.DataFrame(subs )[["entra_dorsal","entra","sale_dorsal","sale","minuto_txt","minuto"]].sort_values("minuto") if subs else pd.DataFrame(columns=["entra_dorsal","entra","sale_dorsal","sale","minuto_txt","minuto"])
        df_tj    = pd.DataFrame(tarjetas).sort_values(["minuto","tipo"]) if tarjetas else pd.DataFrame(columns=["tipo","dorsal","jugadora","minuto_txt","minuto"])
        df_tl    = pd.DataFrame(timeline)[["minuto","minuto_txt","evento","detalle","order"]].sort_values(["minuto","order"]) if timeline else pd.DataFrame(columns=["minuto","minuto_txt","evento","detalle","order"])

        # =========================
        # Equipo en goles y cambios
        # =========================
        st.divider()
        st.subheader("Asignar equipos a los eventos")

        if not df_goles.empty:
            goal_labels = [f"{i+1}. {r['minuto_txt']} — {r['jugadora']} ({r['dorsal']})" for i,r in df_goles.reset_index(drop=True).iterrows()]
            idx_g = list(range(len(goal_labels)))
            goles_opp_idx = st.multiselect(f"Goles de **{opp_team}** (los no seleccionados serán de {my_team})", idx_g, default=[], format_func=lambda i: goal_labels[i])
            autogoles_idx = st.multiselect("¿Autogoles? marca los que lo sean", idx_g, default=[], format_func=lambda i: goal_labels[i])
            df_goles_edit = df_goles.copy().reset_index(drop=True)
            df_goles_edit["equipo"]   = [opp_team if i in goles_opp_idx else my_team for i in idx_g]
            df_goles_edit["autogol"]  = [i in autogoles_idx for i in idx_g]
            st.dataframe(df_goles_edit, use_container_width=True, hide_index=True)
        else:
            df_goles_edit = df_goles
            st.info("No se detectaron goles.")

        if not df_subs.empty:
            sub_labels = [f"{i+1}. Min {r['minuto']} — Entra {r['entra']} por {r['sale']}" for i,r in df_subs.reset_index(drop=True).iterrows()]
            idx_s = list(range(len(sub_labels)))
            subs_opp_idx = st.multiselect(f"Sustituciones de **{opp_team}** (las no seleccionadas serán de {my_team})", idx_s, default=[], format_func=lambda i: sub_labels[i])
            df_subs_edit = df_subs.copy().reset_index(drop=True)
            df_subs_edit["equipo"] = [opp_team if i in subs_opp_idx else my_team for i in idx_s]
            st.dataframe(df_subs_edit, use_container_width=True, hide_index=True)
        else:
            df_subs_edit = df_subs
            st.info("No se detectaron sustituciones.")

        # =========================
# Anotaciones tácticas (Editor con 2 menús dependientes)
# =========================
st.divider()
st.subheader("Sustituciones + Anotaciones tácticas")

if df_subs_edit.empty:
    st.info("No hay sustituciones para anotar.")
else:
    # --- Opciones ---
    FORMACIONES = [
        "1-4-4-2 (doble contención)","1-4-4-2 (diamante)","1-4-3-3","1-4-2-3-1",
        "1-3-5-2","1-5-3-2","1-5-4-1","Otro"
    ]

    INT_CATS = {
        "Estratégicas / de planteamiento":[
            "Presionar","Todo al ataque","Contener","Cerrar marcador","Cambio de sistema","Ajuste posicional",
            "Más control de balón","Repliegue defensivo","Para buscar transiciones"
        ],
        "Contexto del marcador y tiempo":[
            "Remontar","Mantener empate","Ganar tiempo","Último esfuerzo"
        ],
        "Condicionantes físicas":[
            "Fatiga","Lesión","Recuperación programada"
        ],
        "Desarrollo individual":[
            "Dar minutos","Probar variante","Dar confianza"
        ],
        "Situaciones específicas":[
            "Especialista ABP","Cambio defensivo puntual","Cambio ofensivo puntual","Ajuste por expulsión","Precaución por amonestación"
        ],
        "Otro":["Otro"]
    }
    ALL_INTENT_OPTIONS = sorted({opt for arr in INT_CATS.values() for opt in arr})

    # --- Construir una firma (hash simple) de las subs para no reconstruir en cada rerun ---
    base_now = df_subs_edit[["minuto","entra","sale","equipo"]].copy().sort_values(["minuto","entra","sale","equipo"])
    sig_now = "|".join(base_now.astype(str).agg("||".join, axis=1))  # firma simple

    key_table = "tabla_anotaciones_v4"
    key_sig   = "anot_sig"

    if key_table not in st.session_state or st.session_state.get(key_sig, "") != sig_now:
        # Crear tabla inicial o reconstruir si cambiaron las subs (otro PDF, etc.)
        base = df_subs_edit[["minuto","entra","sale","equipo"]].copy()
        base["formacion_antes"]   = ""
        base["formacion_despues"] = ""
        # Menú 1 (categoría) y Menú 2 (opción dependiente)
        base["intencion_categoria"] = ""
        base["intencion_tactica"]   = ""
        base["intencion_otro"]      = ""
        st.session_state[key_table] = base
        st.session_state[key_sig]   = sig_now
    else:
        # Alinear filas por si se alteró el orden; no borrar elecciones
        current = st.session_state[key_table]
        # merge para respetar lo ya capturado
        merged = df_subs_edit[["minuto","entra","sale","equipo"]].merge(
            current.drop_duplicates(subset=["minuto","entra","sale","equipo"]),
            on=["minuto","entra","sale","equipo"], how="left"
        )
        for col in ["formacion_antes","formacion_despues","intencion_categoria","intencion_tactica","intencion_otro"]:
            if col not in merged.columns: merged[col] = ""
            merged[col] = merged[col].fillna("")
        st.session_state[key_table] = merged

    # Editor
    edited = st.data_editor(
        st.session_state[key_table],
        key="anot_editor",
        use_container_width=True,
        hide_index=True,
        num_rows="fixed",  # evita que cambie cantidad de filas y “salte”
        column_config={
            "formacion_antes": st.column_config.SelectboxColumn(
                "formacion_antes", options=[""]+FORMACIONES, help="Siempre con portera: 1-…"
            ),
            "formacion_despues": st.column_config.SelectboxColumn(
                "formacion_despues", options=[""]+FORMACIONES
            ),
            # Menú 1: categoría principal
            "intencion_categoria": st.column_config.SelectboxColumn(
                "intencion_categoria", options=[""]+list(INT_CATS.keys()),
                help="Primero elige la categoría…"
            ),
            # Menú 2: opción específica (listado completo, validamos abajo)
            "intencion_tactica": st.column_config.SelectboxColumn(
                "intencion_tactica", options=[""]+ALL_INTENT_OPTIONS,
                help="…luego la intención específica."
            ),
            "intencion_otro": st.column_config.TextColumn(
                "Otro (especifica)", help="Se usa si elegiste 'Otro'."
            ),
        }
    )

    # --- Validación dependiente (si cambia categoría, forzamos coherencia con su set) ---
    def _belongs(cat, opt):
        if not cat or not opt: return True
        valid = set(INT_CATS.get(cat, []))
        return (opt in valid) or (opt == "Otro")

    # Limpiar inconsistencias y avisar al usuario
    warnings = []
    for idx, row in edited.iterrows():
        cat = row.get("intencion_categoria","")
        opt = row.get("intencion_tactica","")
        if cat and opt and not _belongs(cat, opt):
            # Si cambiaste de categoría y la opción ya no corresponde, la vaciamos
            edited.at[idx, "intencion_tactica"] = ""
            warnings.append(f"Min {int(row['minuto'])}: la intención '{opt}' no pertenece a la categoría '{cat}'. Selección reasignada.")

        # Si eligió "Otro" y no escribió detalle, sugerimos
        if row.get("intencion_tactica","") == "Otro" and not str(row.get("intencion_otro","")).strip():
            warnings.append(f"Min {int(row['minuto'])}: elegiste 'Otro'. Escribe el detalle en la columna de texto.")

    if warnings:
        st.info("⚠️ Revisiones en tus selecciones:\n- " + "\n- ".join(warnings))

    # Guardar tabla limpia
    st.session_state[key_table] = edited.copy()

    # Exponer vista ordenada (opcional)
    st.dataframe(
        edited.sort_values("minuto"),
        use_container_width=True, hide_index=True
    )

    # Mantener un alias que usemos después en impacto
    df_subs_with_notes = edited.copy()
            )

        # =========================
        # Eventos base
        # =========================
        st.divider()
        st.subheader("Eventos detectados (base)")
        c1,c2,c3 = st.columns(3)
        with c1:
            st.write("**Sustituciones (base)**")
            st.dataframe(df_subs, use_container_width=True, hide_index=True)
        with c2:
            st.write("**Goles (base)**")
            st.dataframe(df_goles, use_container_width=True, hide_index=True)
        with c3:
            st.write("**Tarjetas**")
            st.dataframe(df_tj, use_container_width=True, hide_index=True)

        st.caption(f"Resumen — Sustituciones: {len(df_subs)} | Goles: {len(df_goles)} | Tarjetas: {len(df_tj)}")

        st.subheader("Línea de tiempo")
        if not df_tl.empty:
            st.dataframe(df_tl.drop(columns=["order"]), use_container_width=True, hide_index=True)
        else:
            st.info("No se detectaron eventos para la línea de tiempo.")

        # =========================
        # Impacto (de mi equipo)
        # =========================
        st.divider()
        st.subheader("Marcador al momento del cambio e impacto")

        def build_score_series(goals_df: pd.DataFrame, team_a: str, team_b: str):
            if goals_df.empty or "equipo" not in goals_df.columns: return []
            g = goals_df.sort_values("minuto").reset_index(drop=True)
            series=[]; a=b=0
            for _,row in g.iterrows():
                if row["equipo"]==team_a: a+=1
                elif row["equipo"]==team_b: b+=1
                series.append((int(row["minuto"]), a, b))
            return series

        def score_at(series, t: int):
            a=b=0
            for m,sa,sb in series:
                if m<=t: a,b=sa,sb
                else: break
            return a,b

        def puntos(my, opp):
            if my>opp: return 3
            if my==opp: return 1
            return 0

        score_series = build_score_series(df_goles_edit, my_team, opp_team)
        my_final=opp_final=0
        if score_series:
            my_final, opp_final = score_series[-1][1], score_series[-1][2]
        puntos_finales = puntos(my_final, opp_final)

        impacto_rows=[]
        if not df_subs_edit.empty:
            merged = df_subs_edit.merge(
                df_subs_with_notes if 'df_subs_with_notes' in locals() else df_subs_edit.assign(
                    formacion_antes="",formacion_despues="",intencion_label="",intencion_otro=""),
                on=["minuto","entra","sale","equipo"], how="left"
            )
            subs_my = merged[merged["equipo"]==my_team].copy().reset_index(drop=True)

            for _, row in subs_my.iterrows():
                t = int(row["minuto"]); w_end = t + int(ventana_min)
                my_t, opp_t = score_at(score_series, t)
                pm = puntos(my_t, opp_t)
                game_state = "Ganando" if my_t>opp_t else ("Perdiendo" if my_t<opp_t else "Empatando")

                pf = puntos_finales
                if pm==0 and pf==3: etiqueta="IMPACTO MUY POSITIVO"
                elif pm==0 and pf==1: etiqueta="IMPACTO MEDIO"
                elif pm==0 and pf==0: etiqueta="IMPACTO NEUTRO"
                elif pm==1 and pf==3: etiqueta="IMPACTO POSITIVO"
                elif pm==1 and pf==1: etiqueta="IMPACTO NEUTRO"
                elif pm==1 and pf==0: etiqueta="IMPACTO NEGATIVO"
                elif pm==3 and pf==3: etiqueta="IMPACTO NEUTRO"
                elif pm==3 and pf==1: etiqueta="IMPACTO NEGATIVO"
                elif pm==3 and pf==0: etiqueta="IMPACTO MUY NEGATIVO"
                else: etiqueta="IMPACTO (revisar)"

                my_post=opp_post=0
                for _,g in df_goles_edit.iterrows():
                    gm=int(g["minuto"])
                    if t<gm<=w_end:
                        if g["equipo"]==my_team: my_post+=1
                        elif g["equipo"]==opp_team: opp_post+=1

                it_label = row.get("intencion_label","")
                it_cat, it_val = ("","")
                if it_label and " · " in it_label:
                    it_cat, it_val = it_label.split(" · ",1)
                else:
                    it_val = it_label or ""
                if it_val=="Otro": it_val = row.get("intencion_otro","Otro")

                impacto_rows.append({
                    "minuto_cambio": t,
                    "entra": row["entra"],
                    "sale": row["sale"],
                    "equipo_cambio": my_team,
                    "formacion_antes": row.get("formacion_antes",""),
                    "formacion_despues": row.get("formacion_despues",""),
                    "intencion_categoria": it_cat,
                    "intencion_tactica": it_val,
                    "marcador_momento": f"{my_t}-{opp_t}",
                    "game_state": game_state,
                    "puntos_momento": pm,
                    "puntos_finales": pf,
                    "delta_puntos": pf-pm,
                    "etiqueta_impacto_puntos": etiqueta,
                    "ventana_min": ventana_min,
                    "goles_mi_equipo_post": my_post,
                    "goles_rival_post": opp_post,
                    "impacto_ventana": my_post-opp_post
                })

        cols = ["minuto_cambio","entra","sale","equipo_cambio",
                "formacion_antes","formacion_despues","intencion_categoria","intencion_tactica",
                "marcador_momento","game_state","puntos_momento","puntos_finales",
                "delta_puntos","etiqueta_impacto_puntos",
                "ventana_min","goles_mi_equipo_post","goles_rival_post","impacto_ventana"]
        df_impacto = pd.DataFrame(impacto_rows)[cols] if impacto_rows else pd.DataFrame(columns=cols)

        if not df_impacto.empty:
            st.dataframe(df_impacto.sort_values("minuto_cambio"), use_container_width=True, hide_index=True)
        else:
            st.info("Completa las **anotaciones** y la asignación de equipos para ver el impacto.")

        # =========================
        # Gráfico: distribución de intenciones tácticas (Donut + Barra)
        # =========================
        st.divider()
        st.subheader("Gráfico de intenciones tácticas")

        tabla_key = "tabla_anotaciones_v3"
        if tabla_key not in st.session_state or st.session_state[tabla_key].empty:
            st.info("Primero captura intenciones tácticas en la tabla de 'Sustituciones + Anotaciones tácticas'.")
        else:
            df_notes = st.session_state[tabla_key].copy()

            # Colores Pumas
            OBSIDIAN   = "#0F1A2B"
            CLUB_GOLD  = "#E8BE83"
            PALETTE = [OBSIDIAN, CLUB_GOLD, "#1C2A40", "#F1D3A6", "#0B1322", "#D6A86A", "#24344F", "#C99758"]

            def split_label(lbl: str):
                if not isinstance(lbl, str) or not lbl.strip():
                    return ("", "")
                if " · " in lbl:
                    cat, val = lbl.split(" · ", 1)
                    return (cat.strip(), val.strip())
                return ("", lbl.strip())

            tmp = df_notes.copy()
            tmp["cat"], tmp["intencion"] = zip(*tmp["intencion_label"].apply(split_label))
            tmp["intencion"] = tmp.apply(
                lambda r: (r["intencion_otro"].strip() if isinstance(r["intencion_otro"], str) and r["intencion"].lower()=="otro" else r["intencion"]),
                axis=1
            )

            colf1, colf2, colf3 = st.columns(3)
            with colf1:
                filtro_equipo = st.selectbox("Equipo", options=["Todos", my_team, opp_team], index=0)
            with colf2:
                nivel = st.radio("Agrupar por", options=["Categoría", "Intención"], horizontal=True, index=1)
            with colf3:
                min_count = st.number_input("Mín. ocurrencias para mostrar", min_value=1, max_value=10, value=1, step=1)

            if filtro_equipo != "Todos":
                tmp = tmp[tmp["equipo"] == filtro_equipo]

            if nivel == "Categoría":
                serie = tmp["cat"].value_counts()
                titulo = f"Intenciones tácticas por categoría — {filtro_equipo}"
            else:
                serie = tmp["intencion"].value_counts()
                titulo = f"Intenciones tácticas — {filtro_equipo}"

            serie = serie[serie >= min_count]

            if serie.empty:
                st.info("Sin datos suficientes para graficar con los filtros actuales.")
            else:
                labels = list(serie.index)
                counts = list(serie.values)
                colors = (PALETTE * ((len(labels)//len(PALETTE))+1))[:len(labels)]

                c1, c2 = st.columns(2)

                # Donut
                with c1:
                    fig, ax = plt.subplots(figsize=(5.5, 5.5))
                    wedges, texts = ax.pie(counts, labels=None, startangle=90, colors=colors, wedgeprops={"linewidth": 1, "edgecolor": "white"})
                    centre_circle = plt.Circle((0, 0), 0.60, fc="white")
                    fig.gca().add_artist(centre_circle)
                    ax.set_title(titulo, fontsize=12)
                    ax.legend(wedges, [f"{l} ({c})" for l, c in zip(labels, counts)], loc="center left", bbox_to_anchor=(1, 0.5))
                    st.pyplot(fig, clear_figure=True)

                # Barra horizontal
                with c2:
                    fig2, ax2 = plt.subplots(figsize=(6.5, 5.5))
                    y_pos = list(range(len(labels)))[::-1]
                    ax2.barh(y_pos, counts[::-1], color=colors[::-1])
                    ax2.set_yticks(y_pos)
                    ax2.set_yticklabels(labels[::-1])
                    ax2.set_xlabel("Ocurrencias")
                    ax2.set_title("Distribución (barra)")
                    for i, v in enumerate(counts[::-1]):
                        ax2.text(v + 0.05, i, str(v), va="center")
                    st.pyplot(fig2, clear_figure=True)

    except Exception as e:
        st.error(f"No se pudo leer o procesar el PDF. Detalle técnico: {e}")
else:
    st.info("⬆️ Arriba puedes subir el PDF del Informe Arbitral.")
