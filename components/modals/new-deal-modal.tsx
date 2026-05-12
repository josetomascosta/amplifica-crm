"use client";

import { useState } from "react";
import {
  CATEGORIA_OPTIONS,
  FUENTE_OPTIONS,
  CLASIFICACION_OPTIONS,
  ECOMMERCE_OPTIONS,
} from "@/lib/pipeline";
import type { DealWithRelations } from "@/components/kanban/board";

type NewDealModalProps = {
  onClose: () => void;
  onCreated: (deal: DealWithRelations) => void;
};

export function NewDealModal({ onClose, onCreated }: NewDealModalProps) {
  const [form, setForm] = useState({
    nombre: "",
    categoriasSeller: "",
    fuenteContacto: "",
    clasificacionLead: "",
    monto: "",
    pedidosMensuales: "",
    ecommerce: "",
    perfilCliente: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre del seller es obligatorio");
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monto: form.monto ? Number(form.monto) : null,
        pedidosMensuales: form.pedidosMensuales ? Number(form.pedidosMensuales) : null,
      }),
    });

    if (res.ok) {
      const deal = await res.json();
      onCreated(deal);
      onClose();
    } else {
      setError("Error al crear el deal. Intenta de nuevo.");
    }
    setSaving(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          width: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E1E0E0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: "#121755",
              textTransform: "uppercase",
            }}
          >
            Nuevo Deal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#888",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <FormField label="Nombre del seller *">
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej: Tienda XYZ"
                style={inputStyle}
                autoFocus
              />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Categoría">
                <select
                  value={form.categoriasSeller}
                  onChange={(e) => set("categoriasSeller", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Seleccionar —</option>
                  {CATEGORIA_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fuente de contacto">
                <select
                  value={form.fuenteContacto}
                  onChange={(e) => set("fuenteContacto", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Seleccionar —</option>
                  {FUENTE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Clasificación del lead">
                <select
                  value={form.clasificacionLead}
                  onChange={(e) => set("clasificacionLead", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Seleccionar —</option>
                  {CLASIFICACION_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Plataforma e-commerce">
                <select
                  value={form.ecommerce}
                  onChange={(e) => set("ecommerce", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Seleccionar —</option>
                  {ECOMMERCE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Monto (CLP)">
                <input
                  type="number"
                  value={form.monto}
                  onChange={(e) => set("monto", e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Pedidos mensuales">
                <input
                  type="number"
                  value={form.pedidosMensuales}
                  onChange={(e) => set("pedidosMensuales", e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="Perfil del cliente">
              <textarea
                value={form.perfilCliente}
                onChange={(e) => set("perfilCliente", e.target.value)}
                placeholder="Descripción breve del cliente..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </FormField>

            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: "#ef4444",
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(239,68,68,0.08)",
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #E1E0E0",
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1.5px solid #E1E0E0",
                background: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#888",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: saving ? "#9ea0ff" : "#4548FF",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "background-color 0.15s",
              }}
            >
              {saving ? "Creando..." : "Crear Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: "#888",
          fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #E1E0E0",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "'Inter', sans-serif",
  color: "#1D1D1F",
  outline: "none",
  backgroundColor: "#FAFAFA",
  transition: "border-color 0.15s",
};
