import { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Legend, ComposedChart
} from "recharts";

// ═══════════════════════════════════════════════════════════════
// PALETA
// ═══════════════════════════════════════════════════════════════
const C = {
  navy:"#021B3A", navyL:"#0A2E5A", navyM:"#062347",
  gold:"#C8973A", goldL:"#E8B84B", goldD:"#9B6E20",
  cream:"#F5F0E8", gray:"#7A8A9A", grayL:"#B0BCC8",
  green:"#2E7D32", greenL:"#66BB6A",
  red:"#B71C1C", redL:"#EF5350",
  blue:"#1565C0", blueL:"#42A5F5",
  white:"#FFFFFF",
};
const POS_COLOR = { G:"#37474F", D:"#1565C0", M:"#2E7D32", F:"#B71C1C", "?":"#6D4C41" };

// ═══════════════════════════════════════════════════════════════
// DATOS
// ═══════════════════════════════════════════════════════════════
const DATA = {
  "Toluca": {
    torneo: "Clausura 2026 · J1–J10",
    status: "real",
    record: { G:7, E:1, P:2, pts:22, pj:10, gf:22, gc:11 },
    local:  { G:4, E:1, P:1, pts:13, pj:6,  gf:16, gc:8 },
    visita: { G:3, E:0, P:1, pts:9,  pj:4,  gf:6,  gc:3 },
    primeGol: { favor:"6V 0E 0D (100%)", contra:"1V 1E 2D" },
    minPGF: 40, minPGC: 28,
    subsPorPartido: 4.4,
    formaciones: [
      { form:"1-4-2-3-1", pj:4, v:3, e:0, d:1, pts:9, gf:9, gc:4, contexto:"vs Atlas, Juárez, San Luis (rivales menores)" },
      { form:"1-4-1-4-1", pj:4, v:2, e:1, d:1, pts:7, gf:8, gc:6, contexto:"vs Tijuana, Tigres, Pachuca (rivales exigentes)" },
    ],
    gamestates: {
      global: { gan:35.6, emp:46.3, per:18.1 },
      local:  { gan:38,   emp:42,   per:19   },
      visita: { gan:31,   emp:52,   per:16   },
    },
    franjasSubs: [
      { franja:"1-30'",  n:4,  imp:0.50 },
      { franja:"31-45'", n:2,  imp:1.50 },
      { franja:"46-60'", n:19, imp:0.95 },
      { franja:"61-75'", n:13, imp:0.46 },
      { franja:"76-90'", n:6,  imp:-0.17 },
    ],
    heatmap: [
      { tipo:"Ofensivo",  gan:{n:1,imp:0.00}, emp:{n:8, imp:1.75}, per:{n:5,imp:0.20} },
      { tipo:"Medio",     gan:{n:7,imp:0.00}, emp:{n:10,imp:0.90}, per:{n:2,imp:0.50} },
      { tipo:"Defensivo", gan:{n:7,imp:0.00}, emp:{n:1, imp:2.00}, per:{n:3,imp:0.33} },
    ],
    franjasGoles: [
      { f:"1-15'",  gf:3, gc:2, pumGF:0, pumGC:3 },
      { f:"16-30'", gf:1, gc:0, pumGF:3, pumGC:2 },
      { f:"31-45'", gf:3, gc:5, pumGF:6, pumGC:4 },
      { f:"46-60'", gf:4, gc:1, pumGF:2, pumGC:1 },
      { f:"61-75'", gf:4, gc:0, pumGF:1, pumGC:1 },
      { f:"76-90'", gf:7, gc:3, pumGF:1, pumGC:4 },
    ],
    banco: [
      { n:"Itzel Muñoz",    p:"F", ent:2, impT:4, impP:2.00, rat:7.75, gs:"Empatando" },
      { n:"Cinthya Peraza", p:"M", ent:4, impT:6, impP:1.50, rat:7.35, gs:"Empatando" },
      { n:"Mariel Román",   p:"F", ent:5, impT:4, impP:0.80, rat:7.08, gs:"Todos" },
      { n:"Faustine Robert",p:"M", ent:3, impT:2, impP:0.67, rat:7.30, gs:"Emp/Per" },
      { n:"Abby Erceg",     p:"D", ent:2, impT:3, impP:1.50, rat:6.65, gs:"Emp/Per" },
    ],
    xi: [
      { n:"Valeria Martínez",      p:"G", pj:"6/6", rat:7.03, nota:"Intocable · mejor momento del torneo" },
      { n:"Liliana Fernández",     p:"D", pj:"6/6", rat:7.06, nota:"Única de campo 10/10" },
      { n:"Karla Martínez",        p:"D", pj:"4/6", rat:6.63, nota:"" },
      { n:"Mitsy N. Ramírez Lara", p:"D", pj:"4/6", rat:6.42, nota:"" },
      { n:"Yaneisy Rodríguez",     p:"D", pj:"4/6", rat:6.38, nota:"⚑ Sale empatando → entra delantera" },
      { n:"Amandine Henry",        p:"M", pj:"6/6", rat:6.92, nota:"Pivote · nunca sale · peor racha del torneo" },
      { n:"Betzy C. Cuevas",       p:"M", pj:"6/6", rat:6.93, nota:"Pivote doble con Henry" },
      { n:"Deneisha Blackwood",    p:"M", pj:"5/6", rat:7.38, nota:"Primera en salir al cerrar partido" },
      { n:"Sofia Jakobsson",       p:"M", pj:"2/6", rat:7.85, nota:"⚠ Irrupción J9-J10 · incertidumbre táctica" },
      { n:"Eugénie Le Sommer",     p:"F", pj:"5/6", rat:8.26, nota:"Mejor del torneo · nunca sale" },
      { n:"Variable",              p:"?", pj:"—",   rat:null,  nota:"4a defensa o mediapunta" },
    ],
    forma: [
      { n:"Le Sommer",    p:"F", prev:8.42, ult:7.53, d:-0.88 },
      { n:"Peraza",       p:"M", prev:7.42, ult:6.97, d:-0.45 },
      { n:"Henry",        p:"M", prev:7.10, ult:6.57, d:-0.53 },
      { n:"Blackwood",    p:"M", prev:7.47, ult:7.07, d:-0.40 },
      { n:"Diana Guat.",  p:"D", prev:7.02, ult:6.67, d:-0.36 },
      { n:"M. Pavi",      p:"M", prev:6.80, ult:6.50, d:-0.30 },
      { n:"F. Robert",    p:"M", prev:7.16, ult:6.90, d:-0.26 },
      { n:"Betzy Cuevas", p:"M", prev:6.96, ult:6.83, d:-0.12 },
      { n:"Yaneisy R.",   p:"D", prev:6.55, ult:6.40, d:-0.15 },
      { n:"K. Martínez",  p:"D", prev:6.68, ult:6.57, d:-0.11 },
      { n:"L. Fernández", p:"D", prev:7.06, ult:7.07, d:+0.01 },
      { n:"Mitsy R.",     p:"D", prev:6.24, ult:6.40, d:+0.16 },
      { n:"Erceg",        p:"D", prev:6.83, ult:6.97, d:+0.13 },
      { n:"V. Martínez",  p:"G", prev:6.83, ult:7.50, d:+0.67 },
      { n:"Jakobsson*",   p:"M", prev:null, ult:7.85, d:null  },
    ],
    alertas: [
      "Toluca llega GANANDO al minuto 76 en los 10 partidos. Sin excepción.",
      "Cuando anota primero: 6V 0E 0D (100%). Cuando recibe primero: 1V 1E 2D.",
      "Franja 31-45': Pumas anota 6 GF y Toluca recibe 5 GC — cruce clave.",
    ],
    hallazgos: [
      "Yaneisy Rodríguez sale empatando en 3/5 salidas — señal táctica más predecible de Lair.",
      "Le Sommer y Peraza llegan en descenso de forma: −0.88 y −0.45 vs arranque del torneo.",
      "Amandine Henry en peor racha del torneo (6.57 prom. últimas 3J).",
      "Valeria Martínez en mejor momento del torneo (+0.67 en últimas 3J).",
      "Jakobsson: irrumpe en J9-J10 con 7.85 — mayor incertidumbre táctica.",
    ],
    notasSubs: [
      { tipo:"info", txt:"48% de los cambios ocurren en la franja 46-60' — los más tempranos de la liga analizada." },
      { tipo:"info", txt:"Lair hace dobles o triples cambios simultáneos al descanso cuando el marcador está igualado." },
      { tipo:"alerta", txt:"Ganando en cualquier tipo: impacto +0.00. El banco de Toluca conserva ventajas, no las amplía." },
    ],
    notasGoles: [
      { tipo:"alerta", txt:"Franja 31-45': Pumas anota 6 GF · Toluca recibe 5 GC — el cruce más relevante del análisis." },
      { tipo:"alerta", txt:"Franja 76-90': Toluca explota (7 GF) y Pumas recibe más (4 GC) — tramo de mayor peligro." },
      { tipo:"info", txt:"Toluca concedió solo 1 gol en la franja 46-75' — 30 minutos casi impermeables." },
      { tipo:"info", txt:"32% de los goles de Toluca llegan en los últimos 15 minutos." },
    ],
    notasLV: [
      { tipo:"info", txt:"Toluca rinde MEJOR de visita (2.25 pts/PJ) que de local (2.17 pts/PJ) — patrón inusual." },
      { tipo:"info", txt:"De visita empatando: +2.00 impacto promedio por cambio — su combinación más efectiva del torneo." },
      { tipo:"info", txt:"De local el banco es menos efectivo (+0.70 empatando). Los partidos en casa los resuelve el XI." },
      { tipo:"alerta", txt:"El partido contra Pumas es de LOCAL para Toluca. Lair viene al estadio Nemesio Díez a ganar desde el arranque." },
    ],
    notasBanco: [
      { tipo:"info", txt:"Cinthya Peraza y Itzel Muñoz rinden mejor de suplentes que de titulares." },
      { tipo:"info", txt:"Yaneisy Rodríguez sale empatando 3/5 veces — cuando sale, entra siempre un perfil ofensivo." },
    ],
    notasForma: [
      { tipo:"alerta", txt:"Le Sommer (−0.88) y Peraza (−0.45): las dos principales amenazas llegan en descenso." },
      { tipo:"alerta", txt:"Amandine Henry (−0.53): el pivote inamovible en su peor racha del torneo." },
      { tipo:"info", txt:"Valeria Martínez (+0.67): portera en mejor momento. Jakobsson (7.85): irrupción sin historial previo." },
    ],
  },

  "Tijuana": {
    torneo: "Clausura 2026 · J1–J11",
    status: "real",
    record: { G:4, E:3, P:4, pts:15, pj:11, gf:17, gc:18 },
    local:  { G:2, E:2, P:1, pts:8,  pj:5,  gf:7,  gc:4  },
    visita: { G:2, E:1, P:3, pts:7,  pj:6,  gf:10, gc:14 },
    primeGol: { favor:"2V 2E 1D (anota 34')", contra:"2V 0E 3D (recibe 22')" },
    minPGF: 34, minPGC: 22,
    subsPorPartido: 4.7,
    formaciones: [
      { form:"1-4-1-4-1", pj:7, v:3, e:2, d:2, pts:11, gf:11, gc:10, contexto:"Formación base · adversarios medios" },
      { form:"1-4-2-3-1", pj:2, v:1, e:1, d:0, pts:4,  gf:5,  gc:4,  contexto:"Vs rivales ofensivos" },
      { form:"1-5-4-1",   pj:1, v:0, e:1, d:0, pts:1,  gf:1,  gc:1,  contexto:"Bloque defensivo vs Cruz Azul" },
      { form:"1-4-1-3-2", pj:1, v:0, e:0, d:1, pts:0,  gf:3,  gc:5,  contexto:"J1 vs Toluca" },
    ],
    gamestates: {
      global: { gan:25.5, emp:44.6, per:29.9 },
      local:  { gan:32.2, emp:59.3, per:8.4  },
      visita: { gan:19.8, emp:32.4, per:47.8 },
    },
    franjasSubs: [
      { franja:"1-30'",  n:0,  imp:0.00  },
      { franja:"31-45'", n:3,  imp:-0.67 },
      { franja:"46-60'", n:8,  imp:0.62  },
      { franja:"61-75'", n:18, imp:0.11  },
      { franja:"76-90'", n:23, imp:0.48  },
    ],
    heatmap: [
      { tipo:"Ofensivo",  gan:{n:0,imp:0.00},  emp:{n:0,imp:0.00},  per:{n:3,imp:1.00} },
      { tipo:"Medio",     gan:{n:13,imp:-0.62}, emp:{n:13,imp:0.00}, per:{n:20,imp:1.05} },
      { tipo:"Defensivo", gan:{n:1,imp:0.00},  emp:{n:0,imp:0.00},  per:{n:2,imp:0.00} },
    ],
    franjasGoles: [
      { f:"1-15'",  gf:1, gc:3, pumGF:0, pumGC:3 },
      { f:"16-30'", gf:1, gc:2, pumGF:3, pumGC:2 },
      { f:"31-45'", gf:5, gc:1, pumGF:6, pumGC:4 },
      { f:"46-60'", gf:4, gc:2, pumGF:2, pumGC:1 },
      { f:"61-75'", gf:1, gc:4, pumGF:1, pumGC:1 },
      { f:"76-90'", gf:5, gc:6, pumGF:1, pumGC:4 },
    ],
    banco: [
      { n:"Roselord Borgella",     p:"F", ent:3, impT:5,  impP:1.67, rat:7.10, gs:"Empatando" },
      { n:"Naomi Rojo",            p:"M", ent:2, impT:3,  impP:1.50, rat:6.55, gs:"Ganando"   },
      { n:"Natividad Martínez",    p:"M", ent:3, impT:3,  impP:1.00, rat:6.50, gs:"Perdiendo" },
      { n:"Kassandra Ceja",        p:"F", ent:4, impT:3,  impP:0.75, rat:6.60, gs:"Ganando"   },
      { n:"Briana I. Chagolla",    p:"M", ent:5, impT:3,  impP:0.60, rat:6.74, gs:"Ganando"   },
      { n:"Claudia Ibarra",        p:"M", ent:5, impT:3,  impP:0.60, rat:6.36, gs:"Perdiendo" },
      { n:"Danielle Fuentes",      p:"M", ent:6, impT:1,  impP:0.17, rat:6.53, gs:"Perdiendo" },
      { n:"Bibiana Quintos",       p:"D", ent:6, impT:1,  impP:0.17, rat:6.43, gs:"Ganando"   },
    ],
    xi: [
      { n:"Ana Gaby Paz",                p:"G", pj:"10/11", rat:7.04, nota:"Titular indiscutida · en ascenso pronunciado (+0.60)" },
      { n:"Jazmín Enrigue",              p:"D", pj:"10/11", rat:6.93, nota:"En ascenso (+0.37) · lateral ofensiva" },
      { n:"Deisy Ojeda",                 p:"D", pj:" 9/11", rat:7.22, nota:"2.ª mejor del equipo · en caída (-0.75) · atacable" },
      { n:"Michel J. Fong Camargan",     p:"D", pj:"10/11", rat:6.59, nota:"Lateral fija · estable" },
      { n:"Laura Parra / B. Quintos",    p:"D", pj:" 6/11", rat:6.47, nota:"⚑ Quintos en explosión (+1.30) · puede disputar titularidad" },
      { n:"Amogelang Motau",             p:"M", pj:" 9/11", rat:6.79, nota:"Sale frecuentemente en 76-90'" },
      { n:"Daniela Carrandi",            p:"M", pj:" 9/11", rat:6.69, nota:"La que más sale (9x) · en ascenso (+0.32)" },
      { n:"Dana Sandoval",               p:"M", pj:" 9/11", rat:6.80, nota:"En ascenso (+0.22) · gana peso en el mediocampo" },
      { n:"Ammanda Marroquin",           p:"M", pj:" 8/11", rat:6.66, nota:"Sale y entra frecuentemente" },
      { n:"Danielle Fuentes",            p:"M", pj:" 5/11", rat:6.98, nota:"En ascenso (+0.20) · gana minutos" },
      { n:"Kader Hançar",                p:"F", pj:"10/11", rat:7.50, nota:"⭐ Mejor del torneo · 7.50 avg · en ascenso (+0.33)" },
    ],
    forma: [
      { n:"Bibiana Quintos",         p:"D", prev:6.30, ult:7.60, d:+1.30 },
      { n:"Ana Gaby Paz",            p:"G", prev:6.80, ult:7.40, d:+0.60 },
      { n:"Jazmín Enrigue",          p:"D", prev:6.78, ult:7.15, d:+0.37 },
      { n:"Kader Hançar",            p:"F", prev:7.40, ult:7.73, d:+0.33 },
      { n:"Daniela Carrandi",        p:"M", prev:6.58, ult:6.90, d:+0.32 },
      { n:"Dana Sandoval",           p:"M", prev:6.70, ult:6.92, d:+0.22 },
      { n:"Danielle Fuentes",        p:"M", prev:6.90, ult:7.10, d:+0.20 },
      { n:"M. J. Fong",              p:"D", prev:6.56, ult:6.67, d:+0.11 },
      { n:"A. Motau",                p:"M", prev:6.79, ult:6.80, d:+0.01 },
      { n:"C. Ibarra",               p:"M", prev:6.63, ult:6.70, d:+0.07 },
      { n:"Ammanda Marroquin",       p:"M", prev:6.72, ult:6.57, d:-0.15 },
      { n:"R. Borgella",             p:"F", prev:6.92, ult:6.50, d:-0.42 },
      { n:"Laura Parra",             p:"D", prev:6.73, ult:6.20, d:-0.53 },
      { n:"Deisy Ojeda",             p:"D", prev:7.50, ult:6.75, d:-0.75 },
      { n:"Karen Díaz",              p:"D", prev:6.87, ult:6.00, d:-0.87 },
    ],
    alertas: [
      "De visita PERDIENDO el 47.8% del tiempo — mayor vulnerabilidad · Pumas recibe en CU.",
      "Anota primero: 2V 2E 1D. Recibe primero: 2V 0E 3D — depende del primer gol.",
      "Franja 31-45': Pumas anota 6 GF y Tijuana recibe 1 GC — cruce clave del análisis.",
    ],
    hallazgos: [
      "96% cambios tipo Medio — Samayoa no redefine planteamiento con el marcador en contra.",
      "Solo 3 cambios ofensivos en 11 PJ — menor intención ofensiva del torneo analizado.",
      "Kassandra Ceja entra GANANDO (4x): señal clara de cierre de partido.",
      "Deisy Ojeda: 2.ª mejor rating pero en caída (-0.75 últimas 4J) — momento de atacarla.",
      "Bibiana Quintos: explosión de forma (+1.30) — puede disputar titularidad a Laura Parra.",
      "Daniela Carrandi: la que más sale (9x) · siempre en 61-90' en los tres gamestates.",
      "PERDIENDO Medio: +1.05 imp — reacciona tarde pero remonta con frecuencia.",
      "Inglis Hernández y Bibiana Quintos defensivas: -0.40 imp cada una — banco defensivo ineficaz.",
    ],
    notasSubs: [
      { tipo:"info",   txt:"49% de los cambios ocurren en los últimos 15 minutos — el DT más tardío del torneo." },
      { tipo:"info",   txt:"Solo 3 cambios ofensivos en 11 PJ — el planteamiento no cambia con el marcador en contra." },
      { tipo:"alerta", txt:"GANANDO hace cambios con impacto negativo (−0.62): saca a sus mejores y el equipo se vuelve vulnerable." },
    ],
    notasGoles: [
      { tipo:"alerta", txt:"Franja 31-45': Pumas anota 6 GF · Tijuana recibe 1 GC — la ventana más favorable del análisis." },
      { tipo:"alerta", txt:"Franja 1-15': Tijuana concede 3 GC — arranques lentos, presionar desde el primer minuto." },
      { tipo:"info",   txt:"Franja 76-90': ambos equipos abren el partido — Tijuana anota 5 pero también recibe 6." },
    ],
    notasLV: [
      { tipo:"info",   txt:"De local: 1.60 pts/PJ · GF:7 GC:4 · domina EMPATANDO (59.3%) — sólido pero sin ambición." },
      { tipo:"alerta", txt:"De visita: 1.17 pts/PJ · GF:10 GC:14 · PERDIENDO el 47.8% del tiempo — muy permeable." },
      { tipo:"info",   txt:"El J12 es DE VISITA para Tijuana en Ciudad Universitaria — su peor condición." },
    ],
    notasBanco: [
      { tipo:"info",   txt:"Roselord Borgella: referente del banco · entra empatando y genera victoria (1.67 imp/entrada)." },
      { tipo:"info",   txt:"Naomi Rojo y Natividad Martínez: +1.50 y +1.00 imp promedio — entran en momentos decisivos." },
      { tipo:"alerta", txt:"Kassandra Ceja entra GANANDO (4x): señal de que Samayoa quiere cerrar el partido." },
    ],
    notasForma: [
      { tipo:"alerta", txt:"Deisy Ojeda (-0.75) y Karen Díaz (-0.87): defensoras en caída — línea trasera atacable." },
      { tipo:"info",   txt:"Bibiana Quintos (+1.30) y Ana Gaby Paz (+0.60): el bloque defensivo llega a su mejor momento." },
      { tipo:"info",   txt:"Kader Hançar (+0.33) y Jazmín Enrigue (+0.37): la amenaza principal llega en ascenso." },
    ],
  },

  "Tigres UANL": {
    torneo: "Clausura 2026 · J1–J10",
    status: "real",
    record: { G:6, E:3, P:1, pts:21, pj:10, gf:22, gc:9 },
    local:  { G:3, E:0, P:1, pts:9,  pj:4,  gf:11, gc:4 },
    visita: { G:3, E:3, P:0, pts:12, pj:6,  gf:11, gc:5 },
    primeGol: { favor:"pendiente", contra:"pendiente" },
    subsPorPartido: 4.7,
    formaciones: [
      { form:"1-4-2-3-1", pj:3, v:3, e:0, d:1, pts:9,  gf:11, gc:5,  contexto:"Formación más usada (J1,J5,J10) · variante ofensiva" },
      { form:"1-4-1-4-1", pj:3, v:1, e:2, d:0, pts:5,  gf:3,  gc:3,  contexto:"Control y equilibrio ante rivales exigentes" },
      { form:"1-4-1-3-2", pj:2, v:2, e:0, d:0, pts:6,  gf:8,  gc:3,  contexto:"La más efectiva · 2V 0D en J7-J8" },
    ],
    gamestates: {
      global: { gan:38.6, emp:43.7, per:17.8 },
      local:  { gan:48.1, emp:23.1, per:28.9 },
      visita: { gan:32.2, emp:57.4, per:10.4 },
    },
    franjasSubs: [
      { franja:"1-30'",  n:1,  imp:3.00  },
      { franja:"31-45'", n:6,  imp:0.00  },
      { franja:"46-60'", n:11, imp:0.55  },
      { franja:"61-75'", n:13, imp:0.62  },
      { franja:"76-90'", n:16, imp:0.19  },
    ],
    heatmap: [
      { tipo:"Ofensivo",  gan:{n:0,imp:0.00},  emp:{n:1,imp:0.00},  per:{n:2,imp:0.50} },
      { tipo:"Medio",     gan:{n:19,imp:0.00}, emp:{n:10,imp:0.60}, per:{n:9,imp:0.78} },
      { tipo:"Defensivo", gan:{n:3,imp:0.00},  emp:{n:3,imp:2.00},  per:{n:0,imp:0.00} },
    ],
    franjasGoles: [
      { f:"1-15'",  gf:3, gc:1 },
      { f:"16-30'", gf:1, gc:3 },
      { f:"31-45'", gf:6, gc:1 },
      { f:"46-60'", gf:0, gc:2 },
      { f:"61-75'", gf:4, gc:1 },
      { f:"76-90'", gf:8, gc:1 },
    ],
    banco: [
      { n:"Maria Gonzalez",           p:"D", ent:5, impT:5,  impP:1.00,  rat:6.84, gs:"Empatando" },
      { n:"Andrea Hernández",         p:"M", ent:5, impT:4,  impP:0.80,  rat:6.75, gs:"Perdiendo" },
      { n:"Mia Villalpando",          p:"D", ent:4, impT:4,  impP:1.00,  rat:6.58, gs:"Empatando" },
      { n:"Ève Périsset",             p:"D", ent:3, impT:2,  impP:0.67,  rat:6.69, gs:"Ganando"   },
      { n:"Natalia J. Colin",         p:"D", ent:4, impT:2,  impP:0.50,  rat:6.80, gs:"Ganando"   },
      { n:"Tatiana Flores",           p:"F", ent:2, impT:1,  impP:0.50,  rat:6.85, gs:"Perdiendo" },
      { n:"Jheniffer Cordinali",      p:"M", ent:3, impT:1,  impP:0.33,  rat:6.98, gs:"Perdiendo" },
      { n:"Ilana Izquierdo",          p:"M", ent:4, impT:0,  impP:0.00,  rat:6.72, gs:"Ganando"   },
    ],
    xi: [
      { n:"Cecilia Santiago",             p:"G", pj:"7/10", rat:7.07, nota:"9x titular · en ascenso pronunciado (+0.87) · mejor momento del torneo" },
      { n:"Ève Périsset",                p:"D", pj:"6/10", rat:6.60, nota:"6x titular · lateral izquierda titular en J6-J10" },
      { n:"Mariza",                      p:"D", pj:"9/10", rat:7.12, nota:"9x titular · fija en el eje defensivo · en ascenso (+0.42)" },
      { n:"Greta Espinoza",              p:"D", pj:"9/10", rat:6.96, nota:"9x titular · indiscutida en la zaga · mejor en J8-J10 (+0.78)" },
      { n:"Myra Delgadillo",             p:"M", pj:"9/10", rat:6.86, nota:"9x titular · pieza inamovible del mediocampo · muy estable" },
      { n:"Alexia Delgado",              p:"M", pj:"7/10", rat:6.89, nota:"7x titular · ausente J3-J5 · rebotó a 8.50 en J9 tras jornadas irregulares" },
      { n:"Jennifer Hermoso",            p:"M", pj:"7/10", rat:7.20, nota:"7x titular · disponibilidad limitada · equipo más productivo cuando juega" },
      { n:"Thembi Kgatlana",             p:"M", pj:"8/10", rat:7.67, nota:"8x titular · segunda mejor del torneo · en ascenso (+0.42) · sale 7x" },
      { n:"Emma Christine Linda Watson", p:"M", pj:"6/10", rat:6.90, nota:"6x titular · emergente en J6-J10 · en ascenso (+0.53)" },
      { n:"Jheniffer Cordinali",         p:"M", pj:"6/10", rat:7.13, nota:"6x titular · rota entre titular y banca · en caída (−0.42)" },
      { n:"Diana Ordoñez",               p:"F", pj:"8/10", rat:7.85, nota:"8x titular · ⭐ mejor del torneo · llega en caída severa (−1.22)" },
    ],
    forma: [
      { n:"Diana Ordoñez",               p:"F", prev:8.12, ult:6.90, d:-1.22 },
      { n:"Cecilia Santiago",            p:"G", prev:6.68, ult:7.55, d:+0.87 },
      { n:"Greta Espinoza",              p:"D", prev:6.59, ult:7.37, d:+0.78 },
      { n:"Emma Christine Linda Watson", p:"M", prev:6.63, ult:7.17, d:+0.53 },
      { n:"Alexia Delgado",              p:"M", prev:6.70, ult:7.13, d:+0.43 },
      { n:"Thembi Kgatlana",             p:"M", prev:7.38, ult:7.80, d:+0.42 },
      { n:"Mariza",                      p:"D", prev:6.98, ult:7.40, d:+0.42 },
      { n:"Mia Villalpando",             p:"D", prev:6.49, ult:6.90, d:+0.41 },
      { n:"Jheniffer Cordinali",         p:"M", prev:7.07, ult:6.65, d:-0.42 },
      { n:"Jennifer Hermoso",            p:"M", prev:7.28, ult:7.00, d:-0.28 },
      { n:"Natalia J. Colin",            p:"D", prev:6.88, ult:6.55, d:-0.33 },
      { n:"Myra Delgadillo",             p:"M", prev:6.81, ult:6.83, d:+0.02 },
    ],
    alertas: [
      "Diana Ordoñez (7.85 avg titular) llega en caída severa: −1.22 en las últimas 3 jornadas.",
      "Pedro Martínez rota 4 jugadoras por partido en promedio — sin XI consolidado hasta J6.",
      "Defensivo empatando: +2.00 imp — la jugada más efectiva del banco, usada solo 3 veces en 10 PJ.",
      "Solo 6% de sus cambios son ofensivos — casi nunca apuesta por atacar desde el banco.",
    ],
    hallazgos: [
      "XI más habitual consolidado recién en J6-J8 (10/11 tipo), con rotaciones masivas en J1-J5.",
      "51% de los cambios son simultáneos o casi (brecha ≤5 min) — Pedro opera en tandas, no escalonado.",
      "81% de sus cambios son Medio — sustituye el mismo perfil posicional sin redefinir el planteamiento.",
      "De visita el equipo pasa el 57% del tiempo empatando — el gamestate que activa sus mejores movimientos.",
      "Thembi Kgatlana: la más rotada (sale 7x) y llega a J8-J10 en su mejor momento del torneo (+0.42).",
      "Franja 76-90': 8 GF y solo 1 GC — el tramo más dominante del torneo.",
      "Franja 46-60': 0 goles a favor y 2 en contra — apertura del segundo tiempo como zona vulnerable.",
      "Ausencia de Alexia (J3-J5): los resultados no cayeron, pero Pedro usó hasta 7 cambios en el XI para cubrirla.",
      "Maria Gonzalez y Mia Villalpando: mejor dupla del banco (+1.00 imp cada una), ambas entran empatando.",
      "De local pierde el 28% de los minutos jugados — más vulnerable en casa que de visita.",
    ],
    notasSubs: [
      { tipo:"info",   txt:"Pedro Martínez opera en tandas simultáneas: el 51% de sus cambios se dan en pares o tríos al mismo minuto." },
      { tipo:"info",   txt:"GANANDO hace cambios Medio o Defensivo en el 100% de los casos — consolida sin apostar." },
      { tipo:"alerta", txt:"6 cambios al descanso (31-45') con impacto 0 — los ajustes del medio tiempo no mueven el marcador." },
    ],
    notasGoles: [
      { tipo:"alerta", txt:"Franja 46-60': 0 goles a favor y 2 en contra — el inicio del segundo tiempo es la ventana de mayor riesgo." },
      { tipo:"info",   txt:"Franja 76-90': 8 GF y solo 1 GC — Tigres cierra partidos de forma contundente." },
      { tipo:"info",   txt:"Franja 31-45': 6 GF y 1 GC — el mejor tramo ofensivo del equipo en el torneo." },
      { tipo:"alerta", txt:"Franja 16-30': 1 GF y 3 GC — arranque de partido como zona de mayor vulnerabilidad defensiva." },
    ],
    notasLV: [
      { tipo:"info",   txt:"De visita: 3V 3E 0D — el equipo invicto fuera de casa en 10 jornadas." },
      { tipo:"info",   txt:"De visita pasa el 57% del tiempo empatando — los cambios en ese gamestate son la clave táctica." },
      { tipo:"alerta", txt:"De local: 28% de los minutos en desventaja — más vulnerable en casa que de visita." },
    ],
    notasBanco: [
      { tipo:"info",   txt:"Maria Gonzalez y Mia Villalpando: mejor dupla del banco con +1.00 imp promedio cada una, ambas entran empatando." },
      { tipo:"info",   txt:"Andrea Hernández: la carta más activa para remontar — entra perdiendo con +0.80 imp promedio." },
      { tipo:"alerta", txt:"Defensivo empatando (+2.00 imp): la jugada más efectiva del banco, pero Pedro la usa con cuentagotas." },
    ],
    notasForma: [
      { tipo:"alerta", txt:"Diana Ordoñez (−1.22): la mejor del torneo en descenso pronunciado en las últimas 3 jornadas." },
      { tipo:"info",   txt:"Cecilia Santiago (+0.87) y Greta Espinoza (+0.78): la zaga llega en su mejor momento del torneo." },
      { tipo:"info",   txt:"Thembi Kgatlana (+0.42): la más rotada del equipo llega con tendencia positiva." },
      { tipo:"alerta", txt:"Jheniffer Cordinali (−0.42): pieza de rotación en caída — puede quedar fuera del XI titular." },
    ],
  },

  "Pachuca": {
    torneo: "Clausura 2026 · J1–J12",
    status: "real",
    record: { G:8, E:3, P:1, pts:27, pj:12, gf:35, gc:5 },
    local:  { G:5, E:1, P:0, pts:16, pj:6,  gf:21, gc:2 },
    visita: { G:3, E:2, P:1, pts:11, pj:6,  gf:14, gc:3 },
    primeGol: { favor:"8V 2E 0D (anota 24')", contra:"0V 1E 1D (recibe 26')" },
    minPGF: 24, minPGC: 26,
    subsPorPartido: 4.2,
    formaciones: [
      { form:"1-4-4-2",   pj:9, v:6, e:2, d:1, pts:20, gf:27, gc:4, contexto:"Sistema base · bloque sólido y transición rápida" },
      { form:"1-4-2-3-1", pj:2, v:1, e:0, d:1, pts:3,  gf:7,  gc:1, contexto:"Vs rivales que disputan el mediocampo · Cruz Azul y Necaxa" },
      { form:"1-4-4-1-1", pj:1, v:0, e:1, d:0, pts:1,  gf:2,  gc:2, contexto:"Variante puntual vs Tigres · Corral como referencia única" },
    ],
    gamestates: {
      global: { gan:59, emp:34, per:7  },
      local:  { gan:70, emp:30, per:0  },
      visita: { gan:47, emp:38, per:14 },
    },
    franjasSubs: [
      { franja:"1-15'",  n:1,  imp: 0.00 },
      { franja:"31-45'", n:4,  imp: 1.50 },
      { franja:"46-60'", n:9,  imp: 0.00 },
      { franja:"61-75'", n:20, imp:-0.10 },
      { franja:"76-90'", n:16, imp:-0.12 },
    ],
    heatmap: [
      { tipo:"Ofensivo",  gan:{n:3, imp:0.00}, emp:{n:1, imp:2.00}, per:{n:0, imp:0.00} },
      { tipo:"Medio",     gan:{n:30,imp:-0.13},emp:{n:9, imp:0.44}, per:{n:3, imp:0.00} },
      { tipo:"Defensivo", gan:{n:4, imp:0.00}, emp:{n:0, imp:0.00}, per:{n:0, imp:0.00} },
    ],
    franjasGoles: [
      { f:"1-15'",  gf:6, gc:0, pumGF:0, pumGC:3 },
      { f:"16-30'", gf:3, gc:1, pumGF:4, pumGC:2 },
      { f:"31-45'", gf:8, gc:1, pumGF:5, pumGC:3 },
      { f:"46-60'", gf:8, gc:1, pumGF:1, pumGC:2 },
      { f:"61-75'", gf:4, gc:0, pumGF:2, pumGC:3 },
      { f:"76-90'", gf:6, gc:2, pumGF:1, pumGC:6 },
    ],
    banco: [
      { n:"Paola Garcia",              p:"F",   ent:7, impT: 2, impP: 0.29, rat:6.69, gs:"Ganando"   },
      { n:"Julia Yareli Alvidrez",     p:"M",   ent:6, impT: 0, impP: 0.00, rat:6.82, gs:"Ganando"   },
      { n:"Abril A. Fragoso García",   p:"M/F", ent:4, impT: 0, impP: 0.00, rat:7.18, gs:"Ganando"   },
      { n:"Mackenzee Vance",           p:"M",   ent:4, impT: 0, impP: 0.00, rat:6.85, gs:"Ganando"   },
      { n:"Kelly Caicedo",             p:"D",   ent:4, impT: 0, impP: 0.00, rat:6.83, gs:"Ganando"   },
      { n:"Sydney Becerra",            p:"M/F", ent:3, impT: 0, impP: 0.00, rat:7.17, gs:"Ganando"   },
      { n:"Alexandra Godínez",         p:"D/M", ent:5, impT:-2, impP:-0.33, rat:6.72, gs:"Ganando"   },
      { n:"Andrea Pereira",            p:"M",   ent:1, impT:-2, impP:-2.00, rat:6.30, gs:"Ganando"   },
    ],
    xi: [
      { n:"Esthefanny Barreras",      p:"G", pj:"11/12", rat:7.57, nota:"Titular indiscutible · sólida bajo los tres palos" },
      { n:"Berenice Ibarra Hernández",p:"D", pj:"12/12", rat:7.18, nota:"La única con 12/12 · presencia continua en ambas fases" },
      { n:"Osinachi Ohale",           p:"D", pj:"10/12", rat:6.96, nota:"Zaguera central internacional · lectura táctica elevada" },
      { n:"Yirleidis Quejada Minota", p:"D", pj:"10/12", rat:7.02, nota:"En ascenso (+0.26) · central físico con salida limpia" },
      { n:"Kenti Robles",             p:"D", pj:" 9/12", rat:7.12, nota:"⚑ Lateral que se proyecta · su espalda es el espacio más explotable" },
      { n:"Karla Nieto",              p:"M", pj:"12/12", rat:7.43, nota:"Omnipresente · cubre los dos carrileros laterales" },
      { n:"Nina Nicosia",             p:"M", pj:"12/12", rat:7.74, nota:"⚑ Motor creativo · en caída (-1.07 últimas 3J)" },
      { n:"Andrea Pereira",           p:"M", pj:" 8/12", rat:7.45, nota:"Verticalidad cuando inicia · mejor como titular que suplente" },
      { n:"María Natalia Mauleon",    p:"M", pj:" 7/12", rat:6.90, nota:"⚑ En caída pronunciada (-0.90) · forma baja" },
      { n:"Charlyn Corral",           p:"F", pj:" 9/12", rat:8.49, nota:"⭐ Mejor del torneo · en ascenso (+0.17) · máximo peligro" },
      { n:"Chinwendu Ihezuo",         p:"F", pj:" 5/12", rat:6.85, nota:"Segunda punta · presión alta · comparte con Fragoso" },
    ],
    forma: [
      { n:"Charlyn Corral",           p:"F", prev:8.30, ult:8.47, d:+0.17 },
      { n:"Karla Nieto",              p:"M", prev:7.41, ult:7.46, d:+0.05 },
      { n:"Yirleidis Quejada",        p:"D", prev:6.94, ult:7.20, d:+0.26 },
      { n:"Osinachi Ohale",           p:"D", prev:6.88, ult:7.04, d:+0.16 },
      { n:"Esthefanny Barreras",      p:"G", prev:7.73, ult:7.38, d:-0.35 },
      { n:"Berenice Ibarra",          p:"D", prev:7.24, ult:7.08, d:-0.16 },
      { n:"Kenti Robles",             p:"D", prev:7.15, ult:7.07, d:-0.08 },
      { n:"Andrea Pereira",           p:"M", prev:7.95, ult:7.32, d:-0.63 },
      { n:"María Natalia Mauleon",    p:"M", prev:7.60, ult:6.70, d:-0.90 },
      { n:"Nina Nicosia",             p:"M", prev:8.19, ult:7.12, d:-1.07 },
    ],
    alertas: [
      "Pachuca marca primero en 10/12 partidos — cuando lo logra promedia 2.60 pts/PJ.",
      "Franjas 31-45' y 46-60': concentran 16 de sus 35 goles (46%) — el tramo más letal.",
      "Cambio Ofensivo desde EMPATANDO: impacto +2.00 — su combinación más peligrosa del banco.",
    ],
    hallazgos: [
      "84% de cambios son tipo Medio — Torres gestiona energía, no modifica el sistema.",
      "Cambios en 61-75' GANANDO: impacto -0.13 — el rival se vuelve más vulnerable cuando enfrían el partido.",
      "Nina Nicosia: caída de -1.07 en J8-J10 — el motor creativo no llega en su mejor momento.",
      "Paola Garcia es la única suplente con impacto positivo neto (+0.29) — su ingreso activa el ataque.",
      "J6 vs Tigres (2-2): único empate en casa · modelo con bloque defensivo y contraataque válido para Pumas.",
    ],
    notasSubs: [
      { tipo:"info",   txt:"61-75' concentra el 40% de los cambios — Torres hace rotaciones masivas en esa ventana." },
      { tipo:"info",   txt:"84% de los cambios son tipo Medio — el sistema no cambia independientemente del marcador." },
      { tipo:"alerta", txt:"Cambio Ofensivo desde empate tiene impacto +2.00 — si el partido está igualado al 70', anticipar el ingreso de Paola Garcia." },
      { tipo:"alerta", txt:"Cambios en 76-90' tienen impacto -0.12 — Pachuca pierde rendimiento en el cierre, momento para presionar." },
    ],
    notasGoles: [
      { tipo:"alerta", txt:"Franja 1-15': Pachuca anota 6 GF y Pumas recibe 3 GC — arranque peligroso, bloque compacto obligatorio." },
      { tipo:"alerta", txt:"Franjas 31-45' y 46-60': 16 goles de Pachuca (46% del total) — el tramo de mayor concentración ofensiva." },
      { tipo:"info",   txt:"Franja 76-90': Pumas recibe 6 GC — si el partido llega vivo al 75', el riesgo defensivo es máximo." },
    ],
    notasLV: [
      { tipo:"info",   txt:"Como local: 2.67 pts/PJ · 0 minutos PERDIENDO · 5G-1E-0D — el mejor rendimiento del torneo en casa." },
      { tipo:"info",   txt:"Como visita: 1.83 pts/PJ · 3G-2E-1D — sigue siendo peligroso con 14 GF en 6 partidos." },
      { tipo:"alerta", txt:"Los 3 empates del torneo ocurrieron todos de visita (Tigres J6, Toluca J9, Guadalajara J12) — cuando no marca primero, el resultado se complica." },
    ],
    notasBanco: [
      { tipo:"info",   txt:"Paola Garcia: 7 entradas · única suplente con impacto positivo neto — su ingreso activa la segunda punta." },
      { tipo:"alerta", txt:"Alexandra Godínez y Andrea Pereira como suplentes: impacto negativo (-0.33 y -2.00) — no son amenaza real desde el banco." },
      { tipo:"info",   txt:"Abril Fragoso y Sydney Becerra mantienen rating alto desde el banco (+7.18 y +7.17) — entran preparadas." },
    ],
    notasForma: [
      { tipo:"alerta", txt:"Charlyn Corral (+0.17) llega en su mejor momento del torneo — el peor momento para enfrentarla." },
      { tipo:"alerta", txt:"Nina Nicosia (-1.07) y María Natalia Mauleon (-0.90): el mediocampo creativo en descenso pronunciado." },
      { tipo:"info",   txt:"Yirleidis Quejada (+0.26) y Osinachi Ohale (+0.16): la zaga central llega a su mejor nivel." },
    ],
  },

  "Pumas UNAM": {
    torneo: "Clausura 2026 · J1–J10",
    status: "real",
    record: { G:4, E:3, P:3, pts:15, pj:10, gf:10, gc:13 },
    local:  { G:3, E:0, P:1, pts:9,  pj:4,  gf:5,  gc:2  },
    visita: { G:1, E:3, P:2, pts:6,  pj:6,  gf:5,  gc:11 },
    primeGol: { favor:"4V 1E 0D (anota 40')", contra:"0V 1E 3D (recibe 18')" },
    minPGF: 40, minPGC: 18,
    subsPorPartido: 4.4,
    formaciones: [
      { form:"1-4-2-3-1", pj:6, v:3, e:1, d:2, pts:10, gf:7,  gc:7,  contexto:"Formación base · versatilidad ofensiva" },
      { form:"1-4-4-2",   pj:3, v:1, e:1, d:1, pts:4,  gf:3,  gc:6,  contexto:"Doble punta · más físico, menos control" },
    ],
    gamestates: {
      global: { gan:28.1, emp:40.7, per:31.2 },
      local:  { gan:47.2, emp:37.2, per:15.6 },
      visita: { gan:15.4, emp:43.0, per:41.7 },
    },
    franjasSubs: [
      { franja:"1-30'",  n:1,  imp:0.00  },
      { franja:"31-45'", n:0,  imp:0.00  },
      { franja:"46-60'", n:9,  imp:0.44  },
      { franja:"61-75'", n:22, imp:0.27  },
      { franja:"76-90'", n:12, imp:-0.25 },
    ],
    heatmap: [
      { tipo:"Ofensivo",  gan:{n:2,imp:0.00},  emp:{n:0,imp:0.00},  per:{n:1,imp:0.00} },
      { tipo:"Medio",     gan:{n:16,imp:-0.38}, emp:{n:3,imp:1.33},  per:{n:16,imp:0.25} },
      { tipo:"Defensivo", gan:{n:1,imp:0.00},  emp:{n:2,imp:2.00},  per:{n:3,imp:0.33} },
    ],
    franjasGoles: [
      { f:"1-15'",  gf:0, gc:2, pumGF:0, pumGC:2 },
      { f:"16-30'", gf:3, gc:2, pumGF:3, pumGC:2 },
      { f:"31-45'", gf:4, gc:3, pumGF:4, pumGC:3 },
      { f:"46-60'", gf:1, gc:1, pumGF:1, pumGC:1 },
      { f:"61-75'", gf:1, gc:1, pumGF:1, pumGC:1 },
      { f:"76-90'", gf:1, gc:4, pumGF:1, pumGC:4 },
    ],
    banco: [
      { n:"Wendy Bonilla",         p:"M", ent:3, impT:3,  impP:1.00, rat:7.17, gs:"Empatando" },
      { n:"Paola Chavero",         p:"D", ent:1, impT:2,  impP:2.00, rat:6.70, gs:"Empatando" },
      { n:"Ximena Ríos",           p:"D", ent:1, impT:2,  impP:2.00, rat:6.40, gs:"Empatando" },
      { n:"Michelle González",     p:"M", ent:5, impT:2,  impP:0.40, rat:6.78, gs:"Ganando"   },
      { n:"Alexa Huerta",          p:"M", ent:3, impT:1,  impP:0.33, rat:6.70, gs:"Empatando" },
      { n:"Ana Mendoza",           p:"D", ent:1, impT:1,  impP:1.00, rat:6.60, gs:"Perdiendo" },
      { n:"Alejandra Guerrero",    p:"M", ent:5, impT:1,  impP:0.20, rat:7.02, gs:"Perdiendo" },
      { n:"Karen Becerril",        p:"M", ent:5, impT:1,  impP:0.20, rat:6.47, gs:"Ganando"   },
    ],
    xi: [
      { n:"Jashia López / Heidi González", p:"G", pj:"4/4",  rat:7.20, nota:"Portería compartida · Jashia en ascenso (+0.13)" },
      { n:"Karen Ramírez",                 p:"D", pj:"9/10", rat:6.54, nota:"Lateral fija · mayor continuidad del equipo" },
      { n:"Julissa Dávila",                p:"D", pj:"8/10", rat:6.98, nota:"En ascenso (+0.20) · pilar defensivo" },
      { n:"Paola Chavero Álvarez",         p:"D", pj:"8/10", rat:6.76, nota:"En ascenso (+0.11) · estabilidad en la zaga" },
      { n:"Alejandra Guerrero",            p:"M", pj:"5/10", rat:7.02, nota:"⚑ MC jugando como LI · en caída (-0.40) · posición forzada" },
      { n:"Alexa Huerta",                  p:"M", pj:"6/10", rat:6.85, nota:"En ascenso (+0.30) · construye desde el centro" },
      { n:"Silvana Flores Dorrel",         p:"M", pj:"7/10", rat:6.93, nota:"Leve caída (-0.17) · mediocampista dinámica" },
      { n:"Cristina Torres",               p:"M", pj:"7/10", rat:7.41, nota:"⭐ Mejor del torneo · en ascenso pronunciado (+0.33)" },
      { n:"Angelina Nicole Hix",           p:"F", pj:"6/10", rat:7.42, nota:"Segunda mejor · leve caída (-0.15)" },
      { n:"Nayely Bolaños",                p:"F", pj:"7/10", rat:7.19, nota:"Estable (0.00) · referente ofensiva" },
      { n:"Dorian Hernández",              p:"F", pj:"4/10", rat:7.30, nota:"Leve caída (-0.22) · rotación ofensiva" },
    ],
    forma: [
      { n:"Alejandra Guerrero",    p:"M", prev:7.00, ult:6.60, d:-0.40 },
      { n:"Dorian Hernández",      p:"F", prev:7.43, ult:7.20, d:-0.22 },
      { n:"Karen Ramírez",         p:"D", prev:6.60, ult:6.43, d:-0.17 },
      { n:"Silvana F. Dorrel",     p:"M", prev:7.00, ult:6.83, d:-0.17 },
      { n:"Angelina Hix",          p:"F", prev:7.65, ult:7.50, d:-0.15 },
      { n:"Jashia López",          p:"G", prev:7.30, ult:7.17, d:-0.13 },
      { n:"Nayely Bolaños",        p:"F", prev:7.10, ult:7.10, d:0.00  },
      { n:"Paola Chavero",         p:"D", prev:6.72, ult:6.83, d:+0.11 },
      { n:"Julissa Dávila",        p:"D", prev:6.90, ult:7.10, d:+0.20 },
      { n:"Wendy Bonilla",         p:"M", prev:6.83, ult:7.07, d:+0.23 },
      { n:"Alexa Huerta",          p:"M", prev:6.80, ult:7.10, d:+0.30 },
      { n:"Cristina Torres",       p:"M", prev:7.23, ult:7.57, d:+0.33 },
    ],
    alertas: [
      "Cuando Pumas anota primero: 4V 1E 0D. Cuando recibe primero: 0V 1E 3D — el primer gol decide el partido.",
      "De visita juega PERDIENDO el 41.7% del tiempo — muy vulnerable fuera de casa.",
      "Franja 1-15': 0 GF y 2 GC — los primeros 15 minutos son la zona de mayor riesgo defensivo.",
    ],
    hallazgos: [
      "Alejandra Guerrero juega como LI siendo MC — posición forzada que afecta su rendimiento (-0.40 en forma).",
      "Defensivo empatando: +2.00 imp (2 usos) — la jugada más efectiva del banco pero infrautilizada.",
      "Medio empatando: +1.33 imp — el banco funciona mejor con el marcador igualado que en cualquier otro contexto.",
      "GANANDO el banco tiene impacto negativo (-0.38) — los cambios de consolidación cuestan puntos.",
      "Cristina Torres: mejor del torneo y en ascenso pronunciado (+0.33) — pieza clave en el tramo final.",
      "Portería sin titular fija: Jashia López y Heidi González se turnan · Jashia en mejor momento.",
      "Franja 76-90': solo 1 GF y 4 GC — el tramo defensivamente más peligroso.",
      "El 70% de los goles de Pumas ocurren antes del min 45 — equipo de primera mitad.",
    ],
    notasSubs: [
      { tipo:"info",   txt:"El 50% de los cambios ocurren en la franja 61-75' — la DT actúa en el tramo central del 2T." },
      { tipo:"alerta", txt:"GANANDO hace cambios con impacto negativo (-0.38) — los cambios de consolidación cuestan puntos." },
      { tipo:"info",   txt:"Empatando activa los mejores cambios (+2.00 defensivo, +1.33 medio) — el banco rinde con marcador igualado." },
    ],
    notasGoles: [
      { tipo:"alerta", txt:"Franja 1-15': 0 GF y 2 GC — los primeros 15 minutos son zona de riesgo alto." },
      { tipo:"alerta", txt:"Franja 76-90': solo 1 GF y 4 GC — el equipo se desarma en el tramo final." },
      { tipo:"info",   txt:"El 70% de los goles de Pumas ocurren antes del minuto 45 — primera mitad como territorio propio." },
    ],
    notasLV: [
      { tipo:"info",   txt:"De local: 3V 0E 1D con GC:2 en 4 PJ — la fortaleza en casa es el activo más sólido del equipo." },
      { tipo:"alerta", txt:"De visita: 1V 3E 2D con GC:11 en 6 PJ — el equipo concede mucho fuera de casa." },
      { tipo:"alerta", txt:"De visita el 41.7% del tiempo se juega perdiendo — la condición tácticamente más difícil." },
    ],
    notasBanco: [
      { tipo:"info",   txt:"Wendy Bonilla: referente del banco (+1.00 imp/entrada) · entra empatando con efecto inmediato." },
      { tipo:"info",   txt:"Paola Chavero y Ximena Ríos: +2.00 imp empatando — cartas defensivas de máximo impacto cuando el marcador está igualado." },
      { tipo:"alerta", txt:"Michelle González y Karen Becerril: 5 entradas cada una con impacto bajo — no cambian partidos." },
    ],
    notasForma: [
      { tipo:"alerta", txt:"Alejandra Guerrero (-0.40): MC jugando como LI — rendimiento afectado por posición forzada." },
      { tipo:"info",   txt:"Cristina Torres (+0.33) y Alexa Huerta (+0.30): el mediocampo llega al mejor momento del torneo." },
      { tipo:"info",   txt:"Julissa Dávila (+0.20) y Wendy Bonilla (+0.23): bloque defensivo-medio en ascenso." },
      { tipo:"alerta", txt:"Angelina Hix (-0.15) y Dorian Hernández (-0.22): el ataque titular llega en ligero descenso." },
    ],
  },

  // ── RESTO DE EQUIPOS (arquitectura lista, datos pendientes) ──────────
  ...[
    "Chivas","América","Monterrey",
    "Atlas","Santos Laguna","Necaxa","FC Juárez",
    "Querétaro","Atlético de San Luis","Cruz Azul",
    "Puebla FC","Mazatlán","León"
  ].reduce((acc, eq) => {
    acc[eq] = {
      torneo: "Clausura 2026",
      status: "pending",
      record: { G:0, E:0, P:0, pts:0, pj:0, gf:0, gc:0 },
      local:  { G:0, E:0, P:0, pts:0, pj:0, gf:0, gc:0 },
      visita: { G:0, E:0, P:0, pts:0, pj:0, gf:0, gc:0 },
    };
    return acc;
  }, {}),
};

const EQUIPOS = Object.keys(DATA);


// ═══════════════════════════════════════════════════════════════
// COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════
const Divider = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, margin:"32px 0 16px" }}>
    <div style={{ height:2, background:`linear-gradient(90deg,${C.gold},${C.gold}00)`, flex:1 }} />
    <span style={{ color:C.gold, fontWeight:800, fontSize:13, letterSpacing:1.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>
      {label}
    </span>
    <div style={{ height:2, background:`linear-gradient(90deg,${C.gold}00,${C.gold})`, flex:1 }} />
  </div>
);

const KPI = ({ label, value, sub, accent, small }) => (
  <div style={{ background:C.navyL, border:`1px solid ${accent||C.gold}28`, borderRadius:8,
                padding: small ? "10px 14px" : "14px 18px", flex:1, minWidth:90 }}>
    <div style={{ color:C.gray, fontSize:10, textTransform:"uppercase", letterSpacing:1.2 }}>{label}</div>
    <div style={{ color:accent||C.gold, fontSize:small?20:26, fontWeight:800, lineHeight:1.2, marginTop:3 }}>{value}</div>
    {sub && <div style={{ color:C.gray, fontSize:11, marginTop:2 }}>{sub}</div>}
  </div>
);

const Alert = ({ children }) => (
  <div style={{ background:`${C.red}18`, border:`1px solid ${C.red}50`, borderRadius:6,
                padding:"9px 14px", marginBottom:8, display:"flex", gap:10 }}>
    <span style={{ color:C.red, fontSize:13, marginTop:1 }}>⚑</span>
    <span style={{ color:"#FFCDD2", fontSize:12.5, lineHeight:1.5 }}>{children}</span>
  </div>
);

const Info = ({ children }) => (
  <div style={{ background:`${C.gold}12`, border:`1px solid ${C.gold}30`, borderRadius:6,
                padding:"9px 14px", marginBottom:8, display:"flex", gap:10 }}>
    <span style={{ color:C.gold, fontSize:13 }}>●</span>
    <span style={{ color:C.cream, fontSize:12.5, lineHeight:1.5 }}>{children}</span>
  </div>
);

const Tag = ({ children, color }) => (
  <span style={{ background:`${color||C.gold}22`, color:color||C.gold,
                 fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4, letterSpacing:0.5 }}>
    {children}
  </span>
);

const TT = ({ contentStyle, ...props }) => (
  <Tooltip contentStyle={{ background:C.navyM, border:`1px solid ${C.gold}44`,
                            color:C.cream, fontSize:11, borderRadius:6, ...contentStyle }} {...props} />
);

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: RESUMEN
// ═══════════════════════════════════════════════════════════════
function SecResumen({ d }) {
  const pts_pj = d.record.pj > 0 ? (d.record.pts/d.record.pj).toFixed(2) : "—";
  const gsData = [
    { name:"Ganando",   global:d.gamestates.global.gan, local:d.gamestates.local.gan, visita:d.gamestates.visita.gan },
    { name:"Empatando", global:d.gamestates.global.emp, local:d.gamestates.local.emp, visita:d.gamestates.visita.emp },
    { name:"Perdiendo", global:d.gamestates.global.per, local:d.gamestates.local.per, visita:d.gamestates.visita.per },
  ];
  return (
    <>
      <Divider label="Rendimiento General" />
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <KPI label="Record" value={`${d.record.G}G ${d.record.E}E ${d.record.P}P`} sub={`${d.record.pts} puntos · ${d.record.pj}PJ`} />
        <KPI label="Pts/PJ" value={pts_pj} />
        <KPI label="GF/partido" value={(d.record.gf/Math.max(d.record.pj,1)).toFixed(1)} sub={`${d.record.gf} totales`} accent={C.greenL} />
        <KPI label="GC/partido" value={(d.record.gc/Math.max(d.record.pj,1)).toFixed(1)} sub={`${d.record.gc} totales`} accent={C.redL} />
        <KPI label="Subs/PJ" value={d.subsPorPartido||"—"} accent={C.grayL} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
        {[["LOCAL", d.local, C.greenL], ["VISITA", d.visita, C.goldL]].map(([lbl, r, ac]) => (
          <div key={lbl} style={{ background:C.navyL, borderRadius:8, padding:"14px 16px",
                                   border:`1px solid ${ac}22` }}>
            <div style={{ color:ac, fontWeight:700, fontSize:12, letterSpacing:1, marginBottom:10 }}>{lbl} · {r.pj} partidos</div>
            <div style={{ display:"flex", gap:10 }}>
              <KPI label="Record" value={`${r.G}V${r.E}E${r.P}D`} sub={`${r.pts} pts`} small accent={ac} />
              <KPI label="Pts/PJ" value={r.pj>0?(r.pts/r.pj).toFixed(2):"—"} small accent={ac} />
              <KPI label="GF–GC" value={`${r.gf}–${r.gc}`} small />
            </div>
          </div>
        ))}
      </div>

      <Divider label="Gamestates — % de Minutos" />
      <div style={{ height:220 }}>
        <ResponsiveContainer>
          <BarChart data={gsData} margin={{top:5,right:10,left:-15,bottom:0}} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.white}08`} vertical={false} />
            <XAxis dataKey="name" tick={{fill:C.cream, fontSize:12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:C.gray, fontSize:10}} axisLine={false} tickLine={false} unit="%" domain={[0,60]} />
            <TT formatter={v=>`${v}%`} />
            <Legend wrapperStyle={{color:C.gray, fontSize:11}} />
            <Bar dataKey="global" name="Global"  fill={C.gold}  radius={[3,3,0,0]} />
            <Bar dataKey="local"  name="Local"   fill={C.green} radius={[3,3,0,0]} />
            <Bar dataKey="visita" name="Visita"  fill={C.blue}  radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Divider label="Hallazgos Críticos" />
      {d.alertas?.map((a,i) => <Alert key={i}>{a}</Alert>)}
      {d.hallazgos?.map((h,i) => <Info key={i}>{h}</Info>)}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: XI TIPO
// ═══════════════════════════════════════════════════════════════
function SecXI({ d }) {
  const [pf, setPf] = useState("Todos");
  const posiciones = ["Todos","G","D","M","F"];
  const xi = pf === "Todos" ? d.xi : d.xi?.filter(j => j.p === pf);

  return (
    <>
      <Divider label="XI Tipo de Local" />
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {posiciones.map(p => (
          <button key={p} onClick={()=>setPf(p)}
            style={{ padding:"4px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
                     background: pf===p ? C.gold : `${C.white}12`, color: pf===p ? C.navy : C.grayL }}>
            {p}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {xi?.map((j,i) => {
          const isKey = j.n?.includes("Le Sommer");
          const isWarn = j.n?.includes("Jakobsson");
          return (
            <div key={i} style={{
              background: isKey ? `${C.gold}18` : isWarn ? `${C.red}15` : C.navyL,
              border:`1px solid ${isKey ? C.gold : isWarn ? C.red : C.white}18`,
              borderRadius:7, padding:"10px 14px",
              display:"grid", gridTemplateColumns:"36px 28px 1fr 52px 120px",
              alignItems:"center", gap:10
            }}>
              <span style={{ background:POS_COLOR[j.p]||C.gray, color:C.white, fontSize:10,
                             fontWeight:800, padding:"3px 0", borderRadius:4, textAlign:"center" }}>{j.p}</span>
              <span style={{ color:C.gray, fontSize:11 }}>{j.pj}</span>
              <div>
                <div style={{ color:C.cream, fontWeight:600, fontSize:13 }}>{j.n}</div>
                {j.nota && <div style={{ color:C.gray, fontSize:10, marginTop:1 }}>{j.nota}</div>}
              </div>
              <span style={{ color: j.rat>=8 ? C.gold : j.rat>=7 ? C.greenL : C.gray,
                             fontWeight:800, fontSize:16, textAlign:"right" }}>
                {j.rat ? j.rat.toFixed(2) : "—"}
              </span>
              <div style={{ background:`${C.white}08`, borderRadius:3, height:5, overflow:"hidden" }}>
                <div style={{
                  background: j.rat>=8 ? C.gold : j.rat>=7 ? C.green : C.gray,
                  width:`${Math.min((j.rat||0)/10*100, 100)}%`, height:"100%",
                  transition:"width 0.4s ease"
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <Divider label="Formaciones" />
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        {d.formaciones?.map((f,i) => (
          <div key={i} style={{ background:C.navyL, borderRadius:8, padding:"14px 16px", flex:1, minWidth:180,
                                 border:`1px solid ${C.gold}22` }}>
            <div style={{ color:C.gold, fontWeight:800, fontSize:16, marginBottom:6 }}>{f.form}</div>
            <div style={{ display:"flex", gap:8, marginBottom:6 }}>
              <Tag color={C.greenL}>{f.v}V</Tag>
              <Tag color={C.gold}>{f.e}E</Tag>
              <Tag color={C.redL}>{f.d}D</Tag>
              <Tag>{(f.pts/f.pj).toFixed(2)} pts/PJ</Tag>
            </div>
            <div style={{ color:C.gray, fontSize:11 }}>{f.contexto}</div>
            <div style={{ color:C.cream, fontSize:12, marginTop:4 }}>GF:{f.gf} GC:{f.gc}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: SUSTITUCIONES
// ═══════════════════════════════════════════════════════════════
function SecSubs({ d }) {
  return (
    <>
      <Divider label="Sustituciones por Franja" />
      <div style={{ height:230 }}>
        <ResponsiveContainer>
          <ComposedChart data={d.franjasSubs} margin={{top:5,right:40,left:-15,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.white}08`} vertical={false} />
            <XAxis dataKey="franja" tick={{fill:C.cream, fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{fill:C.gray, fontSize:10}} axisLine={false} tickLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{fill:C.goldL, fontSize:10}} axisLine={false}
                   tickLine={false} domain={[-0.5,2.5]} />
            <TT />
            <Bar yAxisId="l" dataKey="n" name="N° subs" radius={[4,4,0,0]}>
              {d.franjasSubs?.map((e,i) => (
                <Cell key={i} fill={e.n===Math.max(...(d.franjasSubs||[]).map(x=>x.n)) ? C.gold : `${C.gold}55`} />
              ))}
            </Bar>
            <Line yAxisId="r" type="monotone" dataKey="imp" name="Impacto prom"
                  stroke={C.white} strokeWidth={2}
                  dot={({cx,cy,payload}) => (
                    <circle cx={cx} cy={cy} r={5}
                      fill={payload.imp<0 ? C.redL : payload.imp>1 ? C.greenL : C.gold}
                      stroke={C.navy} strokeWidth={1.5} />
                  )} />
            <ReferenceLine yAxisId="r" y={0} stroke={C.white} strokeDasharray="4 4" strokeOpacity={0.3} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <Divider label="Tipo × Gamestate — Heatmap de Impacto" />
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:6, minWidth:400 }}>
          <thead>
            <tr>
              <th style={{ color:C.gray, fontSize:11, textAlign:"left", padding:"4px 10px" }}>Tipo</th>
              {["Ganando","Empatando","Perdiendo"].map(gs => (
                <th key={gs} style={{ color:C.cream, fontSize:12, fontWeight:700, padding:"6px 10px", textAlign:"center" }}>{gs}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.heatmap?.map((row,i) => (
              <tr key={i}>
                <td style={{ color:C.gold, fontWeight:700, fontSize:13, padding:"6px 10px" }}>{row.tipo}</td>
                {["gan","emp","per"].map(gs => {
                  const cell = row[gs];
                  const v = cell.imp;
                  const bg = v>=1.5?`${C.green}55`:v>=0.5?`${C.gold}30`:v>0?`${C.gold}14`:`${C.white}06`;
                  const tc = v>=1.5?C.greenL:v>=0.5?C.gold:C.gray;
                  return (
                    <td key={gs} style={{ background:bg, borderRadius:6, padding:"10px", textAlign:"center", minWidth:90 }}>
                      <div style={{ color:tc, fontSize:18, fontWeight:800 }}>{v>=0?`+${v.toFixed(2)}`:v.toFixed(2)}</div>
                      <div style={{ color:C.gray, fontSize:10, marginTop:2 }}>n={cell.n}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:14 }}>
        {d.notasSubs?.map((n,i) => n.tipo==="alerta"
          ? <Alert key={i}>{n.txt}</Alert>
          : <Info key={i}>{n.txt}</Info>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: GOLES POR FRANJA
// ═══════════════════════════════════════════════════════════════
function SecGoles({ d }) {
  const [vista, setVista] = useState("comparativa");
  return (
    <>
      <Divider label="Distribución de Goles por Franja" />
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["comparativa","vs Pumas"],["equipo","Solo rival"]].map(([id,lbl]) => (
          <button key={id} onClick={()=>setVista(id)}
            style={{ padding:"4px 16px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
                     background: vista===id ? C.gold : `${C.white}12`, color: vista===id ? C.navy : C.grayL }}>
            {lbl}
          </button>
        ))}
      </div>

      {vista === "comparativa" && (
        <div style={{ height:250 }}>
          <ResponsiveContainer>
            <BarChart data={d.franjasGoles} margin={{top:5,right:10,left:-15,bottom:0}} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.white}08`} vertical={false} />
              <XAxis dataKey="f" tick={{fill:C.cream, fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:C.gray, fontSize:10}} axisLine={false} tickLine={false} />
              <TT />
              <Legend wrapperStyle={{color:C.gray, fontSize:10}} />
              <Bar dataKey="pumGF" name="Pumas GF" fill={C.gold}            radius={[3,3,0,0]} />
              <Bar dataKey="pumGC" name="Pumas GC" fill={`${C.gold}44`}     radius={[3,3,0,0]} />
              <Bar dataKey="gf"    name="Rival GF"  fill={C.blue}            radius={[3,3,0,0]} />
              <Bar dataKey="gc"    name="Rival GC"  fill={`${C.blue}55`}     radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {vista === "equipo" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[["GF","gf",C.greenL],["GC","gc",C.redL]].map(([lbl,key,color]) => (
            <div key={lbl}>
              <div style={{ color, fontWeight:700, fontSize:12, marginBottom:10, letterSpacing:0.5 }}>Goles {lbl}</div>
              {d.franjasGoles?.map((f,i) => {
                const max = Math.max(...d.franjasGoles.map(x=>x[key]));
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                    <span style={{ color:C.gray, fontSize:11, width:44 }}>{f.f}</span>
                    <div style={{ flex:1, background:`${C.white}08`, borderRadius:3, height:7 }}>
                      <div style={{ background: f[key]===max ? color : `${color}77`,
                                    width:`${max>0?f[key]/max*100:0}%`, height:"100%", borderRadius:3,
                                    transition:"width 0.5s ease" }} />
                    </div>
                    <span style={{ color: f[key]===max?color:C.cream, fontWeight:700, fontSize:14, width:18, textAlign:"right" }}>{f[key]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:14 }}>
        {d.notasGoles?.map((n,i) => n.tipo==="alerta"
          ? <Alert key={i}>{n.txt}</Alert>
          : <Info key={i}>{n.txt}</Info>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: LOCAL VS VISITA
// ═══════════════════════════════════════════════════════════════
function SecLocalVisita({ d }) {
  const lv = [
    { lbl:"LOCAL",  r:d.local,  gs:d.gamestates.local,  color:C.greenL },
    { lbl:"VISITA", r:d.visita, gs:d.gamestates.visita, color:C.goldL  },
  ];
  const gsComp = [
    { name:"Ganando",   local:d.gamestates.local.gan, visita:d.gamestates.visita.gan },
    { name:"Empatando", local:d.gamestates.local.emp, visita:d.gamestates.visita.emp },
    { name:"Perdiendo", local:d.gamestates.local.per, visita:d.gamestates.visita.per },
  ];

  return (
    <>
      <Divider label="Local vs Visita" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {lv.map(({lbl,r,gs,color}) => (
          <div key={lbl} style={{ background:C.navyL, borderRadius:8, padding:"16px",
                                   border:`1px solid ${color}30` }}>
            <div style={{ color, fontWeight:800, fontSize:14, letterSpacing:1, marginBottom:12 }}>{lbl}</div>
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <KPI label="Record" value={`${r.G}V${r.E}E${r.P}D`} sub={`${r.pts} pts`} small accent={color} />
              <KPI label="Pts/PJ" value={r.pj>0?(r.pts/r.pj).toFixed(2):"—"} small accent={color} />
            </div>
            {[["Ganando",gs.gan,C.green],["Empatando",gs.emp,C.gold],["Perdiendo",gs.per,C.red]].map(([n,v,c]) => (
              <div key={n} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ color:C.gray, fontSize:10, width:62 }}>{n}</span>
                <div style={{ flex:1, background:`${C.white}08`, borderRadius:3, height:6 }}>
                  <div style={{ background:c, width:`${v}%`, height:"100%", borderRadius:3 }} />
                </div>
                <span style={{ color, fontWeight:700, fontSize:12, width:38, textAlign:"right" }}>{v}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ height:180, marginTop:20 }}>
        <ResponsiveContainer>
          <BarChart data={gsComp} margin={{top:5,right:10,left:-15,bottom:0}} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.white}08`} vertical={false} />
            <XAxis dataKey="name" tick={{fill:C.cream, fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:C.gray, fontSize:10}} axisLine={false} tickLine={false} unit="%" domain={[0,60]} />
            <TT formatter={v=>`${v}%`} />
            <Legend wrapperStyle={{color:C.gray, fontSize:11}} />
            <Bar dataKey="local"  name="Local"   fill={C.greenL} radius={[3,3,0,0]} />
            <Bar dataKey="visita" name="Visita"  fill={C.goldL}  radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop:14 }}>
        {d.notasLV?.map((n,i) => n.tipo==="alerta"
          ? <Alert key={i}>{n.txt}</Alert>
          : <Info key={i}>{n.txt}</Info>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: BANCO
// ═══════════════════════════════════════════════════════════════
function SecBanco({ d }) {
  return (
    <>
      <Divider label="Jugadoras Clave del Banco" />
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {d.banco?.map((j,i) => (
          <div key={i} style={{
            background: i<2 ? `${C.red}15` : C.navyL,
            border:`1px solid ${i<2 ? C.red : C.white}18`,
            borderRadius:7, padding:"12px 16px",
            display:"grid", gridTemplateColumns:"34px 1fr 64px 64px 64px 64px",
            alignItems:"center", gap:10
          }}>
            <span style={{ background:POS_COLOR[j.p], color:C.white, fontSize:10,
                           fontWeight:800, padding:"3px 0", borderRadius:4, textAlign:"center" }}>{j.p}</span>
            <div>
              <div style={{ color:C.cream, fontWeight:700, fontSize:13 }}>{j.n}</div>
              <div style={{ color:C.gray, fontSize:10, marginTop:2 }}>{j.ent} entradas · GS: {j.gs}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:C.gray, fontSize:9 }}>Imp.Total</div>
              <div style={{ color:C.gold, fontWeight:800, fontSize:17 }}>+{j.impT}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:C.gray, fontSize:9 }}>Imp.Prom</div>
              <div style={{ color:j.impP>=1.5?C.redL:C.cream, fontWeight:700, fontSize:14 }}>+{j.impP.toFixed(2)}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:C.gray, fontSize:9 }}>Rat.Sup</div>
              <div style={{ color:j.rat>=7.5?C.gold:C.cream, fontWeight:700, fontSize:14 }}>{j.rat}</div>
            </div>
            <div style={{ height:40, display:"flex", alignItems:"flex-end" }}>
              <div style={{ width:"100%", background:`${C.white}08`, borderRadius:4, height:40, overflow:"hidden",
                            display:"flex", alignItems:"flex-end" }}>
                <div style={{ background:i===0?C.gold:i===1?C.greenL:C.blue,
                              width:"100%", height:`${Math.max(j.impT,0)/6*100}%`, transition:"height 0.5s ease" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12 }}>
        {d.notasBanco?.map((n,i) => n.tipo==="alerta"
          ? <Alert key={i}>{n.txt}</Alert>
          : <Info key={i}>{n.txt}</Info>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: FORMA RECIENTE
// ═══════════════════════════════════════════════════════════════
function SecForma({ d }) {
  const sorted = [...(d.forma||[])].sort((a,b) => (b.d||0)-(a.d||0));
  const chartData = sorted.filter(j => j.prev !== null);

  return (
    <>
      <Divider label="Forma Reciente — J8-J10 vs J1-J7" />
      <div style={{ height:230 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{top:5,right:10,left:-15,bottom:32}} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.white}08`} vertical={false} />
            <XAxis dataKey="n" tick={{fill:C.cream, fontSize:9}} angle={-35} textAnchor="end"
                   axisLine={false} tickLine={false} />
            <YAxis tick={{fill:C.gray, fontSize:9}} axisLine={false} tickLine={false} domain={[5.5,9.5]} />
            <TT />
            <ReferenceLine y={7} stroke={C.gold} strokeDasharray="4 4" strokeOpacity={0.5} />
            <Legend wrapperStyle={{color:C.gray, fontSize:10}} />
            <Bar dataKey="prev" name="J1–J7" fill={`${C.white}25`} radius={[3,3,0,0]} />
            <Bar dataKey="ult"  name="J8–J10" radius={[3,3,0,0]}>
              {chartData.map((e,i) => <Cell key={i} fill={e.d>=0 ? C.greenL : C.redL} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:8 }}>
        {sorted.map((j,i) => (
          <div key={i} style={{
            background: (j.d||0)>=0.3?`${C.green}15`:(j.d||0)<=-0.4?`${C.red}14`:C.navyL,
            borderRadius:6, padding:"8px 12px",
            display:"grid", gridTemplateColumns:"30px 1fr 52px 52px 70px 80px",
            alignItems:"center", gap:8
          }}>
            <span style={{ background:POS_COLOR[j.p], color:C.white, fontSize:9,
                           fontWeight:800, padding:"2px 0", borderRadius:3, textAlign:"center" }}>{j.p}</span>
            <span style={{ color:C.cream, fontWeight:600, fontSize:12 }}>{j.n}</span>
            <span style={{ color:C.gray, fontSize:11, textAlign:"right" }}>{j.prev ? j.prev.toFixed(2) : "nueva"}</span>
            <span style={{ color:(j.d||0)>=0?C.greenL:C.redL, fontWeight:700, fontSize:13, textAlign:"right" }}>{j.ult.toFixed(2)}</span>
            <span style={{ color:(j.d||0)>=0?C.greenL:C.redL, fontWeight:800, fontSize:12, textAlign:"right" }}>
              {j.d !== null ? ((j.d>=0?"+":"")+j.d.toFixed(2)) : "—"}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
              <span style={{ fontSize:12 }}>{(j.d||0)>=0.2?"▲":(j.d||0)<=-0.2?"▼":"→"}</span>
              <span style={{ color:C.gray, fontSize:10 }}>
                {(j.d||0)>=0.4?"Subiendo":(j.d||0)<=-0.4?"Bajando":"Estable"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12 }}>
        {d.notasForma?.map((n,i) => n.tipo==="alerta"
          ? <Alert key={i}>{n.txt}</Alert>
          : <Info key={i}>{n.txt}</Info>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const SECTIONS = [
  { id:"resumen",    label:"Resumen" },
  { id:"xi",         label:"XI Tipo" },
  { id:"subs",       label:"Sustituciones" },
  { id:"goles",      label:"Goles" },
  { id:"lv",         label:"Local vs Visita" },
  { id:"banco",      label:"Banco" },
  { id:"forma",      label:"Forma" },
];

export default function App() {
  const [equipo, setEquipo] = useState("Toluca");
  const [showPicker, setShowPicker] = useState(false);
  const [active, setActive] = useState("resumen");
  const sectionRefs = useRef({});
  const d = DATA[equipo];
  const isPending = d.status === "pending";

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior:"smooth", block:"start" });
    setActive(id);
  };

  return (
    <div style={{ background:C.navy, minHeight:"100vh", fontFamily:"'Georgia', serif", color:C.cream }}>

      {/* ── HEADER ── */}
      <div style={{ background:`linear-gradient(135deg, ${C.navyL} 0%, ${C.navy} 100%)`,
                    borderBottom:`2px solid ${C.gold}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ padding:"14px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ color:C.gold, fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>
              Fanalytics MX · Scouting LMXF
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:3 }}>
              <button onClick={()=>setShowPicker(!showPicker)}
                style={{ background:"none", border:`1px solid ${C.gold}55`, borderRadius:6, cursor:"pointer",
                         padding:"3px 12px 3px 10px", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ color:C.cream, fontSize:20, fontWeight:800 }}>{equipo}</span>
                <span style={{ color:C.gold, fontSize:12 }}>▾</span>
              </button>
              {!isPending && (
                <div style={{ display:"flex", gap:6 }}>
                  <Tag color={C.greenL}>{d.record.G}G</Tag>
                  <Tag color={C.gold}>{d.record.E}E</Tag>
                  <Tag color={C.redL}>{d.record.P}P</Tag>
                  <span style={{ color:C.gold, fontWeight:800, fontSize:16 }}>{d.record.pts} pts</span>
                </div>
              )}
            </div>
            <div style={{ color:C.gray, fontSize:11, marginTop:2 }}>{d.torneo}</div>
          </div>
          <div style={{ color:C.gray, fontSize:10, textAlign:"right", paddingTop:4 }}>
            vs Pumas · referencia CL25
          </div>
        </div>

        {/* Dropdown equipos */}
        {showPicker && (
          <div style={{ position:"absolute", top:"100%", left:20, background:C.navyL,
                        border:`1px solid ${C.gold}44`, borderRadius:8, padding:8,
                        display:"flex", flexWrap:"wrap", gap:4, maxWidth:560, zIndex:200, boxShadow:"0 8px 24px #00000060" }}>
            {EQUIPOS.map(eq => (
              <button key={eq} onClick={()=>{ setEquipo(eq); setShowPicker(false); }}
                style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
                         background: eq===equipo ? C.gold : DATA[eq].status==="real" ? `${C.green}22` : `${C.white}10`,
                         color: eq===equipo ? C.navy : DATA[eq].status==="real" ? C.greenL : C.gray }}>
                {eq} {DATA[eq].status==="real" ? "●" : ""}
              </button>
            ))}
            <div style={{ width:"100%", color:C.gray, fontSize:10, padding:"4px 4px 0" }}>
              ● datos disponibles · resto pendientes
            </div>
          </div>
        )}

        {/* Nav anclas */}
        {!isPending && (
          <div style={{ display:"flex", gap:0, overflowX:"auto", padding:"8px 20px 0",
                        borderTop:`1px solid ${C.gold}15`, marginTop:8 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={()=>scrollTo(s.id)}
                style={{ padding:"5px 14px", border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
                         background:"transparent", color: active===s.id ? C.gold : C.gray,
                         borderBottom: active===s.id ? `2px solid ${C.gold}` : "2px solid transparent",
                         whiteSpace:"nowrap", transition:"all 0.2s" }}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding:"20px 20px 60px", maxWidth:860, margin:"0 auto" }}>
        {isPending ? (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <div style={{ color:C.gold, fontSize:40, marginBottom:16 }}>⏳</div>
            <div style={{ color:C.cream, fontSize:20, fontWeight:700, marginBottom:8 }}>
              Datos pendientes
            </div>
            <div style={{ color:C.gray, fontSize:14 }}>
              El análisis de <strong style={{color:C.gold}}>{equipo}</strong> estará disponible
              una vez que se procese el archivo de partidos del torneo.
            </div>
            <div style={{ marginTop:24, color:C.gray, fontSize:12 }}>
              Sube el archivo <code style={{color:C.goldL}}>Partidos_{equipo.replace(/ /g,"_")}_CL26.xlsx</code> para generar el reporte.
            </div>
          </div>
        ) : (
          <>
            {SECTIONS.map(s => (
              <div key={s.id} ref={el => sectionRefs.current[s.id] = el}
                style={{ scrollMarginTop:120 }}>
                {s.id==="resumen" && <SecResumen d={d} />}
                {s.id==="xi"      && <SecXI d={d} />}
                {s.id==="subs"    && <SecSubs d={d} />}
                {s.id==="goles"   && <SecGoles d={d} />}
                {s.id==="lv"      && <SecLocalVisita d={d} />}
                {s.id==="banco"   && <SecBanco d={d} />}
                {s.id==="forma"   && <SecForma d={d} />}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${C.gold}25`, padding:"12px 20px",
                    color:C.gray, fontSize:10, textAlign:"center" }}>
        Fanalytics MX · {d.torneo} · Fuente: SofaScore + Informes Arbitrales LMXF
      </div>
    </div>
  );
}
