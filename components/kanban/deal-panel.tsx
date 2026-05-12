"use client";

import { useState } from "react";
import { formatCLP, daysSince } from "@/lib/utils";
import {
  PIPELINE_STAGES,
  CATEGORIA_OPTIONS,
  FUENTE_OPTIONS,
  CLASIFICACION_OPTIONS,
  ECOMMERCE_OPTIONS,
  TIPO_PLAN_OPTIONS,
  MODELO_COBRO_OPTIONS,
  BOOST_OPTIONS,
  STAGE_COLORS,
} from "@/lib/pipeline";
import type { DealWithRelations } from "./board";

type DealPanelProps = {
  deal: DealWithRelations;
  onClose: () => void;
  onUpdate: (updated: DealWithRelations) => void;
  onStageChange: (dealId: string, etapa: string) => void;
};

export function DealPanel({ deal, onClose, onUpdate, onStageChange }: DealPanelProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...deal });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  const currentStageData = PIPELINE_STAGES.find((s) => s.id === deal.etapa);
  const stageColor = STAGE_COLORS[currentStageData?.color || "blue"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative",
          width: 480,
          height: "100%",
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E1E0E0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            borderTop: `4px solid ${stageColor}`,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 24,
                color: "#121755",
                textTransform: "uppercase",
              }}
            >
              {deal.nombre}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#888",
                marginTop: 4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {daysSince(deal.createdAt)} días en el CRM ·{" "}
              {deal.actividades?.length || 0} actividades
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setEditing((v) => !v)}
              style={{
                backgroundColor: editing ? "#4548FF" : "#F0F2F7",
                color: editing ? "#fff" : "#1D1D1F",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {editing ? "Cancelar" : "Editar"}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#888",
                fontSize: 20,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Stage selector */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E1E0E0" }}>
          <label style={labelStyle}>Etapa del pipeline</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {PIPELINE_STAGES.map((stage) => {
              const active = deal.etapa === stage.id;
              const color = STAGE_COLORS[stage.color];
              return (
                <button
                  key={stage.id}
                  onClick={() => onStageChange(deal.id, stage.id)}
                  style={{
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: active ? 600 : 400,
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid ${active ? color : "#E1E0E0"}`,
                    backgroundColor: active ? color + "18" : "transparent",
                    color: active ? color : "#888",
                    cursor: "pointer",
                    transition: "all 0.1s",
                  }}
                >
                  {stage.emoji} {stage.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fields */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
          }}
        >
          <Section title="Información principal">
            <Field
              label="Nombre del seller"
              value={editing ? form.nombre : deal.nombre}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, nombre: v }))}
            />
            <Field
              label="Monto (CLP)"
              value={
                editing
                  ? String(form.monto || "")
                  : deal.monto
                  ? formatCLP(deal.monto)
                  : "—"
              }
              editing={editing}
              type="number"
              onChange={(v) => setForm((f) => ({ ...f, monto: Number(v) }))}
            />
            <SelectField
              label="Categoría"
              value={editing ? form.categoriasSeller || "" : deal.categoriasSeller || "—"}
              options={CATEGORIA_OPTIONS}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, categoriasSeller: v }))}
            />
            <SelectField
              label="Fuente de contacto"
              value={editing ? form.fuenteContacto || "" : deal.fuenteContacto || "—"}
              options={FUENTE_OPTIONS}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, fuenteContacto: v }))}
            />
            <SelectField
              label="Clasificación del lead"
              value={editing ? form.clasificacionLead || "" : deal.clasificacionLead || "—"}
              options={CLASIFICACION_OPTIONS}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, clasificacionLead: v }))}
            />
          </Section>

          <Section title="E-commerce">
            <SelectField
              label="Plataforma"
              value={editing ? form.ecommerce || "" : deal.ecommerce || "—"}
              options={ECOMMERCE_OPTIONS}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, ecommerce: v }))}
            />
            <Field
              label="Pedidos mensuales"
              value={editing ? String(form.pedidosMensuales || "") : String(deal.pedidosMensuales || "—")}
              editing={editing}
              type="number"
              onChange={(v) => setForm((f) => ({ ...f, pedidosMensuales: Number(v) }))}
            />
            <Field
              label="Ticket promedio (CLP)"
              value={editing ? String(form.ticketPromedio || "") : deal.ticketPromedio ? formatCLP(deal.ticketPromedio) : "—"}
              editing={editing}
              type="number"
              onChange={(v) => setForm((f) => ({ ...f, ticketPromedio: Number(v) }))}
            />
          </Section>

          <Section title="Comercial">
            <SelectField
              label="Tipo de plan"
              value={editing ? form.tipoPlan || "" : deal.tipoPlan || "—"}
              options={TIPO_PLAN_OPTIONS}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, tipoPlan: v }))}
            />
            <SelectField
              label="Modelo de cobro"
              value={editing ? form.modeloCobro || "" : deal.modeloCobro || "—"}
              options={MODELO_COBRO_OPTIONS}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, modeloCobro: v }))}
            />
            <SelectField
              label="Boost"
              value={editing ? form.boost || "" : deal.boost || "—"}
              options={BOOST_OPTIONS}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, boost: v }))}
            />
          </Section>

          <Section title="Perfil del cliente">
            <TextareaField
              label="Descripción"
              value={editing ? form.perfilCliente || "" : deal.perfilCliente || "—"}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, perfilCliente: v }))}
            />
            <TextareaField
              label="Resumen de la marca"
              value={editing ? form.resumenMarca || "" : deal.resumenMarca || "—"}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, resumenMarca: v }))}
            />
            <TextareaField
              label="Notas / excepciones"
              value={editing ? form.notasExcepciones || "" : deal.notasExcepciones || "—"}
              editing={editing}
              onChange={(v) => setForm((f) => ({ ...f, notasExcepciones: v }))}
            />
          </Section>

          {/* Activities */}
          {deal.actividades && deal.actividades.length > 0 && (
            <Section title="Actividades recientes">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {deal.actividades.slice(0, 8).map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid #F0F2F7",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#4548FF",
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "#1D1D1F" }}>
                        {act.titulo}
                      </p>
                      {act.descripcion && (
                        <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                          {act.descripcion}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>
                        {new Date(act.createdAt).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Save button */}
        {editing && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #E1E0E0",
              backgroundColor: "#FFFFFF",
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%",
                backgroundColor: "#4548FF",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "12px",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  fontFamily: "'Inter', sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #E1E0E0",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "'Inter', sans-serif",
  color: "#1D1D1F",
  outline: "none",
  backgroundColor: "#FAFAFA",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: "#121755",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
          paddingBottom: 6,
          borderBottom: "1px solid #F0F2F7",
        }}
      >
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label, value, editing, onChange, type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, marginTop: 4 }}
        />
      ) : (
        <p style={{ fontSize: 13, color: "#1D1D1F", marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label, value, options, editing, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {editing ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, marginTop: 4 }}
        >
          <option value="">— Seleccionar —</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <p style={{ fontSize: 13, color: "#1D1D1F", marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function TextareaField({
  label, value, editing, onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ ...inputStyle, marginTop: 4, resize: "vertical" }}
        />
      ) : (
        <p style={{ fontSize: 13, color: "#1D1D1F", marginTop: 4, fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}
