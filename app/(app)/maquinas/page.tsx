"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ────────────────────────────────────────────────────────────────────

type Deal = {
  id: string; nombre: string; etapa: string; businessDeveloper: string | null;
  pedidosMensuales: number | null; ticketPromedio: number | null; tarifaPorPedido: number | null;
  monto: number | null; moneda: string; sucursales: string | null; tipoPlan: string | null;
  modeloCobro: string | null; fechaOnboarding: string | null; updatedAt: string; fechaCierre: string | null;
};

type MetaMensual = { id: string; mes: string; tipo: string; assignee: string; objetivo: number };

type Reunion = {
  id: string; fecha: string; bdNombre: string; dealNombre: string | null; realizada: boolean;
};

type CompromisoSemanal = {
  id: string; semana: string; bdNombre: string;
  compromisoReuniones: number; logradoReuniones: boolean;
  compromisoPedidos: number; logradoPedidos: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES_LABEL: Record<string, string> = {
  "01":"Enero","02":"Febrero","03":"Marzo","04":"Abril","05":"Mayo","06":"Junio",
  "07":"Julio","08":"Agosto","09":"Septiembre","10":"Octubre","11":"Noviembre","12":"Diciembre",
};
const ALL_MESES_2026 = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06",
                         "2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"];
const BDS = ["José Tomás Costa","Manuel del Río","Rubén Quintero"];

function getMesActual() {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function getSemanaActual() {
  const now = new Date();
  const year = now.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const dayNum = Math.floor((now.getTime() - jan4.getTime()) / 86400000);
  const week = Math.ceil((dayNum + jan4.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2,"0")}`;
}
function getISOSemana(d: Date): string {
  const year = d.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const dayNum = Math.floor((d.getTime() - jan4.getTime()) / 86400000);
  const week = Math.ceil((dayNum + jan4.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2,"0")}`;
}
function semanaLabel(s: string) {
  const [y, w] = s.split("-W");
  const year = Number(y), week = Number(w);
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dow + 1 + (week - 1) * 7);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day:"numeric", month:"short" });
  return `Sem ${week} · ${fmt(monday)}–${fmt(sunday)}`;
}
function semanasDelMes(mes: string): string[] {
  const [y, m] = mes.split("-").map(Number);
  const semanas: string[] = [];
  const start = new Date(y, m-1, 1);
  const end = new Date(y, m, 0);
  let d = new Date(start);
  while (d <= end) {
    const s = getISOSemana(d);
    if (!semanas.includes(s)) semanas.push(s);
    d.setDate(d.getDate() + 7);
  }
  return semanas;
}
function semanasList(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i * 7);
    result.push(getISOSemana(d));
  }
  return [...new Set(result)];
}
function mesLabel(mes: string) {
  const [, m] = mes.split("-"); return MESES_LABEL[m] ?? mes;
}
function fmtCLP(n: number | null | undefined) {
  if (!n) return "—";
  return new Intl.NumberFormat("es-CL", { style:"currency", currency:"CLP", maximumFractionDigits:0 }).format(n);
}
function fmtNum(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CL").format(n);
}
function mesContiene(fecha: string, mes: string): boolean {
  return fecha.startsWith(mes);
}
function getMesDesde(mes: string): Date {
  const [y,m] = mes.split("-").map(Number); return new Date(y, m-1, 1);
}
function getMesHasta(mes: string): Date {
  const [y,m] = mes.split("-").map(Number); return new Date(y, m, 1);
}

// ─── Filtro Fecha ─────────────────────────────────────────────────────────────

type FiltroState = { tipo: "mes" | "semana"; mes: string; semana: string };

function FiltroFecha({ filtro, onChange }: { filtro: FiltroState; onChange: (f: FiltroState) => void }) {
  const semanas = semanasList();
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", backgroundColor:"#fff", borderRadius:12, border:"1px solid #E1E0E0", marginBottom:20, flexWrap:"wrap" }}>
      <span style={{ fontSize:13, fontWeight:700, color:"#555" }}>Ver por:</span>
      {(["mes","semana"] as const).map((t) => (
        <button key={t} onClick={() => onChange({ ...filtro, tipo:t })} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${filtro.tipo===t ? "#4548FF" : "#E1E0E0"}`, backgroundColor: filtro.tipo===t ? "#4548FF" : "#fff", color: filtro.tipo===t ? "#fff" : "#555", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          {t === "mes" ? "Mes" : "Semana"}
        </button>
      ))}
      <div style={{ width:1, height:24, backgroundColor:"#E1E0E0" }} />
      {filtro.tipo === "mes" ? (
        <>
          <button onClick={() => { const idx=ALL_MESES_2026.indexOf(filtro.mes); if(idx>0) onChange({...filtro,mes:ALL_MESES_2026[idx-1]}) }} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #E1E0E0", backgroundColor:"#fff", cursor:"pointer", fontSize:14 }}>◀</button>
          <select value={filtro.mes} onChange={(e) => onChange({ ...filtro, mes:e.target.value })} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid #E1E0E0", fontSize:13, fontWeight:600, color:"#121755" }}>
            {ALL_MESES_2026.map((m) => <option key={m} value={m}>{mesLabel(m)} 2026</option>)}
          </select>
          <button onClick={() => { const idx=ALL_MESES_2026.indexOf(filtro.mes); if(idx<11) onChange({...filtro,mes:ALL_MESES_2026[idx+1]}) }} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #E1E0E0", backgroundColor:"#fff", cursor:"pointer", fontSize:14 }}>▶</button>
        </>
      ) : (
        <select value={filtro.semana} onChange={(e) => onChange({ ...filtro, semana:e.target.value })} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid #E1E0E0", fontSize:13, fontWeight:600, color:"#121755" }}>
          {semanas.map((s) => <option key={s} value={s}>{semanaLabel(s)}</option>)}
        </select>
      )}
      <span style={{ marginLeft:"auto", fontSize:12, color:"#aaa" }}>
        {filtro.tipo==="mes" ? `${mesLabel(filtro.mes)} 2026` : semanaLabel(filtro.semana)}
      </span>
    </div>
  );
}

// ─── Tab: Seguimiento ─────────────────────────────────────────────────────────

function TabSeguimiento({ deals, metas, reuniones, filtro }: {
  deals: Deal[]; metas: MetaMensual[]; reuniones: Reunion[]; filtro: FiltroState;
}) {
  const [subTab, setSubTab] = useState<"equipo" | "jt" | "manuel" | "ruben">("equipo");
  const periodo = filtro.mes;

  function getMeta(tipo: string, assignee: string, mes: string) {
    return metas.find((m) => m.mes === mes && m.tipo === tipo && m.assignee === assignee)?.objetivo ?? null;
  }
  function getActualReuniones(bd: string, mes: string): number {
    const start = getMesDesde(mes), end = getMesHasta(mes);
    return reuniones.filter((r) => r.bdNombre === bd && r.realizada && new Date(r.fecha) >= start && new Date(r.fecha) < end).length;
  }
  function getActualCierres(bd: string, mes: string): number {
    const start = getMesDesde(mes), end = getMesHasta(mes);
    return deals.filter((d) => {
      if (d.businessDeveloper !== bd) return false;
      if (!d.etapa.toLowerCase().includes("cierre ganado")) return false;
      const f = d.fechaCierre ? new Date(d.fechaCierre) : new Date(d.updatedAt);
      return f >= start && f < end;
    }).length;
  }

  const mesesVisible = ALL_MESES_2026.filter((m) => m <= periodo);

  const SUB_TABS = [
    { id: "equipo" as const, label: "Equipo" },
    { id: "jt" as const, label: "José Tomás", bd: "José Tomás Costa" },
    { id: "manuel" as const, label: "Manuel", bd: "Manuel del Río" },
    { id: "ruben" as const, label: "Rubén", bd: "Rubén Quintero" },
  ];

  const bdForSubTab = SUB_TABS.find((t) => t.id === subTab)?.bd;

  return (
    <div>
      {/* Resumen del mes — top cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {BDS.map((bd) => {
          const ar = getActualReuniones(bd, periodo);
          const mr = getMeta("reuniones", bd, periodo) ?? 0;
          const ac = getActualCierres(bd, periodo);
          const mc = getMeta("cierres", bd, periodo) ?? 0;
          const isActive = SUB_TABS.find((t) => t.bd === bd)?.id === subTab;
          return (
            <button key={bd} onClick={() => setSubTab(SUB_TABS.find((t) => t.bd === bd)!.id)} style={{ backgroundColor:"#fff", border:`2px solid ${isActive ? "#4548FF" : "#E1E0E0"}`, borderRadius:12, padding:"16px 20px", textAlign:"left", cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", backgroundColor: isActive ? "#4548FF" : "#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color: isActive ? "#fff" : "#4548FF" }}>{bd.charAt(0)}</div>
                <span style={{ fontSize:13, fontWeight:600, color:"#121755" }}>{bd.split(" ")[0]}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Reuniones</div>
                  <div style={{ fontSize:18, fontWeight:700, color: ar >= mr ? "#16a34a" : "#dc2626" }}>{ar}<span style={{ fontSize:12, color:"#aaa", fontWeight:400 }}>/{mr}</span></div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Cierres</div>
                  <div style={{ fontSize:18, fontWeight:700, color: ac >= mc && mc > 0 ? "#16a34a" : "#dc2626" }}>{ac}<span style={{ fontSize:12, color:"#aaa", fontWeight:400 }}>/{mc}</span></div>
                </div>
              </div>
            </button>
          );
        })}
        {/* Equipo total */}
        <button onClick={() => setSubTab("equipo")} style={{ backgroundColor:"#121755", border:`2px solid ${subTab === "equipo" ? "#F7DC4B" : "#121755"}`, borderRadius:12, padding:"16px 20px", textAlign:"left", cursor:"pointer" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Total Equipo</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:600, textTransform:"uppercase" }}>Reuniones</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#F7DC4B" }}>{BDS.reduce((s,b)=>s+getActualReuniones(b,periodo),0)}<span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:400 }}>/{BDS.reduce((s,b)=>s+(getMeta("reuniones",b,periodo)??0),0)}</span></div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:600, textTransform:"uppercase" }}>Cierres</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#F7DC4B" }}>{BDS.reduce((s,b)=>s+getActualCierres(b,periodo),0)}<span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:400 }}>/{BDS.reduce((s,b)=>s+(getMeta("cierres",b,periodo)??0),0)}</span></div>
            </div>
          </div>
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:"flex", gap:2, marginBottom:16, borderBottom:"1.5px solid #E1E0E0" }}>
        {SUB_TABS.map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{ padding:"7px 16px", borderRadius:"7px 7px 0 0", border:"none", backgroundColor: subTab===t.id ? "#EEF2FF" : "transparent", color: subTab===t.id ? "#4548FF" : "#666", fontWeight: subTab===t.id ? 700 : 500, fontSize:13, cursor:"pointer", fontFamily:"'Inter', sans-serif", borderBottom: subTab===t.id ? "2px solid #4548FF" : "2px solid transparent", marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Equipo: tabla histórica */}
      {subTab === "equipo" && (
        <div>
          <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"auto" }}>
            <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
              <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:15, fontWeight:700, color:"#121755", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                Histórico — Enero a {mesLabel(periodo)}
              </span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ backgroundColor:"#F0F2F7" }}>
                    <th style={{ padding:"10px 20px", textAlign:"left", fontWeight:700, color:"#121755", fontSize:12, whiteSpace:"nowrap", position:"sticky", left:0, backgroundColor:"#F0F2F7", zIndex:2 }}>BD</th>
                    {mesesVisible.map((m) => (
                      <th key={m} colSpan={2} style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color: m === periodo ? "#4548FF" : "#555", fontSize:11, textTransform:"uppercase", borderLeft:"2px solid #E1E0E0", backgroundColor: m === periodo ? "#EEF2FF" : undefined }}>
                        {mesLabel(m)}
                      </th>
                    ))}
                  </tr>
                  <tr style={{ backgroundColor:"#F8F9FF" }}>
                    <th style={{ padding:"6px 20px", textAlign:"left", color:"#888", fontSize:10, position:"sticky", left:0, backgroundColor:"#F8F9FF", zIndex:2 }}>Métrica</th>
                    {mesesVisible.map((m) => (
                      <>
                        <th key={`${m}-r`} style={{ padding:"6px 10px", textAlign:"center", color:"#888", fontSize:10, borderLeft:"2px solid #E1E0E0" }}>Reu.</th>
                        <th key={`${m}-c`} style={{ padding:"6px 10px", textAlign:"center", color:"#888", fontSize:10 }}>Cierr.</th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BDS.map((bd, i) => (
                    <tr key={bd} style={{ borderTop:"1px solid #F0F2F7", backgroundColor: i%2===0 ? "#fff" : "#FAFBFF" }}>
                      <td style={{ padding:"12px 20px", fontWeight:600, color:"#333", whiteSpace:"nowrap", position:"sticky", left:0, backgroundColor: i%2===0 ? "#fff" : "#FAFBFF", zIndex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:26, height:26, borderRadius:"50%", backgroundColor:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#4548FF" }}>{bd.charAt(0)}</div>
                          {bd.split(" ").slice(0,2).join(" ")}
                        </div>
                      </td>
                      {mesesVisible.map((m) => {
                        const ar = getActualReuniones(bd, m);
                        const mr = getMeta("reuniones", bd, m);
                        const ac = getActualCierres(bd, m);
                        const mc = getMeta("cierres", bd, m);
                        const isCurrent = m === periodo;
                        const bg = isCurrent ? "rgba(69,72,255,0.04)" : undefined;
                        const rColor = mr != null && ar >= mr ? "#16a34a" : "#dc2626";
                        const cColor = mc != null && ac >= mc && mc > 0 ? "#16a34a" : "#dc2626";
                        return (
                          <>
                            <td key={`${m}-r`} style={{ padding:"12px 10px", textAlign:"center", borderLeft:"2px solid #E1E0E0", backgroundColor:bg }}>
                              <Badge actual={ar} obj={mr} color={rColor} />
                            </td>
                            <td key={`${m}-c`} style={{ padding:"12px 10px", textAlign:"center", backgroundColor:bg }}>
                              <Badge actual={ac} obj={mc} color={cColor} />
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ fontSize:12, color:"#aaa", marginTop:10 }}>
            Reuniones = registros marcados como realizados. Cierres = deals en &ldquo;Cierre Ganado&rdquo; cerrados en el período.
          </p>
        </div>
      )}

      {/* BD individual sub-tab */}
      {bdForSubTab && (
        <BDDetalle
          bd={bdForSubTab}
          deals={deals}
          metas={metas}
          reuniones={reuniones}
          filtro={filtro}
          getMeta={getMeta}
          getActualReuniones={getActualReuniones}
          getActualCierres={getActualCierres}
          mesesVisible={mesesVisible}
        />
      )}
    </div>
  );
}

function BDDetalle({ bd, deals, metas, reuniones, filtro, getMeta, getActualReuniones, getActualCierres, mesesVisible }: {
  bd: string;
  deals: Deal[];
  metas: MetaMensual[];
  reuniones: Reunion[];
  filtro: FiltroState;
  getMeta: (tipo: string, assignee: string, mes: string) => number | null;
  getActualReuniones: (bd: string, mes: string) => number;
  getActualCierres: (bd: string, mes: string) => number;
  mesesVisible: string[];
}) {
  const periodo = filtro.mes;
  const semanas = semanasDelMes(periodo);
  const semanaActual = getSemanaActual();

  const ar = getActualReuniones(bd, periodo);
  const mr = getMeta("reuniones", bd, periodo) ?? 0;
  const ac = getActualCierres(bd, periodo);
  const mc = getMeta("cierres", bd, periodo) ?? 0;
  const mp = getMeta("pedidos", bd, periodo) ?? 0;

  const dealsActivos = deals.filter((d) => d.businessDeveloper === bd && !d.etapa.toLowerCase().includes("cierre ganado"));
  const dealsCerrados = deals.filter((d) => d.businessDeveloper === bd && d.etapa.toLowerCase().includes("cierre ganado"));
  const ingresoMensual = dealsCerrados.reduce((s, d) => s + (d.pedidosMensuales ?? 0) * (d.tarifaPorPedido ?? 0), 0);

  function getReunionesSemana(sem: string): Reunion[] {
    return reuniones.filter((r) => r.bdNombre === bd && getISOSemana(new Date(r.fecha)) === sem);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* KPI cards del mes */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KpiCard label="Reuniones realizadas" actual={ar} meta={mr} tipo="count" />
        <KpiCard label="Cierres del mes" actual={ac} meta={mc} tipo="count" />
        <KpiCard label="Pedidos/mes objetivo" actual={mp} meta={mp} tipo="pedidos" />
        <KpiCard label="Ingreso mensual est." actual={ingresoMensual} meta={null} tipo="clp" />
      </div>

      {/* Reuniones semana a semana del mes seleccionado */}
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:15, fontWeight:700, color:"#121755", textTransform:"uppercase" }}>
            Reuniones por semana — {mesLabel(periodo)}
          </span>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ backgroundColor:"#F0F2F7" }}>
              <th style={{ padding:"10px 20px", textAlign:"left", fontWeight:700, color:"#121755", fontSize:12 }}>Semana</th>
              <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Realizadas</th>
              <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Agendadas</th>
              <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Marcas</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((sem, idx) => {
              const reus = getReunionesSemana(sem);
              const realizadas = reus.filter((r) => r.realizada).length;
              const isCurrent = sem === semanaActual;
              return (
                <tr key={sem} style={{ borderTop:"1px solid #F0F2F7", backgroundColor: isCurrent ? "#EEF2FF" : idx%2===0 ? "#fff" : "#FAFBFF" }}>
                  <td style={{ padding:"12px 20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {isCurrent && <span style={{ fontSize:10, fontWeight:700, color:"#4548FF", backgroundColor:"#EEF2FF", padding:"2px 6px", borderRadius:20 }}>ACTUAL</span>}
                      <span style={{ fontWeight: isCurrent ? 700 : 400, fontSize:12, color:"#333" }}>{semanaLabel(sem)}</span>
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", textAlign:"center" }}>
                    <span style={{ fontWeight:700, fontSize:15, color: realizadas > 0 ? "#16a34a" : "#aaa" }}>{realizadas}</span>
                  </td>
                  <td style={{ padding:"12px 14px", textAlign:"center" }}>
                    <span style={{ fontWeight:600, fontSize:14, color:"#4548FF" }}>{reus.length}</span>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ fontSize:12, color:"#555" }}>
                      {reus.filter((r) => r.dealNombre).map((r) => r.dealNombre).join(", ") || <span style={{ color:"#ccc" }}>—</span>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Histórico anual */}
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"auto" }}>
        <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:15, fontWeight:700, color:"#121755", textTransform:"uppercase" }}>
            Histórico Anual — {bd.split(" ")[0]}
          </span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ backgroundColor:"#F0F2F7" }}>
                <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#121755", fontSize:11, position:"sticky", left:0, backgroundColor:"#F0F2F7", zIndex:2 }}>Mes</th>
                <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:10, textTransform:"uppercase" }}>Obj. Reu.</th>
                <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:10, textTransform:"uppercase" }}>Real. Reu.</th>
                <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:10, textTransform:"uppercase" }}>% Reu.</th>
                <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:10, textTransform:"uppercase" }}>Obj. Cierres</th>
                <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:10, textTransform:"uppercase" }}>Real. Cierres</th>
                <th style={{ padding:"10px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:10, textTransform:"uppercase" }}>Obj. Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {mesesVisible.map((m, idx) => {
                const objR = getMeta("reuniones", bd, m) ?? 0;
                const actR = getActualReuniones(bd, m);
                const objC = getMeta("cierres", bd, m) ?? 0;
                const actC = getActualCierres(bd, m);
                const objP = getMeta("pedidos", bd, m) ?? 0;
                const pctR = objR > 0 ? Math.round(actR / objR * 100) : 0;
                const isCurrent = m === periodo;
                return (
                  <tr key={m} style={{ borderTop:"1px solid #F0F2F7", backgroundColor: isCurrent ? "rgba(69,72,255,0.06)" : idx%2===0 ? "#fff" : "#FAFBFF" }}>
                    <td style={{ padding:"10px 14px", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#4548FF" : "#333", position:"sticky", left:0, backgroundColor: isCurrent ? "rgba(69,72,255,0.06)" : idx%2===0 ? "#fff" : "#FAFBFF", zIndex:1 }}>
                      {mesLabel(m)}
                    </td>
                    <td style={{ padding:"10px 14px", textAlign:"center", color:"#888" }}>{objR}</td>
                    <td style={{ padding:"10px 14px", textAlign:"center", fontWeight:700, color: actR >= objR ? "#16a34a" : "#dc2626" }}>{actR}</td>
                    <td style={{ padding:"10px 14px", textAlign:"center" }}>
                      <span style={{ fontWeight:600, fontSize:11, color: pctR >= 100 ? "#16a34a" : pctR >= 70 ? "#d97706" : "#dc2626", backgroundColor: pctR >= 100 ? "#F0FFF4" : pctR >= 70 ? "#FFFBEB" : "#FFF1F2", padding:"2px 7px", borderRadius:20 }}>
                        {pctR}%
                      </span>
                    </td>
                    <td style={{ padding:"10px 14px", textAlign:"center", color:"#888" }}>{objC}</td>
                    <td style={{ padding:"10px 14px", textAlign:"center", fontWeight:700, color: actC >= objC ? "#16a34a" : "#dc2626" }}>{actC}</td>
                    <td style={{ padding:"10px 14px", textAlign:"center", color:"#888" }}>{objP > 0 ? fmtNum(objP) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deals activos */}
      {dealsActivos.length > 0 && (
        <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
            <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, color:"#121755", textTransform:"uppercase" }}>
              Marcas en Pipeline — {dealsActivos.length}
            </span>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ backgroundColor:"#F0F2F7" }}>
                {["Marca","Etapa","Plan","Pedidos/mes","Ingreso est."].map((h) => (
                  <th key={h} style={{ padding:"8px 14px", textAlign:h==="Marca"?"left":"right", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dealsActivos.map((d, i) => {
                const ing = (d.pedidosMensuales ?? 0) * (d.tarifaPorPedido ?? 0);
                return (
                  <tr key={d.id} style={{ borderTop:"1px solid #F0F2F7", backgroundColor: i%2===0 ? "#fff" : "#FAFBFF" }}>
                    <td style={{ padding:"10px 14px", fontWeight:600, color:"#121755" }}>{d.nombre}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right" }}>
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, backgroundColor:"#EEF2FF", color:"#4548FF", fontWeight:600 }}>{d.etapa}</span>
                    </td>
                    <td style={{ padding:"10px 14px", textAlign:"right", color:"#555" }}>{d.tipoPlan ?? "—"}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right" }}>{fmtNum(d.pedidosMensuales)}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right", color:"#888" }}>{ing > 0 ? fmtCLP(ing) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deals cerrados */}
      {dealsCerrados.length > 0 && (
        <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#F0FFF4" }}>
            <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, color:"#166534", textTransform:"uppercase" }}>
              Cierres Activos — {dealsCerrados.length} marcas · {fmtCLP(ingresoMensual)}/mes est.
            </span>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ backgroundColor:"#F0F2F7" }}>
                {["Marca","Plan","Pedidos/mes","Tarifa/pedido","Ingreso mensual","Sucursales","Onboarding"].map((h) => (
                  <th key={h} style={{ padding:"8px 14px", textAlign:h==="Marca"?"left":"right", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dealsCerrados.map((d, i) => {
                const ing = (d.pedidosMensuales ?? 0) * (d.tarifaPorPedido ?? 0);
                return (
                  <tr key={d.id} style={{ borderTop:"1px solid #F0F2F7", backgroundColor: i%2===0 ? "#fff" : "#F7FFF9" }}>
                    <td style={{ padding:"10px 14px", fontWeight:600, color:"#166534" }}>{d.nombre}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right" }}>{d.tipoPlan ? <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, backgroundColor:"#EEF2FF", color:"#4548FF", fontWeight:600 }}>{d.tipoPlan}</span> : "—"}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:600 }}>{fmtNum(d.pedidosMensuales)}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right" }}>{fmtCLP(d.tarifaPorPedido)}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:700, color:"#16a34a" }}>{ing > 0 ? fmtCLP(ing) : "—"}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right" }}>{d.sucursales ?? "—"}</td>
                    <td style={{ padding:"10px 14px", textAlign:"right", color:"#888", fontSize:12 }}>
                      {d.fechaOnboarding ? new Date(d.fechaOnboarding).toLocaleDateString("es-CL", { day:"numeric", month:"short" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, actual, meta, tipo }: { label: string; actual: number; meta: number | null; tipo: "count" | "pedidos" | "clp" }) {
  const isOk = meta !== null ? actual >= meta : actual > 0;
  const pct = meta !== null && meta > 0 ? Math.min(100, Math.round(actual / meta * 100)) : null;
  const displayVal = tipo === "clp" ? fmtCLP(actual || null) : tipo === "pedidos" ? (actual > 0 ? fmtNum(actual) : "—") : String(actual);
  const displayMeta = meta !== null ? (tipo === "clp" ? fmtCLP(meta) : tipo === "pedidos" ? fmtNum(meta) : String(meta)) : null;
  return (
    <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, padding:"16px 20px" }}>
      <div style={{ fontSize:11, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", color: tipo === "clp" ? "#121755" : isOk && meta !== null ? "#16a34a" : meta !== null ? "#dc2626" : "#121755" }}>
        {displayVal}
      </div>
      {displayMeta && tipo !== "clp" && <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>Meta: {displayMeta}{pct !== null && ` · ${pct}%`}</div>}
    </div>
  );
}

function Badge({ actual, obj, color }: { actual: number; obj: number | null; color: string }) {
  if (obj == null) return <span style={{ color:"#aaa", fontSize:12 }}>—</span>;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <span style={{ fontWeight:700, fontSize:13, color }}>{actual}/{obj}</span>
      <span style={{ fontSize:10, color, opacity:0.8 }}>{obj>0 ? Math.round(actual/obj*100) : 0}%</span>
    </div>
  );
}

// ─── Tab: Cierres ─────────────────────────────────────────────────────────────

function TabCierres({ deals, filtro }: { deals: Deal[]; filtro: FiltroState }) {
  const cierres = deals.filter((d) => d.etapa.toLowerCase().includes("cierre"));
  const totalPedidos = cierres.reduce((s,d)=>s+(d.pedidosMensuales??0),0);
  const totalIngreso = cierres.reduce((s,d)=>s+(d.pedidosMensuales??0)*(d.tarifaPorPedido??0),0);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Cierres activos", value:cierres.length, color:"#4548FF" },
          { label:"Pedidos/mes totales", value:totalPedidos>0?fmtNum(totalPedidos):"—", color:"#121755" },
          { label:"Ingreso mensual est.", value:totalIngreso>0?fmtCLP(totalIngreso):"—", color:"#16a34a" },
        ].map((k) => (
          <div key={k.label} style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, padding:"16px 20px" }}>
            <div style={{ fontSize:11, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:k.color, marginTop:4, fontFamily:"'Barlow Condensed', sans-serif" }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ backgroundColor:"#F0F2F7" }}>
              {["Marca","BD","Plan","Pedidos/mes","Tarifa/pedido","Ingreso mensual est.","Ticket prom.","Sucursales","Onboarding"].map((h) => (
                <th key={h} style={{ padding:"10px 14px", textAlign:h==="Marca"||h==="BD"?"left":"right", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cierres.length === 0 ? (
              <tr><td colSpan={9} style={{ padding:"40px", textAlign:"center", color:"#aaa" }}>No hay cierres aún.</td></tr>
            ) : cierres.map((d, i) => {
              const ingreso = (d.pedidosMensuales??0)*(d.tarifaPorPedido??0);
              return (
                <tr key={d.id} style={{ borderTop:"1px solid #F0F2F7", backgroundColor:i%2===0?"#fff":"#FAFBFF" }}>
                  <td style={{ padding:"10px 14px", fontWeight:600, color:"#121755" }}>{d.nombre}</td>
                  <td style={{ padding:"10px 14px", color:"#555" }}>{d.businessDeveloper??"—"}</td>
                  <td style={{ padding:"10px 14px" }}>{d.tipoPlan?<span style={{ padding:"2px 8px", borderRadius:20, backgroundColor:"#EEF2FF", color:"#4548FF", fontSize:11, fontWeight:600 }}>{d.tipoPlan}</span>:"—"}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:600 }}>{fmtNum(d.pedidosMensuales)}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}>{fmtCLP(d.tarifaPorPedido)}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:700, color:ingreso>0?"#16a34a":"#aaa" }}>{fmtCLP(ingreso||null)}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}>{fmtCLP(d.ticketPromedio)}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right" }}>{d.sucursales??"—"}</td>
                  <td style={{ padding:"10px 14px", textAlign:"right", color:"#888", fontSize:12 }}>
                    {d.fechaOnboarding ? new Date(d.fechaOnboarding).toLocaleDateString("es-CL",{day:"numeric",month:"short"}) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Reuniones ───────────────────────────────────────────────────────────

function TabReuniones({ deals, reuniones, onRefresh, filtro }: {
  deals: Deal[]; reuniones: Reunion[]; onRefresh: () => void; filtro: FiltroState;
}) {
  const [showModal, setShowModal] = useState(false);
  const [newFecha, setNewFecha] = useState(new Date().toISOString().split("T")[0]);
  const [newBd, setNewBd] = useState(BDS[0]);
  const [newDeal, setNewDeal] = useState("");
  const [adding, setAdding] = useState(false);
  const [bdFiltro, setBdFiltro] = useState("todos");

  // Filter by selected period
  const reunionesFiltradas = useMemo(() => {
    return reuniones.filter((r) => {
      if (bdFiltro !== "todos" && r.bdNombre !== bdFiltro) return false;
      if (filtro.tipo === "mes") return mesContiene(r.fecha, filtro.mes);
      if (filtro.tipo === "semana") return getISOSemana(new Date(r.fecha)) === filtro.semana;
      return true;
    });
  }, [reuniones, bdFiltro, filtro]);

  async function agregar() {
    if (!newFecha || !newBd) return;
    setAdding(true);
    await fetch("/api/reuniones", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ fecha:newFecha, bdNombre:newBd, dealNombre:newDeal||null }) });
    setAdding(false); setShowModal(false); setNewDeal(""); onRefresh();
  }
  async function toggleRealizada(id: string, realizada: boolean) {
    await fetch(`/api/reuniones/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ realizada:!realizada }) });
    onRefresh();
  }
  async function eliminar(id: string) {
    await fetch(`/api/reuniones/${id}`, { method:"DELETE" }); onRefresh();
  }

  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const pasadas = reunionesFiltradas.filter((r) => new Date(r.fecha) < hoy);
  const proximas = reunionesFiltradas.filter((r) => new Date(r.fecha) >= hoy);
  const realizadas = pasadas.filter((r) => r.realizada).length;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:13, fontWeight:600, color:"#555" }}>BD:</span>
          <select value={bdFiltro} onChange={(e)=>setBdFiltro(e.target.value)} style={{ padding:"6px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:13, outline:"none" }}>
            <option value="todos">Todos</option>
            {BDS.map((b)=><option key={b} value={b}>{b.split(" ")[0]}</option>)}
          </select>
        </div>
        {pasadas.length > 0 && (
          <span style={{ fontSize:13, color:realizadas===pasadas.length?"#16a34a":"#888" }}>
            {realizadas}/{pasadas.length} realizadas
          </span>
        )}
        <button onClick={()=>setShowModal(true)} style={{ marginLeft:"auto", padding:"9px 20px", borderRadius:8, backgroundColor:"#4548FF", color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + Agregar reunión
        </button>
      </div>

      {showModal && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ backgroundColor:"#fff", borderRadius:14, padding:"28px 28px 24px", width:400, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700, color:"#121755", textTransform:"uppercase", margin:"0 0 20px" }}>Agregar Reunión</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Fecha</label>
                <input type="date" value={newFecha} onChange={(e)=>setNewFecha(e.target.value)} style={{ width:"100%", padding:"8px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Business Developer</label>
                <select value={newBd} onChange={(e)=>setNewBd(e.target.value)} style={{ width:"100%", padding:"8px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:14, outline:"none" }}>
                  {BDS.map((b)=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Marca <span style={{ fontWeight:400, color:"#aaa" }}>(opcional)</span></label>
                <input type="text" value={newDeal} onChange={(e)=>setNewDeal(e.target.value)} placeholder="Ej: Lumisse, PetMyPet..." style={{ width:"100%", padding:"8px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1.5px solid #E1E0E0", backgroundColor:"#fff", color:"#555", fontSize:14, fontWeight:600, cursor:"pointer" }}>Cancelar</button>
              <button onClick={agregar} disabled={adding||!newFecha||!newBd} style={{ flex:2, padding:"10px", borderRadius:8, backgroundColor:"#4548FF", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", opacity:adding?0.6:1 }}>
                {adding?"Guardando...":"Guardar reunión"}
              </button>
            </div>
          </div>
        </div>
      )}

      {proximas.length > 0 && (
        <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
          <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#EEF2FF" }}>
            <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, color:"#4548FF", textTransform:"uppercase" }}>Próximas — {proximas.length}</span>
          </div>
          {proximas.map((r)=><ReunionRow key={r.id} r={r} onToggle={toggleRealizada} onDelete={eliminar} />)}
        </div>
      )}

      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, color:"#121755", textTransform:"uppercase" }}>
            Pasadas — {realizadas}/{pasadas.length} realizadas
          </span>
        </div>
        {pasadas.length===0 ? (
          <p style={{ padding:"24px", textAlign:"center", color:"#aaa", fontSize:13 }}>Sin reuniones pasadas en este período.</p>
        ) : pasadas.map((r)=><ReunionRow key={r.id} r={r} onToggle={toggleRealizada} onDelete={eliminar} />)}
      </div>

      {reunionesFiltradas.length === 0 && (
        <div style={{ padding:"40px", textAlign:"center", color:"#aaa", fontSize:14 }}>
          No hay reuniones registradas en este período. Haz clic en &ldquo;+ Agregar reunión&rdquo; para comenzar.
        </div>
      )}
    </div>
  );
}

function ReunionRow({ r, onToggle, onDelete }: { r: Reunion; onToggle:(id:string,realizada:boolean)=>void; onDelete:(id:string)=>void }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fecha = new Date(r.fecha);
  const esPasada = fecha < hoy;
  const fechaLabel = fecha.toLocaleDateString("es-CL", { weekday:"short", day:"numeric", month:"short" });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid #F8F9FC" }}>
      {esPasada ? (
        <button onClick={()=>onToggle(r.id,r.realizada)} style={{ width:24, height:24, borderRadius:6, border:`2px solid ${r.realizada?"#16a34a":"#E1E0E0"}`, backgroundColor:r.realizada?"#16a34a":"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {r.realizada&&<span style={{ color:"#fff", fontSize:12 }}>✓</span>}
        </button>
      ) : (
        <div style={{ width:24, height:24, borderRadius:6, border:"2px solid #4548FF", backgroundColor:"#EEF2FF", flexShrink:0 }} />
      )}
      <div style={{ flex:1 }}>
        <span style={{ fontSize:13, fontWeight:600, color:esPasada&&!r.realizada?"#dc2626":"#333" }}>{fechaLabel}</span>
        {r.dealNombre && <span style={{ fontSize:12, color:"#888", marginLeft:8 }}>· {r.dealNombre}</span>}
        {esPasada&&!r.realizada&&<span style={{ fontSize:11, color:"#dc2626", marginLeft:8, fontWeight:600 }}>No realizada</span>}
      </div>
      <div style={{ width:26, height:26, borderRadius:"50%", backgroundColor:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#4548FF" }}>
        {r.bdNombre.charAt(0)}
      </div>
      <span style={{ fontSize:12, color:"#888", minWidth:50 }}>{r.bdNombre.split(" ")[0]}</span>
      <button onClick={()=>onDelete(r.id)} style={{ padding:"3px 8px", borderRadius:5, border:"1px solid #F0F2F7", backgroundColor:"#fff", color:"#ccc", cursor:"pointer", fontSize:11 }}>✕</button>
    </div>
  );
}

// ─── Tab: SDR Pipeline ────────────────────────────────────────────────────────

function TabSDR({ metas, reuniones, onRefresh, filtro }: {
  metas: MetaMensual[]; reuniones: Reunion[]; onRefresh: () => void; filtro: FiltroState;
}) {
  const [showModal, setShowModal] = useState(false);
  const [newFecha, setNewFecha] = useState(new Date().toISOString().split("T")[0]);
  const [newBd, setNewBd] = useState(BDS[0]);
  const [newDeal, setNewDeal] = useState("");
  const [adding, setAdding] = useState(false);

  const semanaActual = getSemanaActual();
  const mesObj = filtro.mes;
  const semanas = semanasDelMes(mesObj);

  const objSemana = metas.find((m) => m.mes===mesObj && m.tipo==="reuniones" && m.assignee==="Felipe Aburto")?.objetivo ?? 25;
  const objMes = objSemana; // The monthly obj = the field "reuniones" for Felipe
  const objPorBD = 5; // 5 per BD per week

  function getReunionesEnSemana(bd: string, semana: string): Reunion[] {
    return reuniones.filter((r) => r.bdNombre === bd && getISOSemana(new Date(r.fecha)) === semana);
  }
  function getTotalEnSemana(semana: string): number {
    return BDS.reduce((s,bd)=>s+getReunionesEnSemana(bd,semana).length,0);
  }

  const totalMes = BDS.reduce((s,bd)=>s+reuniones.filter((r)=>r.bdNombre===bd&&mesContiene(r.fecha,mesObj)).length,0);

  async function agregar() {
    if (!newFecha || !newBd) return;
    setAdding(true);
    await fetch("/api/reuniones", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ fecha:newFecha, bdNombre:newBd, dealNombre:newDeal||null }) });
    setAdding(false); setShowModal(false); setNewDeal(""); onRefresh();
  }

  return (
    <div>
      {/* Resumen SDR */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:20 }}>
        <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, padding:"16px 20px", gridColumn:"span 1" }}>
          <div style={{ fontSize:11, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Total mes</div>
          <div style={{ fontSize:28, fontWeight:700, color:totalMes>=objMes?"#16a34a":"#dc2626", fontFamily:"'Barlow Condensed', sans-serif" }}>{totalMes}<span style={{ fontSize:14, color:"#aaa", fontWeight:400 }}>/{objMes}</span></div>
          <div style={{ fontSize:11, color:"#888" }}>reuniones agendadas</div>
        </div>
        {BDS.map((bd) => {
          const total = reuniones.filter((r)=>r.bdNombre===bd&&mesContiene(r.fecha,mesObj)).length;
          const goal = Math.round(objMes / 3);
          return (
            <div key={bd} style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, padding:"16px 20px" }}>
              <div style={{ fontSize:11, color:"#888", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{bd.split(" ")[0]}</div>
              <div style={{ fontSize:22, fontWeight:700, color:total>=goal?"#16a34a":"#dc2626", fontFamily:"'Barlow Condensed', sans-serif" }}>{total}<span style={{ fontSize:12, color:"#aaa", fontWeight:400 }}>/{goal}</span></div>
              <div style={{ marginTop:6, height:4, borderRadius:4, backgroundColor:"#F0F2F7" }}>
                <div style={{ height:"100%", borderRadius:4, backgroundColor:total>=goal?"#16a34a":"#4548FF", width:`${Math.min(100,goal>0?Math.round(total/goal*100):0)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grilla semanal */}
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:15, fontWeight:700, color:"#121755", textTransform:"uppercase" }}>
            Grilla de Agendamiento — {mesLabel(mesObj)}
          </span>
          <button onClick={()=>setShowModal(true)} style={{ padding:"8px 18px", borderRadius:8, backgroundColor:"#4548FF", color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            + Agendar reunión
          </button>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ backgroundColor:"#F0F2F7" }}>
              <th style={{ padding:"10px 20px", textAlign:"left", fontWeight:700, color:"#121755", fontSize:12 }}>Semana</th>
              {BDS.map((bd)=>(
                <th key={bd} style={{ padding:"10px 16px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>
                  {bd.split(" ")[0]}
                </th>
              ))}
              <th style={{ padding:"10px 16px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((sem, idx) => {
              const isCurrent = sem === semanaActual;
              const total = getTotalEnSemana(sem);
              const objSem = 5; // 5 total per week for SDR
              return (
                <tr key={sem} style={{ borderTop:"1px solid #F0F2F7", backgroundColor:isCurrent?"#EEF2FF":idx%2===0?"#fff":"#FAFBFF" }}>
                  <td style={{ padding:"12px 20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {isCurrent && <span style={{ fontSize:10, fontWeight:700, color:"#4548FF", backgroundColor:"#EEF2FF", padding:"2px 6px", borderRadius:20 }}>HOY</span>}
                      <span style={{ fontWeight:isCurrent?700:500, color:"#333", fontSize:12 }}>{semanaLabel(sem)}</span>
                    </div>
                  </td>
                  {BDS.map((bd)=>{
                    const count = getReunionesEnSemana(bd, sem).length;
                    const color = count>=2?"#16a34a":count>=1?"#d97706":"#aaa";
                    return (
                      <td key={bd} style={{ padding:"12px 16px", textAlign:"center" }}>
                        <span style={{ fontWeight:700, fontSize:15, color }}>{count}</span>
                      </td>
                    );
                  })}
                  <td style={{ padding:"12px 16px", textAlign:"center" }}>
                    <span style={{ fontWeight:700, fontSize:15, color:total>=objSem?"#16a34a":"#dc2626" }}>{total}</span>
                    <span style={{ fontSize:11, color:"#aaa" }}>/{objSem}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detalle de reuniones agendadas */}
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:14, fontWeight:700, color:"#121755", textTransform:"uppercase" }}>
            Reuniones Agendadas — {mesLabel(mesObj)}
          </span>
        </div>
        {BDS.map((bd) => {
          const reus = reuniones.filter((r)=>r.bdNombre===bd&&mesContiene(r.fecha,mesObj)).sort((a,b)=>a.fecha.localeCompare(b.fecha));
          return (
            <div key={bd}>
              <div style={{ padding:"8px 20px", backgroundColor:"#F8F9FF", borderTop:"1px solid #F0F2F7" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#4548FF" }}>{bd} — {reus.length} agendadas</span>
              </div>
              {reus.length === 0 ? (
                <div style={{ padding:"12px 20px", color:"#aaa", fontSize:13 }}>Sin reuniones agendadas este mes.</div>
              ) : reus.map((r)=>{
                const fecha = new Date(r.fecha);
                return (
                  <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", borderTop:"1px solid #F8F9FC" }}>
                    <span style={{ fontSize:12, color:"#555", minWidth:130 }}>{fecha.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"})}</span>
                    <span style={{ fontSize:12, color:"#888" }}>Sem {getISOSemana(fecha).split("-W")[1]}</span>
                    {r.dealNombre&&<span style={{ fontSize:12, color:"#333", fontWeight:500 }}>· {r.dealNombre}</span>}
                    <span style={{ marginLeft:"auto", fontSize:11, fontWeight:600, color:r.realizada?"#16a34a":"#888", backgroundColor:r.realizada?"#F0FFF4":"#F8F8F8", padding:"2px 8px", borderRadius:20 }}>
                      {r.realizada?"Realizada":"Pendiente"}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ backgroundColor:"#fff", borderRadius:14, padding:"28px 28px 24px", width:400, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:20, fontWeight:700, color:"#121755", textTransform:"uppercase", margin:"0 0 20px" }}>Agendar Reunión</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Fecha</label>
                <input type="date" value={newFecha} onChange={(e)=>setNewFecha(e.target.value)} style={{ width:"100%", padding:"8px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Para BD</label>
                <select value={newBd} onChange={(e)=>setNewBd(e.target.value)} style={{ width:"100%", padding:"8px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:14, outline:"none" }}>
                  {BDS.map((b)=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Marca / Seller <span style={{ fontWeight:400, color:"#aaa" }}>(opcional)</span></label>
                <input type="text" value={newDeal} onChange={(e)=>setNewDeal(e.target.value)} placeholder="Ej: Lumisse, PetMyPet..." style={{ width:"100%", padding:"8px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:14, outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1.5px solid #E1E0E0", backgroundColor:"#fff", color:"#555", fontSize:14, fontWeight:600, cursor:"pointer" }}>Cancelar</button>
              <button onClick={agregar} disabled={adding||!newFecha||!newBd} style={{ flex:2, padding:"10px", borderRadius:8, backgroundColor:"#4548FF", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", opacity:adding?0.6:1 }}>
                {adding?"Guardando...":"Agendar reunión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Compromisos ─────────────────────────────────────────────────────────

function TabCompromisos({ filtro }: { filtro: FiltroState }) {
  const [semana, setSemana] = useState(filtro.semana);
  const [compromisos, setCompromisos] = useState<CompromisoSemanal[]>([]);
  const [saving, setSaving] = useState<string|null>(null);
  const semanas = semanasList();

  const fetchCompromisos = useCallback(async () => {
    const res = await fetch(`/api/compromisos?semana=${semana}`);
    setCompromisos(await res.json());
  }, [semana]);

  useEffect(() => { fetchCompromisos(); }, [fetchCompromisos]);
  useEffect(() => { setSemana(filtro.semana); }, [filtro.semana]);

  function getCompromiso(bd: string) { return compromisos.find((c)=>c.bdNombre===bd); }

  async function save(bd: string, field: Partial<CompromisoSemanal>) {
    const c = getCompromiso(bd);
    setSaving(bd);
    await fetch("/api/compromisos", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ semana, bdNombre:bd, compromisoReuniones:c?.compromisoReuniones??0, logradoReuniones:c?.logradoReuniones??false, compromisoPedidos:c?.compromisoPedidos??0, logradoPedidos:c?.logradoPedidos??false, ...field }) });
    setSaving(null); fetchCompromisos();
  }

  const logrados = compromisos.filter((c)=>c.logradoReuniones&&c.logradoPedidos).length;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", backgroundColor:"#fff", borderRadius:10, border:"1px solid #E1E0E0" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#555" }}>Semana:</span>
        <select value={semana} onChange={(e)=>setSemana(e.target.value)} style={{ padding:"6px 12px", borderRadius:7, border:"1.5px solid #E1E0E0", fontSize:13, outline:"none" }}>
          {semanas.map((s)=><option key={s} value={s}>{semanaLabel(s)}</option>)}
        </select>
        {compromisos.length>0 && <span style={{ marginLeft:"auto", fontSize:13, fontWeight:700, color:logrados===BDS.length?"#16a34a":"#4548FF" }}>{logrados}/{BDS.length} BD con ambos logros</span>}
      </div>
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ backgroundColor:"#F0F2F7" }}>
              <th style={{ padding:"12px 20px", textAlign:"left", fontWeight:700, color:"#121755", fontSize:12 }}>BD</th>
              <th style={{ padding:"12px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Comp.<br/>Reuniones</th>
              <th style={{ padding:"12px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Logrado<br/>Reuniones</th>
              <th style={{ padding:"12px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Comp.<br/>Pedidos</th>
              <th style={{ padding:"12px 14px", textAlign:"center", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>Logrado<br/>Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {BDS.map((bd, i) => {
              const c = getCompromiso(bd);
              return (
                <tr key={bd} style={{ borderTop:"1px solid #F0F2F7", backgroundColor:i%2===0?"#fff":"#FAFBFF" }}>
                  <td style={{ padding:"12px 20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", backgroundColor:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#4548FF" }}>{bd.charAt(0)}</div>
                      <span style={{ fontWeight:500, color:"#333" }}>{bd}</span>
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <button onClick={()=>save(bd,{compromisoReuniones:Math.max(0,(c?.compromisoReuniones??0)-1)})} style={{ width:24, height:24, borderRadius:5, border:"1px solid #E1E0E0", backgroundColor:"#fff", cursor:"pointer", fontSize:14 }}>−</button>
                      <span style={{ width:32, textAlign:"center", fontWeight:700, fontSize:15, color:"#121755" }}>{c?.compromisoReuniones??0}</span>
                      <button onClick={()=>save(bd,{compromisoReuniones:(c?.compromisoReuniones??0)+1})} style={{ width:24, height:24, borderRadius:5, border:"1px solid #E1E0E0", backgroundColor:"#fff", cursor:"pointer", fontSize:14 }}>+</button>
                      {saving===bd&&<span style={{ fontSize:10, color:"#4548FF" }}>✓</span>}
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center" }}>
                    <button onClick={()=>save(bd,{logradoReuniones:!(c?.logradoReuniones)})} style={{ width:28, height:28, borderRadius:7, border:`2px solid ${c?.logradoReuniones?"#16a34a":"#E1E0E0"}`, backgroundColor:c?.logradoReuniones?"#16a34a":"#fff", cursor:"pointer", fontSize:14, color:c?.logradoReuniones?"#fff":"#ccc", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>✓</button>
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <button onClick={()=>save(bd,{compromisoPedidos:Math.max(0,(c?.compromisoPedidos??0)-1)})} style={{ width:24, height:24, borderRadius:5, border:"1px solid #E1E0E0", backgroundColor:"#fff", cursor:"pointer", fontSize:14 }}>−</button>
                      <span style={{ width:32, textAlign:"center", fontWeight:700, fontSize:15, color:"#121755" }}>{c?.compromisoPedidos??0}</span>
                      <button onClick={()=>save(bd,{compromisoPedidos:(c?.compromisoPedidos??0)+1})} style={{ width:24, height:24, borderRadius:5, border:"1px solid #E1E0E0", backgroundColor:"#fff", cursor:"pointer", fontSize:14 }}>+</button>
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center" }}>
                    <button onClick={()=>save(bd,{logradoPedidos:!(c?.logradoPedidos)})} style={{ width:28, height:28, borderRadius:7, border:`2px solid ${c?.logradoPedidos?"#16a34a":"#E1E0E0"}`, backgroundColor:c?.logradoPedidos?"#16a34a":"#fff", cursor:"pointer", fontSize:14, color:c?.logradoPedidos?"#fff":"#ccc", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>✓</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Pricing ─────────────────────────────────────────────────────────────

function TabPricing() {
  const volumen = [
    { rango:"3.500+ pedidos/mes", tarifa:"$1.600 – $2.200", almacenaje:"0,35 UF/m³ (desde 10m³)", redistribucion:"2 UF" },
    { rango:"2.000 – 3.500 pedidos/mes", tarifa:"$1.800 – $2.500", almacenaje:"0,35 UF/m³ (desde 10m³)", redistribucion:"2 UF" },
    { rango:"800 – 2.000 pedidos/mes", tarifa:"$1.800 – $2.500", almacenaje:"0,35 UF/m³ (desde 10m³)", redistribucion:"2 UF" },
    { rango:"200 – 800 pedidos/mes", tarifa:"$2.200 – $2.500", almacenaje:"0,7 UF/m³ (variable)", redistribucion:"2 UF" },
    { rango:"0 – 200 pedidos/mes", tarifa:"Ver Plan Starter", almacenaje:"Incluido en plan", redistribucion:"—" },
  ];
  const starter = [
    { plan:"Starter A", uf:"12 UF", espacio:"Hasta 0,75 m³ por darkstore", pedidos:"Hasta 150", adicional:"$2.500 + IVA/pedido" },
    { plan:"Starter B", uf:"10 UF", espacio:"Hasta 0,75 m³ por darkstore", pedidos:"Hasta 150", adicional:"$2.500 + IVA/pedido" },
    { plan:"Starter C", uf:"8 UF", espacio:"Hasta 0,75 m³ por darkstore", pedidos:"Hasta 150", adicional:"$2.500 + IVA/pedido" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <h3 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700, color:"#121755", textTransform:"uppercase", margin:0 }}>Tarifas por volumen</h3>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ backgroundColor:"#F0F2F7" }}>{["Volumen mensual","Preparación de pedido","Almacenaje CD","Redistribución"].map((h)=><th key={h} style={{ padding:"10px 20px", textAlign:"left", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>{volumen.map((v,i)=><tr key={v.rango} style={{ borderTop:"1px solid #F0F2F7", backgroundColor:i===0?"#F0FFF4":i%2===0?"#fff":"#FAFBFF" }}><td style={{ padding:"12px 20px", fontWeight:600, color:"#121755" }}>{v.rango}</td><td style={{ padding:"12px 20px", fontWeight:700, color:"#4548FF" }}>{v.tarifa}</td><td style={{ padding:"12px 20px", color:"#555" }}>{v.almacenaje}</td><td style={{ padding:"12px 20px", color:"#555" }}>{v.redistribucion}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <h3 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700, color:"#121755", textTransform:"uppercase", margin:0 }}>Planes Starter — 0 a 200 pedidos/mes</h3>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ backgroundColor:"#F0F2F7" }}>{["Plan","Fee mensual","Espacio incluido","Pedidos incluidos","Pedido adicional"].map((h)=><th key={h} style={{ padding:"10px 20px", textAlign:"left", fontWeight:600, color:"#555", fontSize:11, textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>{starter.map((s,i)=><tr key={s.plan} style={{ borderTop:"1px solid #F0F2F7", backgroundColor:i%2===0?"#fff":"#FAFBFF" }}><td style={{ padding:"12px 20px", fontWeight:700, color:"#121755" }}>{s.plan}</td><td style={{ padding:"12px 20px", fontWeight:700, color:"#4548FF" }}>{s.uf}</td><td style={{ padding:"12px 20px", color:"#555" }}>{s.espacio}</td><td style={{ padding:"12px 20px", color:"#555" }}>{s.pedidos}</td><td style={{ padding:"12px 20px", color:"#555" }}>{s.adicional}</td></tr>)}</tbody>
        </table>
        <div style={{ padding:"10px 20px", backgroundColor:"#FFFBEB", borderTop:"1px solid #FEF3C7", fontSize:12, color:"#92400e" }}>
          * 0,75 m³ equivalen a 2 bandejas.
        </div>
      </div>
      <div style={{ backgroundColor:"#fff", border:"1px solid #E1E0E0", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #F0F2F7", backgroundColor:"#FAFAFA" }}>
          <h3 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:16, fontWeight:700, color:"#121755", textTransform:"uppercase", margin:0 }}>Categorización de Sellers</h3>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr" }}>
          {[
            { tipo:"✅ Seller Ideal", color:"#F0FFF4", textColor:"#166534", items:["Cosméticos / Bronceadores","Salud, bienestar y cuidado personal","Nutrición deportiva / Probióticos","Animales (comida y accesorios)","Accesorios/joyería","Barras de cereal","Café","Deportes y Outdoor","Juguetes"] },
            { tipo:"🟡 Seller Aceptable", color:"#FFFBEB", textColor:"#92400e", items:["Vestuario (ropa, pijamas, bikinis)","Accesorios y productos para Bebé","Deco y Hogar","Calzado (pocos SKU)","Regalos","Tecnología","Sexshop / Bienestar"] },
            { tipo:"🔴 No queremos", color:"#FFF1F2", textColor:"#9f1239", items:["Verdulerías / Minimarket","Productos congelados / fríos","Electrodomésticos","Chocolates","Libros y literatura","Vestidos (complejo de manipular)","Calzado (muchos SKU)","Productos personalizados"] },
          ].map((col)=>(
            <div key={col.tipo} style={{ padding:"16px 20px", backgroundColor:col.color, borderTop:"1px solid #F0F2F7", borderRight:"1px solid #F0F2F7" }}>
              <div style={{ fontWeight:700, fontSize:13, color:col.textColor, marginBottom:10 }}>{col.tipo}</div>
              {col.items.map((item)=><div key={item} style={{ fontSize:12, color:col.textColor, marginBottom:5, opacity:0.85 }}>· {item}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id:"seguimiento", label:"Seguimiento 📊" },
  { id:"cierres", label:"Cierres 🤑" },
  { id:"reuniones", label:"Reuniones 📅" },
  { id:"sdr", label:"Pipeline SDR 🎯" },
  { id:"compromisos", label:"Compromisos ✅" },
  { id:"pricing", label:"Pricing 💰" },
];

export default function MaquinasPage() {
  const [tab, setTab] = useState("seguimiento");
  const [filtro, setFiltro] = useState<FiltroState>({ tipo:"mes", mes:getMesActual(), semana:getSemanaActual() });

  const { data: deals = [] } = useSWR<Deal[]>("/api/deals", fetcher);
  const { data: metas = [] } = useSWR<MetaMensual[]>("/api/metas", fetcher);
  const { data: reuniones = [], mutate: mutateReuniones } = useSWR<Reunion[]>("/api/reuniones", fetcher);

  // When switching to Compromisos tab, sync semana filter
  function handleFiltroChange(f: FiltroState) {
    setFiltro(f);
  }

  return (
    <div style={{ padding:"20px 24px", fontFamily:"'Inter', sans-serif", maxWidth:1200 }}>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:28, color:"#121755", textTransform:"uppercase", letterSpacing:"0.03em", margin:0 }}>
          Máquinas de Ventas 2026
        </h1>
        <p style={{ fontSize:13, color:"#888", marginTop:2 }}>
          Seguimiento de cierres, reuniones, compromisos y pipeline del equipo
        </p>
      </div>

      <FiltroFecha filtro={filtro} onChange={handleFiltroChange} />

      <div style={{ display:"flex", gap:2, marginBottom:20, borderBottom:"2px solid #E1E0E0" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"9px 18px", borderRadius:"8px 8px 0 0", border:"none", backgroundColor:tab===t.id?"#4548FF":"transparent", color:tab===t.id?"#fff":"#666", fontWeight:tab===t.id?700:500, fontSize:13, cursor:"pointer", fontFamily:"'Inter', sans-serif", marginBottom:tab===t.id?-2:0, borderBottom:tab===t.id?"2px solid #4548FF":"none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="seguimiento" && <TabSeguimiento deals={deals} metas={metas} reuniones={reuniones} filtro={filtro} />}
      {tab==="cierres" && <TabCierres deals={deals} filtro={filtro} />}
      {tab==="reuniones" && <TabReuniones deals={deals} reuniones={reuniones} onRefresh={()=>mutateReuniones()} filtro={filtro} />}
      {tab==="sdr" && <TabSDR metas={metas} reuniones={reuniones} onRefresh={()=>mutateReuniones()} filtro={filtro} />}
      {tab==="compromisos" && <TabCompromisos filtro={filtro} />}
      {tab==="pricing" && <TabPricing />}
    </div>
  );
}
