"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import type { DealWithRelations } from "@/components/kanban/board";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Meta = { id: string; mes: string; tipo: string; assignee: string; objetivo: number };

const TIPOS = [
  { value: "cierres", label: "Pedidos Cerrados", emoji: "🤑" },
  { value: "reuniones", label: "Reuniones Realizadas", emoji: "📅" },
];

function getMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMesLabel(mes: string) {
  const [y, m] = mes.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

export default function AdminMetasPage() {
  const [mes, setMes] = useState(getMesActual());
  const [metas, setMetas] = useState<Meta[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const { data: deals } = useSWR<DealWithRelations[]>("/api/deals", fetcher);

  const bds = useMemo(() => {
    if (!deals) return [];
    const names = deals.map((d) => d.businessDeveloper).filter((b): b is string => !!b);
    return [...new Set(names)].sort();
  }, [deals]);

  const assignees = ["equipo", ...bds];

  useEffect(() => { fetchMetas(); }, [mes]);

  async function fetchMetas() {
    const res = await fetch(`/api/metas?mes=${mes}`);
    setMetas(await res.json());
  }

  function getObjetivo(tipo: string, assignee: string) {
    return metas.find((m) => m.tipo === tipo && m.assignee === assignee)?.objetivo ?? "";
  }

  async function saveMeta(tipo: string, assignee: string, objetivo: string) {
    if (!objetivo) return;
    const key = `${tipo}-${assignee}`;
    setSaving(key);
    await fetch("/api/metas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes, tipo, assignee, objetivo: Number(objetivo) }),
    });
    setSaving(null);
    fetchMetas();
  }

  return (
    <div style={{ padding: "20px 24px", fontFamily: "'Inter', sans-serif", maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em" }}>
          Metas Mensuales
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
          Define los objetivos mensuales del equipo e individuales para el dashboard
        </p>
      </div>

      {/* Mes selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "12px 16px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #E1E0E0" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Mes:</span>
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none" }}
        />
        <span style={{ fontSize: 13, color: "#4548FF", fontWeight: 600, textTransform: "capitalize" }}>
          {getMesLabel(mes)}
        </span>
      </div>

      {/* Metas table */}
      {TIPOS.map(({ value: tipo, label, emoji }) => (
        <div key={tipo} style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0F2F7", backgroundColor: "#FAFAFA" }}>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#121755", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {emoji} {label}
            </h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            {assignees.map((assignee) => {
              const key = `${tipo}-${assignee}`;
              const current = getObjetivo(tipo, assignee);
              const isTeam = assignee === "equipo";
              return (
                <div key={assignee} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #F8F9FC" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: isTeam ? 700 : 400, color: isTeam ? "#121755" : "#333" }}>
                      {isTeam ? "🏆 Equipo completo" : assignee}
                    </span>
                    {isTeam && <p style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>Meta total del equipo</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>Objetivo:</span>
                    <input
                      type="number"
                      defaultValue={current}
                      key={`${mes}-${key}-${current}`}
                      onBlur={(e) => { if (e.target.value !== String(current)) saveMeta(tipo, assignee, e.target.value); }}
                      placeholder="—"
                      style={{ width: 80, padding: "5px 10px", borderRadius: 6, border: "1.5px solid #E1E0E0", fontSize: 13, textAlign: "center", outline: "none" }}
                    />
                    {saving === key && <span style={{ fontSize: 11, color: "#4548FF" }}>✓</span>}
                  </div>
                </div>
              );
            })}
            {bds.length === 0 && (
              <p style={{ padding: "12px 20px", fontSize: 12, color: "#aaa" }}>
                Los BD aparecerán aquí una vez que tengan deals asignados en el CRM.
              </p>
            )}
          </div>
        </div>
      ))}

      <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 16 }}>
        Los valores se guardan al salir de cada campo. Repite para cada mes que necesites.
      </p>
    </div>
  );
}
