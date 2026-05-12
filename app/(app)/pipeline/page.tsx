"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { NewDealModal } from "@/components/modals/new-deal-modal";
import {
  CATEGORIA_OPTIONS,
  TIPO_PLAN_OPTIONS,
  CLASIFICACION_OPTIONS,
} from "@/lib/pipeline";

const KanbanBoard = dynamic(
  () => import("@/components/kanban/board").then((m) => m.KanbanBoard),
  { ssr: false, loading: () => <LoadingSpinner /> }
);
import type { DealWithRelations } from "@/components/kanban/board";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type PipelineFilters = {
  businessDeveloper: string;
  categoriasSeller: string;
  tipoPlan: string;
  clasificacionLead: string;
};

const emptyFilters: PipelineFilters = {
  businessDeveloper: "",
  categoriasSeller: "",
  tipoPlan: "",
  clasificacionLead: "",
};

export default function PipelinePage() {
  const { data: deals, mutate, isLoading } = useSWR<DealWithRelations[]>(
    "/api/deals",
    fetcher,
    { refreshInterval: 30000 }
  );
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<PipelineFilters>(emptyFilters);

  function handleCreated(deal: DealWithRelations) {
    mutate((prev) => (prev ? [deal, ...prev] : [deal]), false);
  }

  const uniqueOwners = useMemo(() => {
    if (!deals) return [];
    const owners = deals
      .map((d) => d.businessDeveloper)
      .filter((o): o is string => !!o);
    return [...new Set(owners)].sort();
  }, [deals]);

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    return deals.filter((d) => {
      if (filters.businessDeveloper && d.businessDeveloper !== filters.businessDeveloper) return false;
      if (filters.categoriasSeller && d.categoriasSeller !== filters.categoriasSeller) return false;
      if (filters.tipoPlan && d.tipoPlan !== filters.tipoPlan) return false;
      if (filters.clasificacionLead && d.clasificacionLead !== filters.clasificacionLead) return false;
      return true;
    });
  }, [deals, filters]);

  const totalValue = filteredDeals.reduce((s, d) => s + (d.monto || 0), 0);
  const hasFilters = Object.values(filters).some(Boolean);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function setFilter(key: keyof PipelineFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 28,
              color: "#121755",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Pipeline de Ventas
          </h1>
          {deals && (
            <p style={{ fontSize: 13, color: "#888", fontFamily: "'Inter', sans-serif", marginTop: 2 }}>
              {hasFilters ? `${filteredDeals.length} de ${deals.length} deals` : `${deals.length} deals`}
              {" · "}
              <span style={{ fontWeight: 600, color: "#4548FF" }}>
                {new Intl.NumberFormat("es-CL", {
                  style: "currency",
                  currency: "CLP",
                  minimumFractionDigits: 0,
                }).format(totalValue)}{" "}
                en pipeline
              </span>
              {hasFilters && (
                <span style={{ marginLeft: 8, color: "#4548FF", fontWeight: 600 }}>
                  · {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} activo{activeFilterCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#4548FF",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3335dd")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4548FF")}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Nuevo Deal
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          padding: "12px 24px 0",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <FilterSelect
          label="BD / Dueño"
          value={filters.businessDeveloper}
          onChange={(v) => setFilter("businessDeveloper", v)}
          options={uniqueOwners}
          placeholder="Todos los BD"
        />
        <FilterSelect
          label="Categoría"
          value={filters.categoriasSeller}
          onChange={(v) => setFilter("categoriasSeller", v)}
          options={CATEGORIA_OPTIONS}
          placeholder="Todas las categorías"
        />
        <FilterSelect
          label="Plan"
          value={filters.tipoPlan}
          onChange={(v) => setFilter("tipoPlan", v)}
          options={TIPO_PLAN_OPTIONS}
          placeholder="Todos los planes"
        />
        <FilterSelect
          label="Lead"
          value={filters.clasificacionLead}
          onChange={(v) => setFilter("clasificacionLead", v)}
          options={CLASIFICACION_OPTIONS}
          placeholder="Todos los leads"
        />
        {hasFilters && (
          <button
            onClick={() => setFilters(emptyFilters)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1.5px solid #ef4444",
              backgroundColor: "transparent",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: "pointer",
            }}
          >
            Limpiar filtros ×
          </button>
        )}
      </div>

      {/* Board */}
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
          <LoadingSpinner />
        </div>
      ) : (
        <KanbanBoard initialDeals={deals || []} filters={filters} />
      )}

      {showModal && (
        <NewDealModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const active = !!value;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#888",
          fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}
      >
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "5px 10px",
          borderRadius: 6,
          border: active ? "1.5px solid #4548FF" : "1.5px solid #E1E0E0",
          backgroundColor: active ? "rgba(69,72,255,0.06)" : "#fff",
          color: active ? "#4548FF" : "#555",
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          cursor: "pointer",
          outline: "none",
          fontWeight: active ? 600 : 400,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: "3px solid #E1E0E0",
        borderTopColor: "#4548FF",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}
