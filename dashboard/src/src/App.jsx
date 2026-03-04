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
// DATOS — TOLUCA CL26 (reales, J1-J10)
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
  },

  // ── TIJUANA — datos reales CL26 J1-J10 ───────────────────────
  "Tijuana": {
    torneo: "Clausura 2026 · J1–J10",
    status: "real",
    record: { G:4, E:3, P:3, pts:15, pj:10, gf:17, gc:16 },
    local:  { G:2, E:2, P:1, pts:8,  pj:5,  gf:10, gc:7  },
    visita: { G:2, E:1, P:2, pts:7,  pj:5,  gf:7,  gc:9  },
    primeGol: { favor:"pendiente", contra:"pendiente" },
    subsPorPartido: 4.7,
    formaciones: [
      { form:"1-4-1-3-2", pj:6, v:2, e:2, d:2, pts:8, gf:10, gc:10, contexto:"Formación base de Samayoa" },
      { form:"1-4-4-2",   pj:3, v:2, e:1, d:0, pts:7, gf:6,  gc:4,  contexto:"Variante en partidos claves" },
    ],
    gamestates: {
      global: { gan:36, emp:30, per:34 },
      local:  { gan:42, emp:42, per:16 },
      visita: { gan:30, emp:17, per:52 },
    },
    franjasSubs: [
      { franja:"31-45'", n:3,  imp:-0.67 },
      { franja:"46-60'", n:5,  imp:1.00  },
      { franja:"61-75'", n:16, imp:0.06  },
      { franja:"76-90'", n:23, imp:0.09  },
    ],
    heatmap: [
      { tipo:"Ofensivo",  gan:{n:0,imp:0.00}, emp:{n:0,imp:0.00}, per:{n:1,imp:3.00} },
      { tipo:"Medio",     gan:{n:16,imp:-0.50}, emp:{n:14,imp:0.14}, per:{n:13,imp:0.69} },
      { tipo:"Defensivo", gan:{n:1,imp:0.00}, emp:{n:0,imp:0.00}, per:{n:2,imp:0.00} },
    ],
    franjasGoles: [
      { f:"1-15'",  gf:2, gc:3, pumGF:0, pumGC:3 },
      { f:"16-30'", gf:3, gc:2, pumGF:3, pumGC:2 },
      { f:"31-45'", gf:3, gc:3, pumGF:6, pumGC:4 },
      { f:"46-60'", gf:3, gc:2, pumGF:2, pumGC:1 },
      { f:"61-75'", gf:2, gc:3, pumGF:1, pumGC:1 },
      { f:"76-90'", gf:4, gc:3, pumGF:1, pumGC:4 },
    ],
    banco: [
      { n:"Roselord Borgella",    p:"M", ent:2, impT:2,  impP:1.67, rat:6.85, gs:"Empatando" },
      { n:"Naomi Rojo",           p:"M", ent:2, impT:2,  impP:1.00, rat:null, gs:"Ganando" },
      { n:"Briana I. Chagolla",   p:"M", ent:4, impT:3,  impP:0.75, rat:null, gs:"Ganando" },
      { n:"Kassandra Ceja",       p:"F", ent:3, impT:0,  impP:0.00, rat:null, gs:"Ganando" },
      { n:"Danielle Fuentes",     p:"M", ent:5, impT:1,  impP:0.20, rat:6.98, gs:"Perdiendo" },
      { n:"Claudia Ibarra",       p:"M", ent:4, impT:0,  impP:0.00, rat:null, gs:"Perdiendo" },
      { n:"Inglis Hernández",     p:"M", ent:5, impT:-2, impP:-0.40,rat:null, gs:"Perdiendo" },
      { n:"Bibiana Quintos",      p:"D", ent:5, impT:-2, impP:-0.40,rat:null, gs:"Ganando" },
    ],
    xi: [
      { n:"Ana Gaby Paz",                    p:"G", pj:"9/10", rat:6.80, nota:"Titular indiscutida · consistente" },
      { n:"Jazmín Enrigue",                  p:"D", pj:"9/10", rat:6.92, nota:"En ascenso últimas 3J (+0.42)" },
      { n:"Deisy Ojeda",                     p:"D", pj:"8/10", rat:7.28, nota:"Segunda mejor del equipo · en caída (−0.77)" },
      { n:"Michel J. Fong Camargan",         p:"D", pj:"9/10", rat:6.61, nota:"Lateral fija" },
      { n:"Laura Parra",                     p:"D", pj:"5/10", rat:6.52, nota:"Rota con Bibiana Quintos" },
      { n:"Amogelang Motau",                 p:"M", pj:"9/10", rat:6.79, nota:"Sale frecuentemente en 76-90'" },
      { n:"Daniela Carrandi",                p:"M", pj:"9/10", rat:6.69, nota:"La que más sale (8x) · sale perdiendo" },
      { n:"Dana Sandoval",                   p:"M", pj:"8/10", rat:6.84, nota:"Sale 6x · en ascenso (+0.37)" },
      { n:"Ammanda Marroquin",               p:"M", pj:"7/10", rat:6.71, nota:"Sale y entra frecuentemente" },
      { n:"Roselord Borgella",               p:"M", pj:"6/10", rat:6.85, nota:"Mejor del banco · 1.67 imp prom" },
      { n:"Kader Hançar",                    p:"F", pj:"10/10", rat:7.50, nota:"⭐ Mejor del torneo · 7.50 avg · en ascenso (+0.33)" },
    ],
    forma: [
      { n:"Kader Hançar",        p:"F", prev:7.40, ult:7.73, d:+0.33 },
      { n:"Jazmín Enrigue",      p:"D", prev:6.78, ult:7.20, d:+0.42 },
      { n:"Dana Sandoval",       p:"M", prev:6.70, ult:7.07, d:+0.37 },
      { n:"Daniela Carrandi",    p:"M", prev:6.58, ult:6.90, d:+0.32 },
      { n:"Michel J. Fong",      p:"D", prev:6.56, ult:6.80, d:+0.24 },
      { n:"Danielle Fuentes",    p:"M", prev:6.90, ult:7.10, d:+0.20 },
      { n:"Claudia Ibarra",      p:"M", prev:6.63, ult:6.85, d:+0.22 },
      { n:"Amogelang Motau",     p:"M", prev:6.79, ult:6.80, d:+0.01 },
      { n:"Ana Gaby Paz",        p:"G", prev:6.80, ult:6.80, d:0.00  },
      { n:"Ammanda Marroquin",   p:"M", prev:6.72, ult:6.70, d:-0.02 },
      { n:"Laura Parra",         p:"D", prev:6.73, ult:6.20, d:-0.53 },
      { n:"Deisy Ojeda",         p:"D", prev:7.50, ult:6.73, d:-0.77 },
    ],
    alertas: [
      "49% de los cambios de Samayoa ocurren en los últimos 15 minutos — el DT más tardío analizado.",
      "GANANDO hace cambios que le cuestan (−0.47 imp): saca a sus mejores y mete a Quintos/Hernández.",
      "Kader Hançar titular en los 10 partidos · 7.50 avg · en su mejor momento del torneo.",
      "Sus sustituciones confirman partidos, no los cambian: GANANDO→V, EMPATANDO→E, PERDIENDO→D.",
    ],
    hallazgos: [
      "91% de sus cambios son Medio — rota mismo perfil, no redefine planteamiento.",
      "Solo 1 cambio ofensivo en 10 partidos — el menos creativo tácticamente.",
      "Daniela Carrandi es la que más sale (8x) · en los tres gamestates · siempre en 61-90'.",
      "Dupla recurrente: Kader Hançar → Kassandra Ceja (3x, siempre ganando) — señal de cierre de partido.",
      "De visita llega PERDIENDO en el 52% de los minutos jugados.",
      "Roselord Borgella: mejor del banco (1.67 imp) · entra empatando · única carta real para buscar ganar.",
      "Inglis Hernández y Bibiana Quintos: las que más entran con peor resultado (−0.40 cada una).",
      "EMPATANDO: 100% cambios Medio · mediana min 76 · termina igual en 10 de 14 casos — sin ideas para ganar.",
      "PERDIENDO: llega tarde (mediana min 77) · solo convierte 4 de 16 cambios en victoria.",
      "GANANDO: cuando saca a Borgella/Hançar y mete a Quintos, el equipo queda vulnerable al contraataque.",
    ],
  },

  // ── RESTO DE EQUIPOS (arquitectura lista, datos pendientes) ──────────
  ...[
    "Tigres UANL","Chivas","América","Pumas UNAM","Monterrey",
    "Atlas","Pachuca","Santos Laguna","Necaxa","FC Juárez",
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

      {/* Filtro posición */}
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

      {/* Formaciones */}
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
        <Info>48% de los cambios ocurren en la franja 46-60' — los más tempranos de la liga analizada.</Info>
        <Info>Lair hace dobles o triples cambios simultáneos al descanso cuando el marcador está igualado.</Info>
        <Alert>Ganando en cualquier tipo: impacto +0.00. El banco de Toluca conserva ventajas, no las amplía.</Alert>
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
        <Alert>Franja 31-45': Pumas anota 6 GF · Toluca recibe 5 GC — el cruce más relevante del análisis.</Alert>
        <Alert>Franja 76-90': Toluca explota (7 GF) y Pumas recibe más (4 GC) — tramo de mayor peligro.</Alert>
        <Info>Toluca concedió solo 1 gol en la franja 46-75' — 30 minutos casi impermeables.</Info>
        <Info>32% de los goles de Toluca llegan en los últimos 15 minutos.</Info>
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
            {/* Mini gamestates */}
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
        <Info>Toluca rinde MEJOR de visita (2.25 pts/PJ) que de local (2.17 pts/PJ) — patrón inusual.</Info>
        <Info>De visita empatando: +2.00 impacto promedio por cambio — su combinación más efectiva del torneo.</Info>
        <Info>De local el banco es menos efectivo (+0.70 empatando). Los partidos en casa los resuelve el XI.</Info>
        <Alert>El partido contra Pumas es de LOCAL para Toluca. Lair viene al estadio Nemesio Díez a ganar desde el arranque.</Alert>
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
            {/* Micro bar */}
            <div style={{ height:40, display:"flex", alignItems:"flex-end" }}>
              <div style={{ width:"100%", background:`${C.white}08`, borderRadius:4, height:40, overflow:"hidden",
                            display:"flex", alignItems:"flex-end" }}>
                <div style={{ background:i===0?C.gold:i===1?C.greenL:C.blue,
                              width:"100%", height:`${j.impT/6*100}%`, transition:"height 0.5s ease" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12 }}>
        <Info>Cinthya Peraza y Itzel Muñoz rinden mejor de suplentes que de titulares.</Info>
        <Info>Yaneisy Rodríguez sale empatando 3/5 veces — cuando sale, entra siempre un perfil ofensivo.</Info>
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
        <Alert>Le Sommer (−0.88) y Peraza (−0.45): las dos principales amenazas llegan en descenso.</Alert>
        <Alert>Amandine Henry (−0.53): el pivote inamovible en su peor racha del torneo.</Alert>
        <Info>Valeria Martínez (+0.67): portera en mejor momento. Jakobsson (7.85): irrupción sin historial previo.</Info>
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
