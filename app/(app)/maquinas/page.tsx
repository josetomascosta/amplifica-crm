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

type ReunionSemanal = { id: string; semana: string; bdNombre: string; cantidad: number };
type CompromisoSemanal = { id: string; semana: string; bdNombre: string; texto: string; completado: boolean; resultado: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSemanaActual() {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function semanaLabel(s: string) {
  const [y, w] = s.split("-W");
  const year = Number(y);
  const week = Number(w);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  return `Semana ${week} · ${fmt(monday)} – ${fmt(sunday)}`;
}

function fmtCLP(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CL").format(n);
}

// ─── Tab: Cierres ─────────────────────────────────────────────────────────────

function TabCierres({ deals }: { deals: Deal[] }) {
  const cierres = deals.filter((d) => d.etapa.toLowerCase().includes("cierre"));

  const totalPedidos = cierres.reduce((s, d) => s + (d.pedidosMensuales ?? 0), 0);
  const totalIngreso = cierres.reduce((s, d) => {
    const ing = (d.pedidosMensuales ?? 0) * (d.tarifaPorPedido ?? 0);
    return s + ing;
  }, 0);

  return (
    <div>
      {/* KPIs resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Cierres activos", value: cierres.length, color: "#4548FF" },
          { label: "Pedidos/mes totales", value: fmtNum(totalPedidos), color: "#121755" },
          { label: "Ingreso mensual est.", value: fmtCLP(totalIngreso), color: "#16a34a" },
        ].map((k) => (
          <div key={k.label} style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, marginTop: 4, fontFamily: "'Barlow Condensed', sans-serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabla de cierres */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#F0F2F7" }}>
              {["Cliente", "BD", "Plan", "Pedidos/mes", "Tarifa/pedido", "Ingreso mensual", "Ticket prom.", "Sucursales", "Onboarding"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cierres.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#aaa", fontSize: 13 }}>No hay cierres aún. Los deals en etapa "Cierre Ganado" aparecerán aquí.</td></tr>
            ) : cierres.map((d, i) => {
              const ingreso = (d.pedidosMensuales ?? 0) * (d.tarifaPorPedido ?? 0);
              return (
                <tr key={d.id} style={{ borderTop: i > 0 ? "1px solid #F0F2F7" : undefined, backgroundColor: i % 2 === 0 ? "#fff" : "#FAFBFF" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#121755" }}>{d.nombre}</td>
                  <td style={{ padding: "10px 14px", color: "#555" }}>{d.businessDeveloper ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {d.tipoPlan ? (
                      <span style={{ padding: "2px 8px", borderRadius: 20, backgroundColor: "#EEF2FF", color: "#4548FF", fontSize: 11, fontWeight: 600 }}>{d.tipoPlan}</span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600 }}>{fmtNum(d.pedidosMensuales)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>{fmtCLP(d.tarifaPorPedido)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: ingreso > 0 ? "#16a34a" : "#aaa" }}>{fmtCLP(ingreso || null)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>{fmtCLP(d.ticketPromedio)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{d.sucursales ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#888", fontSize: 12 }}>
                    {d.fechaOnboarding ? new Date(d.fechaOnboarding).toLocaleDateString("es-CL", { day: "numeric", month: "short" }) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>
        Los datos de pedidos, tarifa y ticket se editan en el panel de cada deal del Pipeline.
      </p>
    </div>
  );
}

// ─── Tab: Reuniones ───────────────────────────────────────────────────────────

function TabReuniones({ deals }: { deals: Deal[] }) {
  const [semana, setSemana] = useState(getSemanaActual());
  const [reuniones, setReuniones] = useState<ReunionSemanal[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const bds = useMemo(() => {
    const names = deals.map((d) => d.businessDeveloper).filter((b): b is string => !!b);
    return [...new Set(names)].sort();
  }, [deals]);

  const fetchReuniones = useCallback(async () => {
    const res = await fetch(`/api/reuniones?semana=${semana}`);
    setReuniones(await res.json());
  }, [semana]);

  useEffect(() => { fetchReuniones(); }, [fetchReuniones]);

  function getCantidad(bd: string) {
    return reuniones.find((r) => r.bdNombre === bd)?.cantidad ?? 0;
  }

  async function saveCantidad(bd: string, cantidad: string) {
    setSaving(bd);
    await fetch("/api/reuniones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semana, bdNombre: bd, cantidad: Number(cantidad) || 0 }),
    });
    setSaving(null);
    fetchReuniones();
  }

  const semanas = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const year = d.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
      const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
      result.push(`${year}-W${String(week).padStart(2, "0")}`);
    }
    return result;
  }, []);

  const totalSemana = reuniones.reduce((s, r) => s + r.cantidad, 0);

  return (
    <div>
      {/* Selector de semana */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #E1E0E0" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Semana:</span>
        <select
          value={semana}
          onChange={(e) => setSemana(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", color: "#333" }}
        >
          {semanas.map((s) => (
            <option key={s} value={s}>{semanaLabel(s)}</option>
          ))}
        </select>
        <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#4548FF" }}>Total: {totalSemana} reuniones</span>
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#121755", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Reuniones realizadas
          </h3>
          <span style={{ fontSize: 12, color: "#888" }}>Ingresa cuántas reuniones realizó cada BD esta semana</span>
        </div>
        <div style={{ padding: "8px 0" }}>
          {bds.length === 0 ? (
            <p style={{ padding: "20px", fontSize: 13, color: "#aaa", textAlign: "center" }}>Los BD aparecerán aquí una vez que tengan deals en el Pipeline.</p>
          ) : bds.map((bd) => (
            <div key={bd} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #F8F9FC" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#4548FF" }}>
                {bd.charAt(0).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#333" }}>{bd}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => saveCantidad(bd, String(Math.max(0, getCantidad(bd) - 1)))}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}
                >−</button>
                <input
                  type="number"
                  value={getCantidad(bd)}
                  onChange={(e) => saveCantidad(bd, e.target.value)}
                  min={0}
                  style={{ width: 56, padding: "5px 10px", borderRadius: 6, border: "1.5px solid #E1E0E0", fontSize: 15, textAlign: "center", outline: "none", fontWeight: 700 }}
                />
                <button
                  onClick={() => saveCantidad(bd, String(getCantidad(bd) + 1))}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}
                >+</button>
                {saving === bd && <span style={{ fontSize: 11, color: "#4548FF" }}>✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Compromisos ─────────────────────────────────────────────────────────

function TabCompromisos({ deals }: { deals: Deal[] }) {
  const [semana, setSemana] = useState(getSemanaActual());
  const [compromisos, setCompromisos] = useState<CompromisoSemanal[]>([]);
  const [newBd, setNewBd] = useState("");
  const [newTexto, setNewTexto] = useState("");
  const [adding, setAdding] = useState(false);

  const bds = useMemo(() => {
    const names = deals.map((d) => d.businessDeveloper).filter((b): b is string => !!b);
    return [...new Set(names)].sort();
  }, [deals]);

  const fetchCompromisos = useCallback(async () => {
    const res = await fetch(`/api/compromisos?semana=${semana}`);
    setCompromisos(await res.json());
  }, [semana]);

  useEffect(() => { fetchCompromisos(); }, [fetchCompromisos]);
  useEffect(() => { if (bds.length > 0 && !newBd) setNewBd(bds[0]); }, [bds, newBd]);

  const semanas = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const year = d.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
      const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
      result.push(`${year}-W${String(week).padStart(2, "0")}`);
    }
    return result;
  }, []);

  async function addCompromiso() {
    if (!newTexto.trim() || !newBd) return;
    setAdding(true);
    await fetch("/api/compromisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ semana, bdNombre: newBd, texto: newTexto.trim() }),
    });
    setNewTexto("");
    setAdding(false);
    fetchCompromisos();
  }

  async function toggleCompromiso(id: string, completado: boolean) {
    await fetch(`/api/compromisos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completado: !completado }),
    });
    fetchCompromisos();
  }

  async function deleteCompromiso(id: string) {
    await fetch(`/api/compromisos/${id}`, { method: "DELETE" });
    fetchCompromisos();
  }

  const byBd = useMemo(() => {
    const groups: Record<string, CompromisoSemanal[]> = {};
    for (const c of compromisos) {
      if (!groups[c.bdNombre]) groups[c.bdNombre] = [];
      groups[c.bdNombre].push(c);
    }
    return groups;
  }, [compromisos]);

  const completados = compromisos.filter((c) => c.completado).length;

  return (
    <div>
      {/* Selector semana */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #E1E0E0" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Semana:</span>
        <select
          value={semana}
          onChange={(e) => setSemana(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", color: "#333" }}
        >
          {semanas.map((s) => (
            <option key={s} value={s}>{semanaLabel(s)}</option>
          ))}
        </select>
        {compromisos.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: completados === compromisos.length ? "#16a34a" : "#4548FF" }}>
            {completados}/{compromisos.length} completados
          </span>
        )}
      </div>

      {/* Agregar compromiso */}
      <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#121755", marginBottom: 10 }}>Agregar compromiso</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={newBd}
            onChange={(e) => setNewBd(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", color: "#333", minWidth: 140 }}
          >
            {bds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input
            type="text"
            value={newTexto}
            onChange={(e) => setNewTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCompromiso(); }}
            placeholder="Describir el compromiso de la semana..."
            style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none" }}
          />
          <button
            onClick={addCompromiso}
            disabled={adding || !newTexto.trim()}
            style={{ padding: "8px 16px", borderRadius: 7, backgroundColor: "#4548FF", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: adding || !newTexto.trim() ? 0.5 : 1 }}
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Lista por BD */}
      {Object.keys(byBd).length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, padding: "32px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
          No hay compromisos esta semana. Agrega el primero arriba.
        </div>
      ) : Object.entries(byBd).map(([bd, items]) => (
        <div key={bd} style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#FAFAFA", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#4548FF" }}>
              {bd.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, color: "#121755", fontSize: 14 }}>{bd}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#888" }}>
              {items.filter((c) => c.completado).length}/{items.length} ✓
            </span>
          </div>
          {items.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #F8F9FC" }}>
              <button
                onClick={() => toggleCompromiso(c.id, c.completado)}
                style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${c.completado ? "#16a34a" : "#E1E0E0"}`, backgroundColor: c.completado ? "#16a34a" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                {c.completado && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
              </button>
              <span style={{ flex: 1, fontSize: 13, color: c.completado ? "#888" : "#333", textDecoration: c.completado ? "line-through" : "none" }}>
                {c.texto}
              </span>
              <button
                onClick={() => deleteCompromiso(c.id)}
                style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #F0F2F7", backgroundColor: "#fff", color: "#ccc", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Pricing ─────────────────────────────────────────────────────────────

function TabPricing() {
  const planes = [
    {
      nombre: "Básico",
      color: "#E1E0E0",
      colorText: "#555",
      descripcion: "Para sellers con volumen bajo",
      pedidos: "Hasta 500 pedidos/mes",
      tarifa: "$490/pedido",
      minimo: "$245.000/mes",
      caracteristicas: ["Sin costo de onboarding", "Soporte estándar", "1 canal de venta"],
    },
    {
      nombre: "Estándar",
      color: "#4548FF",
      colorText: "#fff",
      descripcion: "El plan más elegido",
      pedidos: "501 – 2.000 pedidos/mes",
      tarifa: "$420/pedido",
      minimo: "$420.000/mes",
      caracteristicas: ["Onboarding incluido", "Soporte prioritario", "Hasta 3 canales", "Reportes mensuales"],
    },
    {
      nombre: "Pro",
      color: "#121755",
      colorText: "#fff",
      descripcion: "Para operaciones de alto volumen",
      pedidos: "2.001+ pedidos/mes",
      tarifa: "Tarifa negociada",
      minimo: "A convenir",
      caracteristicas: ["Account manager dedicado", "SLA garantizado", "Multi-canal ilimitado", "BI dashboard", "Integraciones custom"],
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#888" }}>
          Referencia interna de precios. Para propuestas personalizadas consulta con tu Business Developer.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {planes.map((p) => (
          <div key={p.nombre} style={{ backgroundColor: p.color, borderRadius: 14, padding: "24px 22px", color: p.colorText, border: p.nombre === "Básico" ? "1px solid #E1E0E0" : "none" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.nombre}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2, marginBottom: 16 }}>{p.descripcion}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>{p.tarifa}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{p.pedidos}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 20 }}>Mínimo: {p.minimo}</div>
            <div style={{ borderTop: `1px solid ${p.nombre === "Básico" ? "#E1E0E0" : "rgba(255,255,255,0.2)"}`, paddingTop: 14 }}>
              {p.caracteristicas.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12 }}>
                  <span style={{ opacity: 0.8 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, padding: "14px 20px", backgroundColor: "#FFF9E6", border: "1px solid #F7DC4B", borderRadius: 10, fontSize: 12, color: "#555" }}>
        💡 Estos precios son referencia interna. Los contratos oficiales se generan desde el módulo de Pipeline. Boost y servicios adicionales tienen tarifas separadas.
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "cierres", label: "Cierres 🤑" },
  { id: "reuniones", label: "Reuniones 📅" },
  { id: "compromisos", label: "Compromisos ✅" },
  { id: "pricing", label: "Pricing 💰" },
];

export default function MaquinasPage() {
  const [tab, setTab] = useState("cierres");
  const { data: deals = [] } = useSWR<Deal[]>("/api/deals", fetcher);

  return (
    <div style={{ padding: "20px 24px", fontFamily: "'Inter', sans-serif", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em", margin: 0 }}>
          Máquinas de Ventas 2026
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
          Seguimiento de cierres, reuniones, compromisos y precios del equipo
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #E1E0E0", paddingBottom: 0 }}>
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
              transition: "all 0.15s",
              marginBottom: tab === t.id ? -2 : 0,
              borderBottom: tab === t.id ? "2px solid #4548FF" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "cierres" && <TabCierres deals={deals} />}
      {tab === "reuniones" && <TabReuniones deals={deals} />}
      {tab === "compromisos" && <TabCompromisos deals={deals} />}
      {tab === "pricing" && <TabPricing />}
    </div>
  );
}
