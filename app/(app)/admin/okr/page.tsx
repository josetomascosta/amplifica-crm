"use client";

import { useState, useEffect } from "react";

type KeyResult = { id: string; titulo: string; actual: number; objetivo: number; unidad: string };
type OKR = { id: string; objetivo: string; descripcion: string | null; trimestre: string; activo: boolean; keyResults: KeyResult[] };

const TRIMESTRES = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"];

export default function AdminOKRPage() {
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | null>(null);
  const [form, setForm] = useState({ objetivo: "", descripcion: "", trimestre: "Q2 2026", activo: true });
  const [saving, setSaving] = useState(false);

  // KR form state per OKR
  const [krForms, setKrForms] = useState<Record<string, { titulo: string; objetivo: string; actual: string; unidad: string }>>({});

  useEffect(() => { fetchOKRs(); }, []);

  async function fetchOKRs() {
    setLoading(true);
    const res = await fetch("/api/okr");
    setOkrs(await res.json());
    setLoading(false);
  }

  async function saveOKR() {
    setSaving(true);
    if (editingOKR) {
      await fetch(`/api/okr/${editingOKR.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/okr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false);
    setShowForm(false);
    setEditingOKR(null);
    setForm({ objetivo: "", descripcion: "", trimestre: "Q2 2026", activo: true });
    fetchOKRs();
  }

  async function deleteOKR(id: string) {
    if (!confirm("¿Eliminar este OKR y todos sus Key Results?")) return;
    await fetch(`/api/okr/${id}`, { method: "DELETE" });
    fetchOKRs();
  }

  async function toggleActive(okr: OKR) {
    await fetch(`/api/okr/${okr.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: !okr.activo }) });
    fetchOKRs();
  }

  function startEdit(okr: OKR) {
    setEditingOKR(okr);
    setForm({ objetivo: okr.objetivo, descripcion: okr.descripcion || "", trimestre: okr.trimestre, activo: okr.activo });
    setShowForm(true);
  }

  async function addKR(okrId: string) {
    const krf = krForms[okrId];
    if (!krf?.titulo || !krf?.objetivo) return;
    await fetch(`/api/okr/${okrId}/keyresults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: krf.titulo, objetivo: krf.objetivo, actual: krf.actual || 0, unidad: krf.unidad || "unidades" }),
    });
    setKrForms((p) => ({ ...p, [okrId]: { titulo: "", objetivo: "", actual: "", unidad: "" } }));
    fetchOKRs();
  }

  async function updateKRActual(krId: string, actual: string) {
    await fetch(`/api/keyresults/${krId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actual: Number(actual) }) });
    fetchOKRs();
  }

  async function deleteKR(krId: string) {
    await fetch(`/api/keyresults/${krId}`, { method: "DELETE" });
    fetchOKRs();
  }

  return (
    <div style={{ padding: "20px 24px", fontFamily: "'Inter', sans-serif", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            OKR — Administración
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Gestiona los objetivos y key results del equipo</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingOKR(null); setForm({ objetivo: "", descripcion: "", trimestre: "Q2 2026", activo: true }); }}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", backgroundColor: "#4548FF", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          + Nuevo OKR
        </button>
      </div>

      {/* OKR Form */}
      {showForm && (
        <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: "#121755", textTransform: "uppercase", marginBottom: 16 }}>
            {editingOKR ? "Editar OKR" : "Nuevo OKR"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Objetivo</Label>
              <Input value={form.objetivo} onChange={(v) => setForm((p) => ({ ...p, objetivo: v }))} placeholder="Ej: Consolidar el crecimiento" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Label>Descripción (opcional)</Label>
              <Input value={form.descripcion} onChange={(v) => setForm((p) => ({ ...p, descripcion: v }))} placeholder="Contexto del objetivo" />
            </div>
            <div>
              <Label>Trimestre</Label>
              <select value={form.trimestre} onChange={(e) => setForm((p) => ({ ...p, trimestre: e.target.value }))} style={selectStyle}>
                {TRIMESTRES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", cursor: "pointer" }}>
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />
                Activo (visible en dashboard)
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={saveOKR} disabled={!form.objetivo || saving} style={{ padding: "8px 20px", borderRadius: 7, border: "none", backgroundColor: form.objetivo ? "#4548FF" : "#ccc", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingOKR(null); }} style={{ padding: "8px 16px", borderRadius: 7, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Cargando...</div>
      ) : okrs.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#aaa" }}>No hay OKRs creados aún. Crea el primero.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {okrs.map((okr) => {
            const krf = krForms[okr.id] || { titulo: "", objetivo: "", actual: "", unidad: "" };
            const totalProgress = okr.keyResults.length > 0
              ? okr.keyResults.reduce((s, kr) => s + Math.min(kr.actual / kr.objetivo, 1), 0) / okr.keyResults.length * 100
              : 0;
            return (
              <div key={okr.id} style={{ backgroundColor: "#fff", border: "1px solid #E1E0E0", borderRadius: 12, overflow: "hidden" }}>
                {/* OKR Header */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F2F7", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: okr.activo ? "rgba(69,72,255,0.1)" : "#F0F2F7", color: okr.activo ? "#4548FF" : "#888", padding: "2px 8px", borderRadius: 20 }}>
                        {okr.trimestre}
                      </span>
                      {!okr.activo && <span style={{ fontSize: 11, color: "#aaa" }}>Inactivo</span>}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 16, color: "#121755", marginTop: 4 }}>{okr.objetivo}</p>
                    {okr.descripcion && <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{okr.descripcion}</p>}
                    {okr.keyResults.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, backgroundColor: "#F0F2F7", borderRadius: 3, maxWidth: 200 }}>
                          <div style={{ height: "100%", width: `${totalProgress}%`, backgroundColor: totalProgress >= 100 ? "#22c55e" : totalProgress >= 70 ? "#4548FF" : "#f97316", borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{Math.round(totalProgress)}%</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleActive(okr)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", color: "#555", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {okr.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button onClick={() => startEdit(okr)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #4548FF", backgroundColor: "rgba(69,72,255,0.06)", color: "#4548FF", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Editar
                    </button>
                    <button onClick={() => deleteOKR(okr.id)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #ef4444", backgroundColor: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Key Results */}
                <div style={{ padding: "12px 20px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Key Results ({okr.keyResults.length})
                  </p>
                  {okr.keyResults.map((kr) => {
                    const pct = Math.min((kr.actual / kr.objetivo) * 100, 100);
                    return (
                      <div key={kr.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 0", borderBottom: "1px solid #F8F9FC" }}>
                        <span style={{ flex: 1, fontSize: 13, color: "#333" }}>{kr.titulo}</span>
                        <div style={{ width: 120, height: 6, backgroundColor: "#F0F2F7", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${pct}%`, backgroundColor: pct >= 100 ? "#22c55e" : pct >= 70 ? "#4548FF" : "#f97316", borderRadius: 3 }} />
                        </div>
                        <input
                          type="number"
                          defaultValue={kr.actual}
                          onBlur={(e) => { if (Number(e.target.value) !== kr.actual) updateKRActual(kr.id, e.target.value); }}
                          style={{ width: 60, padding: "3px 6px", borderRadius: 5, border: "1px solid #E1E0E0", fontSize: 12, textAlign: "center" }}
                        />
                        <span style={{ fontSize: 12, color: "#888" }}>/ {kr.objetivo} {kr.unidad}</span>
                        <button onClick={() => deleteKR(kr.id)} style={{ padding: "2px 8px", border: "1px solid #ef4444", borderRadius: 5, backgroundColor: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>×</button>
                      </div>
                    );
                  })}

                  {/* Add KR form */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    <input
                      value={krf.titulo}
                      onChange={(e) => setKrForms((p) => ({ ...p, [okr.id]: { ...krf, titulo: e.target.value } }))}
                      placeholder="Key Result"
                      style={{ flex: 2, minWidth: 150, padding: "5px 10px", borderRadius: 6, border: "1px solid #E1E0E0", fontSize: 12 }}
                    />
                    <input
                      type="number"
                      value={krf.objetivo}
                      onChange={(e) => setKrForms((p) => ({ ...p, [okr.id]: { ...krf, objetivo: e.target.value } }))}
                      placeholder="Meta"
                      style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: "1px solid #E1E0E0", fontSize: 12, textAlign: "center" }}
                    />
                    <input
                      value={krf.unidad}
                      onChange={(e) => setKrForms((p) => ({ ...p, [okr.id]: { ...krf, unidad: e.target.value } }))}
                      placeholder="unidad"
                      style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: "1px solid #E1E0E0", fontSize: 12 }}
                    />
                    <button
                      onClick={() => addKR(okr.id)}
                      disabled={!krf.titulo || !krf.objetivo}
                      style={{ padding: "5px 14px", borderRadius: 6, border: "none", backgroundColor: krf.titulo && krf.objetivo ? "#4548FF" : "#ccc", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      + Agregar KR
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{children}</p>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }}
    />
  );
}

const selectStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", backgroundColor: "#fff", outline: "none" };
