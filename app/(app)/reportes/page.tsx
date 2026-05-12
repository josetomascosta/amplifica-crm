"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  PIPELINE_STAGES,
  STAGE_COLORS,
  CATEGORIA_OPTIONS,
  TIPO_PLAN_OPTIONS,
  CLASIFICACION_OPTIONS,
} from "@/lib/pipeline";
import type { DealWithRelations } from "@/components/kanban/board";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Filters = {
  businessDeveloper: string;
  categoriasSeller: string;
  tipoPlan: string;
  clasificacionLead: string;
};

const emptyFilters: Filters = {
  businessDeveloper: "",
  categoriasSeller: "",
  tipoPlan: "",
  clasificacionLead: "",
};

const CLP = (v: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(v);

export default function ReportesPage() {
  const { data: deals, isLoading } = useSWR<DealWithRelations[]>("/api/deals", fetcher);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sortField, setSortField] = useState<string>("monto");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const uniqueOwners = useMemo(() => {
    if (!deals) return [];
    return [...new Set(deals.map((d) => d.businessDeveloper).filter((o): o is string => !!o))].sort();
  }, [deals]);

  const filtered = useMemo(() => {
    if (!deals) return [];
    return deals.filter((d) => {
      if (filters.businessDeveloper && d.businessDeveloper !== filters.businessDeveloper) return false;
      if (filters.categoriasSeller && d.categoriasSeller !== filters.categoriasSeller) return false;
      if (filters.tipoPlan && d.tipoPlan !== filters.tipoPlan) return false;
      if (filters.clasificacionLead && d.clasificacionLead !== filters.clasificacionLead) return false;
      return true;
    });
  }, [deals, filters]);

  const totalValue = filtered.reduce((s, d) => s + (d.monto || 0), 0);
  const avgValue = filtered.length ? totalValue / filtered.length : 0;
  const closed = filtered.filter((d) => d.etapa === "Cierre Ganado");
  const closedValue = closed.reduce((s, d) => s + (d.monto || 0), 0);
  const hasFilters = Object.values(filters).some(Boolean);

  const byStage = PIPELINE_STAGES.map((s) => {
    const ds = filtered.filter((d) => d.etapa === s.id);
    return { ...s, count: ds.length, value: ds.reduce((acc, d) => acc + (d.monto || 0), 0) };
  });
  const maxStageCount = Math.max(...byStage.map((s) => s.count), 1);

  const byBD: Record<string, { count: number; value: number }> = {};
  filtered.forEach((d) => {
    const key = d.businessDeveloper || "Sin asignar";
    if (!byBD[key]) byBD[key] = { count: 0, value: 0 };
    byBD[key].count++;
    byBD[key].value += d.monto || 0;
  });
  const byBDArr = Object.entries(byBD).sort((a, b) => b[1].value - a[1].value);
  const maxBDValue = Math.max(...byBDArr.map(([, v]) => v.value), 1);

  const byCat: Record<string, { count: number; value: number }> = {};
  filtered.forEach((d) => {
    const key = d.categoriasSeller || "Sin categoría";
    if (!byCat[key]) byCat[key] = { count: 0, value: 0 };
    byCat[key].count++;
    byCat[key].value += d.monto || 0;
  });
  const byCatArr = Object.entries(byCat).sort((a, b) => b[1].value - a[1].value);
  const maxCatValue = Math.max(...byCatArr.map(([, v]) => v.value), 1);

  const byPlan: Record<string, { count: number; value: number }> = {};
  filtered.forEach((d) => {
    const key = d.tipoPlan || "Sin plan";
    if (!byPlan[key]) byPlan[key] = { count: 0, value: 0 };
    byPlan[key].count++;
    byPlan[key].value += d.monto || 0;
  });
  const byPlanArr = Object.entries(byPlan).sort((a, b) => b[1].value - a[1].value);
  const maxPlanValue = Math.max(...byPlanArr.map(([, v]) => v.value), 1);

  const sortedDeals = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortField === "monto") { av = a.monto || 0; bv = b.monto || 0; }
      else if (sortField === "nombre") { av = a.nombre || ""; bv = b.nombre || ""; }
      else if (sortField === "etapa") { av = a.etapa || ""; bv = b.etapa || ""; }
      else if (sortField === "bd") { av = a.businessDeveloper || ""; bv = b.businessDeveloper || ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  function exportCSV(deals: DealWithRelations[], activeFilters: Filters) {
    const headers = ["Marca", "Etapa", "BD", "Categoría", "Tipo Plan", "Clasificación Lead", "Monto (CLP)", "Pedidos Mensuales", "Ticket Promedio", "Fecha Cierre"];
    const rows = deals.map((d) => [
      d.nombre || "",
      d.etapa || "",
      d.businessDeveloper || "",
      d.categoriasSeller || "",
      d.tipoPlan || "",
      d.clasificacionLead || "",
      d.monto || 0,
      d.pedidosMensuales || "",
      d.ticketPromedio || "",
      d.fechaCierre ? new Date(d.fechaCierre).toLocaleDateString("es-CL") : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const bom = "﻿";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filterSuffix = Object.values(activeFilters).filter(Boolean).join("-");
    link.download = `reporte-amplifica-${new Date().toISOString().split("T")[0]}${filterSuffix ? "-" + filterSuffix : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Reportes
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
            {hasFilters ? `${filtered.length} de ${deals?.length} deals` : `${deals?.length || 0} deals`}
            {hasFilters && (
              <span style={{ marginLeft: 8, color: "#4548FF", fontWeight: 600 }}>
                · {Object.values(filters).filter(Boolean).length} filtro{Object.values(filters).filter(Boolean).length > 1 ? "s" : ""} activo{Object.values(filters).filter(Boolean).length > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => exportCSV(sortedDeals, filters)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1.5px solid #22c55e", backgroundColor: "rgba(34,197,94,0.07)", color: "#22c55e", fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: "pointer" }}
        >
          ↓ Exportar CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 20, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #E1E0E0" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4 }}>Filtrar:</span>
        <RSelect label="BD" value={filters.businessDeveloper} onChange={(v) => setFilters((p) => ({ ...p, businessDeveloper: v }))} options={uniqueOwners} placeholder="Todos los BD" />
        <RSelect label="Categoría" value={filters.categoriasSeller} onChange={(v) => setFilters((p) => ({ ...p, categoriasSeller: v }))} options={CATEGORIA_OPTIONS} placeholder="Todas" />
        <RSelect label="Plan" value={filters.tipoPlan} onChange={(v) => setFilters((p) => ({ ...p, tipoPlan: v }))} options={TIPO_PLAN_OPTIONS} placeholder="Todos" />
        <RSelect label="Lead" value={filters.clasificacionLead} onChange={(v) => setFilters((p) => ({ ...p, clasificacionLead: v }))} options={CLASIFICACION_OPTIONS} placeholder="Todos" />
        {hasFilters && (
          <button onClick={() => setFilters(emptyFilters)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #ef4444", backgroundColor: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Limpiar ×
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KPICard label="Total deals" value={String(filtered.length)} sub="en selección" color="#4548FF" />
        <KPICard label="Valor pipeline" value={CLP(totalValue)} sub="suma total" color="#4548FF" />
        <KPICard label="Ticket promedio" value={filtered.length ? CLP(avgValue) : "—"} sub="por deal" color="#8b5cf6" />
        <KPICard label="Cierres ganados" value={`${closed.length} deals`} sub={CLP(closedValue)} color="#22c55e" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <ChartCard title="Por Business Developer">
          {byBDArr.length === 0 ? <Empty /> : byBDArr.map(([name, data]) => (
            <BarRow key={name} label={name} count={data.count} value={data.value} max={maxBDValue} color="#4548FF" />
          ))}
        </ChartCard>

        <ChartCard title="Por Categoría Seller">
          {byCatArr.length === 0 ? <Empty /> : byCatArr.map(([name, data]) => (
            <BarRow key={name} label={name} count={data.count} value={data.value} max={maxCatValue} color="#8b5cf6" />
          ))}
        </ChartCard>

        <ChartCard title="Por Tipo de Plan">
          {byPlanArr.length === 0 ? <Empty /> : byPlanArr.map(([name, data]) => (
            <BarRow key={name} label={name} count={data.count} value={data.value} max={maxPlanValue} color="#f97316" />
          ))}
        </ChartCard>

        <ChartCard title="Funnel por Etapa">
          {byStage.filter((s) => s.count > 0).length === 0 ? <Empty /> : byStage.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "#555", width: 140, flexShrink: 0, fontWeight: 500 }}>{s.emoji} {s.label}</span>
              <div style={{ flex: 1, height: 8, backgroundColor: "#F0F2F7", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(s.count / maxStageCount) * 100}%`, backgroundColor: STAGE_COLORS[s.color], borderRadius: 4, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#333", width: 24, textAlign: "right" }}>{s.count}</span>
            </div>
          ))}
        </ChartCard>
      </div>

      {/* Deal Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #E1E0E0", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E1E0E0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#121755", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Detalle de Deals
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>{sortedDeals.length} registros</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: "#F8F9FC" }}>
                <TH label="Marca" field="nombre" sort={sortField} dir={sortDir} onSort={toggleSort} />
                <TH label="Etapa" field="etapa" sort={sortField} dir={sortDir} onSort={toggleSort} />
                <TH label="BD" field="bd" sort={sortField} dir={sortDir} onSort={toggleSort} />
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Lead</th>
                <TH label="Monto" field="monto" sort={sortField} dir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((d, i) => (
                <tr key={d.id} style={{ borderTop: "1px solid #F0F2F7", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={tdStyle}><span style={{ fontWeight: 600, color: "#121755" }}>{d.nombre}</span></td>
                  <td style={tdStyle}><StageBadge etapa={d.etapa} /></td>
                  <td style={tdStyle}>{d.businessDeveloper || <Dim>—</Dim>}</td>
                  <td style={tdStyle}>{d.categoriasSeller || <Dim>—</Dim>}</td>
                  <td style={tdStyle}>{d.tipoPlan || <Dim>—</Dim>}</td>
                  <td style={tdStyle}>{d.clasificacionLead ? <LeadBadge val={d.clasificacionLead} /> : <Dim>—</Dim>}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#4548FF", textAlign: "right" }}>
                    {d.monto ? CLP(d.monto) : <Dim>—</Dim>}
                  </td>
                </tr>
              ))}
              {sortedDeals.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#aaa", fontSize: 13 }}>
                    Sin deals con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #E1E0E0", padding: "16px 20px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
      <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{sub}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #E1E0E0", padding: "16px 20px" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#121755", marginBottom: 14, fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function BarRow({ label, count, value, max, color }: { label: string; count: number; value: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#555", width: 120, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 18, backgroundColor: "#F0F2F7", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(value / max) * 100}%`, backgroundColor: color, borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 6, transition: "width 0.3s", minWidth: value > 0 ? 4 : 0 }}>
          {value > 0 && <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{count}</span>}
        </div>
      </div>
      <span style={{ fontSize: 12, color: "#333", fontWeight: 600, whiteSpace: "nowrap" }}>
        {new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 1 }).format(value)}
      </span>
    </div>
  );
}

function RSelect({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const active = !!value;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: active ? "1.5px solid #4548FF" : "1.5px solid #E1E0E0", backgroundColor: active ? "rgba(69,72,255,0.06)" : "#fff", color: active ? "#4548FF" : "#555", fontSize: 13, fontFamily: "'Inter', sans-serif", cursor: "pointer", outline: "none", fontWeight: active ? 600 : 400 }}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "10px 16px", color: "#333", verticalAlign: "middle" };

function TH({ label, field, sort, dir, onSort }: { label: string; field: string; sort: string; dir: string; onSort: (f: string) => void }) {
  const active = sort === field;
  return (
    <th style={{ ...thStyle, cursor: "pointer", color: active ? "#4548FF" : "#888", userSelect: "none" }} onClick={() => onSort(field)}>
      {label} {active ? (dir === "asc" ? "↑" : "↓") : ""}
    </th>
  );
}

function StageBadge({ etapa }: { etapa: string }) {
  const stage = PIPELINE_STAGES.find((s) => s.id === etapa);
  const color = stage ? STAGE_COLORS[stage.color] : "#aaa";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, backgroundColor: color + "18", color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {stage?.emoji} {etapa}
    </span>
  );
}

function LeadBadge({ val }: { val: string }) {
  const colors: Record<string, string> = { Bueno: "#22c55e", Medio: "#f97316", Malo: "#ef4444" };
  const c = colors[val] || "#aaa";
  return <span style={{ padding: "2px 8px", borderRadius: 20, backgroundColor: c + "18", color: c, fontSize: 11, fontWeight: 600 }}>{val}</span>;
}

function Dim({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#ccc" }}>{children}</span>;
}

function Empty() {
  return <p style={{ fontSize: 13, color: "#ccc", textAlign: "center", padding: "12px 0" }}>Sin datos</p>;
}

function Spinner() {
  return <div style={{ width: 36, height: 36, border: "3px solid #E1E0E0", borderTopColor: "#4548FF", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}
