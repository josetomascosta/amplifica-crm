"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Types ────────────────────────────────────────────────────────────────────

type Deal = {
  id: string;
  nombre: string;
  etapa: string;
  businessDeveloper: string | null;
  pedidosMensuales: number | null;
  ticketPromedio: number | null;
  tarifaPorPedido: number | null;
  monto: number | null;
  moneda: string;
  sucursales: string | null;
  tipoPlan: string | null;
  modeloCobro: string | null;
  fechaOnboarding: string | null;
  updatedAt: string;
};

type MetaMensual = { id: string; mes: string; tipo: string; assignee: string; objetivo: number };

type Reunion = { id: string; fecha: string; bdNombre: string; dealNombre: string | null; realizada: boolean };

type CompromisoSemanal = {
  id: string;
  semana: string;
  bdNombre: string;
  compromisoReuniones: number;
  logradoReuniones: boolean;
  compromisoPedidos: number;
  logradoPedidos: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSemanaActual() {
  const now = new Date();
  const year = now.getFullYear();
  const d = new Date(Date.UTC(year, 0, 1));
  const dayNum = Math.round((now.getTime() - d.getTime()) / 86400000);
  const week = Math.ceil((dayNum + d.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function semanaLabel(s: string) {
  const [y, w] = s.split("-W");
  const year = Number(y);
  const week = Number(w);
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dow + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  return `Sem ${week} · ${fmt(monday)}–${fmt(sunday)}`;
}

function getMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtCLP(n: number | null | undefined) {
  if (n == null || n === 0) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CL").format(n);
}

function semanasList() {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const year = d.getFullYear();
    const jan4 = new Date(Date.UTC(year, 0, 1));
    const dayNum = Math.round((d.getTime() - jan4.getTime()) / 86400000);
    const week = Math.ceil((dayNum + jan4.getDay() + 1) / 7);
    result.push(`${year}-W${String(week).padStart(2, "0")}`);
  }
  return result;
}

// ─── Tab: Seguimiento ────────────────────────────────────────────────────────

function TabSeguimiento({ deals, metas }: { deals: Deal[]; metas: MetaMensual[] }) {
  const mes = getMesActual();

  const bds = useMemo(() => {
    const names = deals.map((d) => d.businessDeveloper).filter((b): b is string => !!b);
    return [...new Set(names)].sort();
  }, [deals]);

  function getMetaObj(tipo: string, assignee: string) {
    return metas.find((m) => m.mes === mes && m.tipo === tipo && m.assignee === assignee)?.objetivo ?? null;
  }

  // Count closed deals this month per BD
  function getActualCierres(bd: string) {
    return deals.filter((d) => {
      if (!d.etapa.toLowerCase().includes("cierre")) return false;
      if (d.businessDeveloper !== bd) return false;
      return true;
    }).length;
  }

  // Total pedidos percibidos from active cierres
  function getPedidosPercibidos(bd: string) {
    return deals
      .filter((d) => d.etapa.toLowerCase().includes("cierre") && d.businessDeveloper === bd)
      .reduce((s, d) => s + (d.pedidosMensuales ?? 0), 0);
  }

  const mesLabel = new Date(mes + "-01").toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#888" }}>Período:</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#4548FF", textTransform: "capitalize" }}>{mesLabel}</span>
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>· las metas se configuran en Admin → Metas</span>
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#F0F2F7" }}>
              <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, color: "#121755", fontSize: 12 }}>BD</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Reuniones realizadas</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Meta reuniones</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Faltante</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Cierres</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Meta cierres</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Faltante</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Pedidos percibidos</th>
            </tr>
          </thead>
          <tbody>
            {["equipo", ...bds].map((bd, i) => {
              const isTeam = bd === "equipo";
              const metaReu = isTeam
                ? bds.reduce((s, b) => s + (getMetaObj("reuniones", b) ?? 0), 0) || getMetaObj("reuniones", "equipo")
                : getMetaObj("reuniones", bd);
              const metaCierres = isTeam
                ? bds.reduce((s, b) => s + (getMetaObj("cierres", b) ?? 0), 0) || getMetaObj("cierres", "equipo")
                : getMetaObj("cierres", bd);
              const actualCierres = isTeam ? bds.reduce((s, b) => s + getActualCierres(b), 0) : getActualCierres(bd);
              const pedidos = isTeam ? bds.reduce((s, b) => s + getPedidosPercibidos(b), 0) : getPedidosPercibidos(bd);

              const faltReu = metaReu != null ? Math.max(0, metaReu) : null;
              const faltCierres = metaCierres != null ? Math.max(0, metaCierres - actualCierres) : null;

              return (
                <tr key={bd} style={{ borderTop: "1px solid #F0F2F7", backgroundColor: isTeam ? "#F8F9FF" : i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: isTeam ? "#121755" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isTeam ? "#fff" : "#4548FF" }}>
                        {isTeam ? "Σ" : bd.charAt(0)}
                      </div>
                      <span style={{ fontWeight: isTeam ? 700 : 500, color: isTeam ? "#121755" : "#333" }}>
                        {isTeam ? "Total Equipo" : bd}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#333" }}>—</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", color: "#888" }}>{metaReu ?? "—"}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", color: faltReu != null && faltReu > 0 ? "#dc2626" : "#16a34a" }}>
                    {faltReu != null ? (faltReu > 0 ? `−${faltReu}` : "✓") : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#4548FF" }}>{actualCierres}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", color: "#888" }}>{metaCierres ?? "—"}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", color: faltCierres != null && faltCierres > 0 ? "#dc2626" : "#16a34a" }}>
                    {faltCierres != null ? (faltCierres > 0 ? `−${faltCierres}` : "✓") : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#16a34a" }}>{pedidos > 0 ? fmtNum(pedidos) : "—"}</td>
                </tr>
              );
            })}
            {bds.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#aaa" }}>Los BD aparecerán una vez que tengan deals en el Pipeline.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>
        Reuniones realizadas se registran en la pestaña Reuniones. Las metas se configuran en Admin → Metas.
      </p>
    </div>
  );
}

// ─── Tab: Cierres ─────────────────────────────────────────────────────────────

function TabCierres({ deals }: { deals: Deal[] }) {
  const cierres = deals.filter((d) => d.etapa.toLowerCase().includes("cierre"));

  const totalPedidos = cierres.reduce((s, d) => s + (d.pedidosMensuales ?? 0), 0);
  const totalIngreso = cierres.reduce((s, d) => s + (d.pedidosMensuales ?? 0) * (d.tarifaPorPedido ?? 0), 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Cierres activos", value: cierres.length, color: "#4548FF" },
          { label: "Pedidos/mes totales", value: totalPedidos > 0 ? fmtNum(totalPedidos) : "—", color: "#121755" },
          { label: "Ingreso mensual est.", value: totalIngreso > 0 ? fmtCLP(totalIngreso) : "—", color: "#16a34a" },
        ].map((k) => (
          <div key={k.label} style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color, marginTop: 4, fontFamily: "'Barlow Condensed', sans-serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#F0F2F7" }}>
              {["Marca", "BD", "Plan", "Pedidos/mes", "Tarifa/pedido", "Ingreso mensual est.", "Ticket prom.", "Sucursales", "Onboarding"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "Marca" || h === "BD" ? "left" : "right", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cierres.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#aaa" }}>
                No hay cierres aún. Los deals en etapa &quot;Cierre Ganado&quot; aparecerán aquí automáticamente.
              </td></tr>
            ) : cierres.map((d, i) => {
              const ingreso = (d.pedidosMensuales ?? 0) * (d.tarifaPorPedido ?? 0);
              return (
                <tr key={d.id} style={{ borderTop: "1px solid #F0F2F7", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#121755" }}>{d.nombre}</td>
                  <td style={{ padding: "10px 14px", color: "#555" }}>{d.businessDeveloper ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {d.tipoPlan ? <span style={{ padding: "2px 8px", borderRadius: 20, backgroundColor: "#EEF2FF", color: "#4548FF", fontSize: 11, fontWeight: 600 }}>{d.tipoPlan}</span> : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600 }}>{fmtNum(d.pedidosMensuales)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>{fmtCLP(d.tarifaPorPedido)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: ingreso > 0 ? "#16a34a" : "#aaa" }}>{fmtCLP(ingreso || null)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>{fmtCLP(d.ticketPromedio)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>{d.sucursales ?? "—"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "#888", fontSize: 12 }}>
                    {d.fechaOnboarding ? new Date(d.fechaOnboarding).toLocaleDateString("es-CL", { day: "numeric", month: "short" }) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>
        Edita pedidos/mes, tarifa/pedido y ticket promedio en el panel de cada deal del Pipeline.
      </p>
    </div>
  );
}

// ─── Tab: Reuniones ───────────────────────────────────────────────────────────

function TabReuniones({ deals }: { deals: Deal[] }) {
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newFecha, setNewFecha] = useState(new Date().toISOString().split("T")[0]);
  const [newBd, setNewBd] = useState("");
  const [newDeal, setNewDeal] = useState("");
  const [adding, setAdding] = useState(false);
  const [bdFiltro, setBdFiltro] = useState("todos");

  const bds = useMemo(() => {
    const names = deals.map((d) => d.businessDeveloper).filter((b): b is string => !!b);
    return [...new Set(names)].sort();
  }, [deals]);

  useEffect(() => { if (bds.length > 0 && !newBd) setNewBd(bds[0]); }, [bds, newBd]);

  const fetchReuniones = useCallback(async () => {
    const url = bdFiltro !== "todos" ? `/api/reuniones?bd=${encodeURIComponent(bdFiltro)}` : "/api/reuniones";
    const res = await fetch(url);
    setReuniones(await res.json());
  }, [bdFiltro]);

  useEffect(() => { fetchReuniones(); }, [fetchReuniones]);

  async function agregar() {
    if (!newFecha || !newBd) return;
    setAdding(true);
    await fetch("/api/reuniones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: newFecha, bdNombre: newBd, dealNombre: newDeal || null }),
    });
    setAdding(false);
    setShowModal(false);
    setNewDeal("");
    fetchReuniones();
  }

  async function toggleRealizada(id: string, realizada: boolean) {
    await fetch(`/api/reuniones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ realizada: !realizada }),
    });
    fetchReuniones();
  }

  async function eliminar(id: string) {
    await fetch(`/api/reuniones/${id}`, { method: "DELETE" });
    fetchReuniones();
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pasadas = reuniones.filter((r) => new Date(r.fecha) < hoy);
  const proximas = reuniones.filter((r) => new Date(r.fecha) >= hoy);
  const realizadas = pasadas.filter((r) => r.realizada).length;

  return (
    <div>
      {/* Header con botón */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Ver:</span>
          <select value={bdFiltro} onChange={(e) => setBdFiltro(e.target.value)} style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, outline: "none", color: "#333" }}>
            <option value="todos">Todos los BD</option>
            {bds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        {pasadas.length > 0 && (
          <span style={{ fontSize: 13, color: realizadas === pasadas.length ? "#16a34a" : "#888" }}>
            {realizadas}/{pasadas.length} pasadas realizadas
          </span>
        )}
        <button
          onClick={() => setShowModal(true)}
          style={{ marginLeft: "auto", padding: "9px 20px", borderRadius: 8, backgroundColor: "#4548FF", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          + Agregar reunión
        </button>
      </div>

      {/* Modal agregar */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "28px 28px 24px", width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#121755", textTransform: "uppercase", margin: "0 0 20px" }}>
              Agregar Reunión
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Fecha</label>
                <input type="date" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Business Developer</label>
                <select value={newBd} onChange={(e) => setNewBd(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 14, outline: "none", color: "#333" }}>
                  {bds.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Marca / Seller <span style={{ fontWeight: 400, color: "#aaa" }}>(opcional)</span></label>
                <input type="text" value={newDeal} onChange={(e) => setNewDeal(e.target.value)} placeholder="Ej: Lumisse, PetMyPet..." style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", color: "#555", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={agregar} disabled={adding || !newFecha || !newBd} style={{ flex: 2, padding: "10px", borderRadius: 8, backgroundColor: "#4548FF", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: adding ? 0.6 : 1 }}>
                {adding ? "Guardando..." : "Guardar reunión"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Próximas reuniones */}
      {proximas.length > 0 && (
        <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#EEF2FF" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#4548FF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Próximas — {proximas.length}
            </span>
          </div>
          {proximas.map((r) => (
            <ReunionRow key={r.id} r={r} onToggle={toggleRealizada} onDelete={eliminar} />
          ))}
        </div>
      )}

      {/* Reuniones pasadas */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#FAFAFA" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#121755", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pasadas — {realizadas}/{pasadas.length} realizadas
          </span>
        </div>
        {pasadas.length === 0 ? (
          <p style={{ padding: "24px", textAlign: "center", color: "#aaa", fontSize: 13 }}>No hay reuniones pasadas registradas.</p>
        ) : pasadas.map((r) => (
          <ReunionRow key={r.id} r={r} onToggle={toggleRealizada} onDelete={eliminar} />
        ))}
      </div>

      {reuniones.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
          No hay reuniones registradas. Haz clic en &quot;+ Agregar reunión&quot; para comenzar.
        </div>
      )}
    </div>
  );
}

function ReunionRow({ r, onToggle, onDelete }: { r: Reunion; onToggle: (id: string, realizada: boolean) => void; onDelete: (id: string) => void }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(r.fecha);
  const esPasada = fecha < hoy;
  const fechaLabel = fecha.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #F8F9FC" }}>
      {esPasada ? (
        <button
          onClick={() => onToggle(r.id, r.realizada)}
          title={r.realizada ? "Marcar como no realizada" : "Marcar como realizada"}
          style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${r.realizada ? "#16a34a" : "#E1E0E0"}`, backgroundColor: r.realizada ? "#16a34a" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          {r.realizada && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
        </button>
      ) : (
        <div style={{ width: 24, height: 24, borderRadius: 6, border: "2px solid #4548FF", backgroundColor: "#EEF2FF", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: esPasada && !r.realizada ? "#dc2626" : "#333", textDecoration: r.realizada ? "none" : "none" }}>
          {fechaLabel}
        </span>
        {r.dealNombre && <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>· {r.dealNombre}</span>}
        {esPasada && !r.realizada && <span style={{ fontSize: 11, color: "#dc2626", marginLeft: 8, fontWeight: 600 }}>No marcada</span>}
      </div>
      <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4548FF" }}>
        {r.bdNombre.charAt(0).toUpperCase()}
      </div>
      <span style={{ fontSize: 12, color: "#888", minWidth: 60 }}>{r.bdNombre.split(" ")[0]}</span>
      <button onClick={() => onDelete(r.id)} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #F0F2F7", backgroundColor: "#fff", color: "#ccc", cursor: "pointer", fontSize: 11 }}>✕</button>
    </div>
  );
}

// ─── Tab: Compromisos ─────────────────────────────────────────────────────────

function TabCompromisos({ deals }: { deals: Deal[] }) {
  const [semana, setSemana] = useState(getSemanaActual());
  const [compromisos, setCompromisos] = useState<CompromisoSemanal[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const semanas = useMemo(() => semanasList(), []);

  const bds = useMemo(() => {
    const names = deals.map((d) => d.businessDeveloper).filter((b): b is string => !!b);
    return [...new Set(names)].sort();
  }, [deals]);

  const fetchCompromisos = useCallback(async () => {
    const res = await fetch(`/api/compromisos?semana=${semana}`);
    setCompromisos(await res.json());
  }, [semana]);

  useEffect(() => { fetchCompromisos(); }, [fetchCompromisos]);

  function getCompromiso(bd: string): CompromisoSemanal | undefined {
    return compromisos.find((c) => c.bdNombre === bd);
  }

  async function save(bd: string, field: Partial<CompromisoSemanal>) {
    const current = getCompromiso(bd);
    setSaving(bd);
    await fetch("/api/compromisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semana,
        bdNombre: bd,
        compromisoReuniones: current?.compromisoReuniones ?? 0,
        logradoReuniones: current?.logradoReuniones ?? false,
        compromisoPedidos: current?.compromisoPedidos ?? 0,
        logradoPedidos: current?.logradoPedidos ?? false,
        ...field,
      }),
    });
    setSaving(null);
    fetchCompromisos();
  }

  const logrados = compromisos.filter((c) => c.logradoReuniones && c.logradoPedidos).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #E1E0E0" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Semana:</span>
        <select value={semana} onChange={(e) => setSemana(e.target.value)} style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, outline: "none", color: "#333" }}>
          {semanas.map((s) => <option key={s} value={s}>{semanaLabel(s)}</option>)}
        </select>
        {compromisos.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: logrados === bds.length ? "#16a34a" : "#4548FF" }}>
            {logrados}/{bds.length} BD con ambos logros
          </span>
        )}
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#F0F2F7" }}>
              <th style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, color: "#121755", fontSize: 12 }}>BD</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Compromiso<br/>Reuniones</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Logrado<br/>Reuniones</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Compromiso<br/>Pedidos</th>
              <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>Logrado<br/>Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {bds.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#aaa" }}>Los BD aparecerán aquí con sus deals en el Pipeline.</td></tr>
            ) : bds.map((bd, i) => {
              const c = getCompromiso(bd);
              return (
                <tr key={bd} style={{ borderTop: "1px solid #F0F2F7", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#4548FF" }}>
                        {bd.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: "#333" }}>{bd}</span>
                    </div>
                  </td>
                  {/* Compromiso Reuniones */}
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <button onClick={() => save(bd, { compromisoReuniones: Math.max(0, (c?.compromisoReuniones ?? 0) - 1) })} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #E1E0E0", backgroundColor: "#fff", cursor: "pointer", fontSize: 14, color: "#555" }}>−</button>
                      <span style={{ width: 32, textAlign: "center", fontWeight: 700, fontSize: 15, color: "#121755" }}>{c?.compromisoReuniones ?? 0}</span>
                      <button onClick={() => save(bd, { compromisoReuniones: (c?.compromisoReuniones ?? 0) + 1 })} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #E1E0E0", backgroundColor: "#fff", cursor: "pointer", fontSize: 14, color: "#555" }}>+</button>
                      {saving === bd && <span style={{ fontSize: 10, color: "#4548FF" }}>✓</span>}
                    </div>
                  </td>
                  {/* Logrado Reuniones */}
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <button
                      onClick={() => save(bd, { logradoReuniones: !(c?.logradoReuniones) })}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `2px solid ${c?.logradoReuniones ? "#16a34a" : "#E1E0E0"}`, backgroundColor: c?.logradoReuniones ? "#16a34a" : "#fff", cursor: "pointer", fontSize: 14, color: c?.logradoReuniones ? "#fff" : "#ccc", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >✓</button>
                  </td>
                  {/* Compromiso Pedidos */}
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <button onClick={() => save(bd, { compromisoPedidos: Math.max(0, (c?.compromisoPedidos ?? 0) - 1) })} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #E1E0E0", backgroundColor: "#fff", cursor: "pointer", fontSize: 14, color: "#555" }}>−</button>
                      <span style={{ width: 32, textAlign: "center", fontWeight: 700, fontSize: 15, color: "#121755" }}>{c?.compromisoPedidos ?? 0}</span>
                      <button onClick={() => save(bd, { compromisoPedidos: (c?.compromisoPedidos ?? 0) + 1 })} style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #E1E0E0", backgroundColor: "#fff", cursor: "pointer", fontSize: 14, color: "#555" }}>+</button>
                    </div>
                  </td>
                  {/* Logrado Pedidos */}
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <button
                      onClick={() => save(bd, { logradoPedidos: !(c?.logradoPedidos) })}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `2px solid ${c?.logradoPedidos ? "#16a34a" : "#E1E0E0"}`, backgroundColor: c?.logradoPedidos ? "#16a34a" : "#fff", cursor: "pointer", fontSize: 14, color: c?.logradoPedidos ? "#fff" : "#ccc", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >✓</button>
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
    { rango: "3.500+ pedidos/mes", tarifa: "$1.600 – $2.200", almacenaje: "0,35 UF/m³ (desde 10m³)", redistribucion: "2 UF" },
    { rango: "2.000 – 3.500 pedidos/mes", tarifa: "$1.800 – $2.500", almacenaje: "0,35 UF/m³ (desde 10m³)", redistribucion: "2 UF" },
    { rango: "800 – 2.000 pedidos/mes", tarifa: "$1.800 – $2.500", almacenaje: "0,35 UF/m³ (desde 10m³)", redistribucion: "2 UF" },
    { rango: "200 – 800 pedidos/mes", tarifa: "$2.200 – $2.500", almacenaje: "0,7 UF/m³ (variable)", redistribucion: "2 UF" },
    { rango: "0 – 200 pedidos/mes", tarifa: "Ver Plan Starter", almacenaje: "Incluido en plan", redistribucion: "—" },
  ];

  const starter = [
    { plan: "Starter A", uf: "12 UF", espacio: "Hasta 0,75 m³ por darkstore", pedidos: "Hasta 150", adicional: "$2.500 + IVA/pedido" },
    { plan: "Starter B", uf: "10 UF", espacio: "Hasta 0,75 m³ por darkstore", pedidos: "Hasta 150", adicional: "$2.500 + IVA/pedido" },
    { plan: "Starter C", uf: "8 UF", espacio: "Hasta 0,75 m³ por darkstore", pedidos: "Hasta 150", adicional: "$2.500 + IVA/pedido" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tabla de tarifas por volumen */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#FAFAFA" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#121755", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Tarifas por volumen
          </h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#F0F2F7" }}>
              {["Volumen mensual", "Preparación de pedido", "Almacenaje CD", "Redistribución"].map((h) => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {volumen.map((v, i) => (
              <tr key={v.rango} style={{ borderTop: "1px solid #F0F2F7", backgroundColor: i === 0 ? "#F0FFF4" : i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
                <td style={{ padding: "12px 20px", fontWeight: 600, color: "#121755" }}>{v.rango}</td>
                <td style={{ padding: "12px 20px", fontWeight: 700, color: "#4548FF" }}>{v.tarifa}</td>
                <td style={{ padding: "12px 20px", color: "#555" }}>{v.almacenaje}</td>
                <td style={{ padding: "12px 20px", color: "#555" }}>{v.redistribucion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan Starter */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#FAFAFA" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#121755", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Planes Starter — 0 a 200 pedidos/mes
          </h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#F0F2F7" }}>
              {["Plan", "Fee mensual", "Espacio incluido", "Pedidos incluidos", "Pedido adicional"].map((h) => (
                <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starter.map((s, i) => (
              <tr key={s.plan} style={{ borderTop: "1px solid #F0F2F7", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
                <td style={{ padding: "12px 20px", fontWeight: 700, color: "#121755" }}>{s.plan}</td>
                <td style={{ padding: "12px 20px", fontWeight: 700, color: "#4548FF" }}>{s.uf}</td>
                <td style={{ padding: "12px 20px", color: "#555" }}>{s.espacio}</td>
                <td style={{ padding: "12px 20px", color: "#555" }}>{s.pedidos}</td>
                <td style={{ padding: "12px 20px", color: "#555" }}>{s.adicional}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "10px 20px", backgroundColor: "#FFFBEB", borderTop: "1px solid #FEF3C7", fontSize: 12, color: "#92400e" }}>
          * 0,75 m³ equivalen a 2 bandejas. Para más info ver documentación de Plan Starter en Notion.
        </div>
      </div>

      {/* Categorización */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#FAFAFA" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#121755", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Categorización de Sellers
          </h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
          {[
            { tipo: "✅ Seller Ideal", color: "#F0FFF4", border: "#bbf7d0", textColor: "#166534", items: ["Cosméticos / Bronceadores", "Salud, bienestar y cuidado personal", "Nutrición deportiva / Probióticos", "Animales (comida y accesorios)", "Accesorios/joyería", "Barras de cereal", "Café", "Deportes y Outdoor", "Juguetes"] },
            { tipo: "🟡 Seller Aceptable", color: "#FFFBEB", border: "#fde68a", textColor: "#92400e", items: ["Vestuario (ropa, pijamas, bikinis)", "Accesorios y productos para Bebé", "Deco y Hogar", "Calzado (pocos SKU)", "Regalos", "Tecnología", "Sexshop / Bienestar"] },
            { tipo: "🔴 No queremos", color: "#FFF1F2", border: "#fecdd3", textColor: "#9f1239", items: ["Verdulerías / Minimarket", "Productos congelados / fríos", "Electrodomésticos", "Chocolates", "Libros y literatura", "Vestidos (complejo de manipular)", "Calzado (muchos SKU)", "Productos personalizados"] },
          ].map((col) => (
            <div key={col.tipo} style={{ padding: "16px 20px", backgroundColor: col.color, borderTop: "1px solid #F0F2F7", borderRight: "1px solid #F0F2F7" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: col.textColor, marginBottom: 10 }}>{col.tipo}</div>
              {col.items.map((item) => (
                <div key={item} style={{ fontSize: 12, color: col.textColor, marginBottom: 5, opacity: 0.85 }}>· {item}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "seguimiento", label: "Seguimiento 📊" },
  { id: "cierres", label: "Cierres 🤑" },
  { id: "reuniones", label: "Reuniones 📅" },
  { id: "compromisos", label: "Compromisos ✅" },
  { id: "pricing", label: "Pricing 💰" },
];

export default function MaquinasPage() {
  const [tab, setTab] = useState("seguimiento");
  const { data: deals = [] } = useSWR<Deal[]>("/api/deals", fetcher);
  const { data: metas = [] } = useSWR<MetaMensual[]>(`/api/metas?mes=${getMesActual()}`, fetcher);

  return (
    <div style={{ padding: "20px 24px", fontFamily: "'Inter', sans-serif", maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em", margin: 0 }}>
          Máquinas de Ventas 2026
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
          Seguimiento de cierres, reuniones semanales, compromisos y pricing del equipo
        </p>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #E1E0E0" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "9px 18px",
              borderRadius: "8px 8px 0 0",
              border: "none",
              backgroundColor: tab === t.id ? "#4548FF" : "transparent",
              color: tab === t.id ? "#fff" : "#666",
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              marginBottom: tab === t.id ? -2 : 0,
              borderBottom: tab === t.id ? "2px solid #4548FF" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "seguimiento" && <TabSeguimiento deals={deals} metas={metas} />}
      {tab === "cierres" && <TabCierres deals={deals} />}
      {tab === "reuniones" && <TabReuniones deals={deals} />}
      {tab === "compromisos" && <TabCompromisos deals={deals} />}
      {tab === "pricing" && <TabPricing />}
    </div>
  );
}
