"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  activo: boolean;
  createdAt: string;
};

const ROLES = ["SALES", "ONBOARDING", "MARKETING", "JEFATURA", "ADMIN"];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#4548FF",
  JEFATURA: "#121755",
  SALES: "#16a34a",
  ONBOARDING: "#d97706",
  MARKETING: "#7c3aed",
};

export default function UsuariosPage() {
  const { data: users, mutate } = useSWR<User[]>("/api/admin/users", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "SALES", password: "", activo: true });

  function openNew() {
    setForm({ email: "", name: "", role: "SALES", password: "", activo: true });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(u: User) {
    setForm({ email: u.email, name: u.name ?? "", role: u.role, password: "", activo: u.activo });
    setEditingId(u.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        const body: Record<string, unknown> = { name: form.name, role: form.role, activo: form.activo };
        if (form.password) body.password = form.password;
        await fetch(`/api/admin/users/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      await mutate();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(u: User) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    mutate();
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", color: "#121755" }}>
            Gestión de Usuarios
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#666" }}>{users?.length ?? 0} usuarios registrados</p>
        </div>
        <button
          onClick={openNew}
          style={{ backgroundColor: "#4548FF", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 32, width: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#121755" }}>
              {editingId ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!editingId && (
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Email (@amplifica.io)</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="nombre@amplifica.io"
                    style={{ border: "1px solid #E1E0E0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'Inter', sans-serif" }}
                  />
                </label>
              )}

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Nombre completo</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre Apellido"
                  style={{ border: "1px solid #E1E0E0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'Inter', sans-serif" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Rol</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={{ border: "1px solid #E1E0E0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'Inter', sans-serif", backgroundColor: "#FFF" }}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>
                  Contraseña {editingId && <span style={{ fontWeight: 400, color: "#999" }}>(dejar vacío para no cambiar)</span>}
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
                  style={{ border: "1px solid #E1E0E0", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'Inter', sans-serif" }}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: "#4548FF" }}
                />
                <span style={{ fontSize: 14, color: "#444" }}>Usuario activo</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: "none", border: "1px solid #E1E0E0", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer", color: "#666" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: "#4548FF", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div style={{ backgroundColor: "#FFF", borderRadius: 12, border: "1px solid #E1E0E0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E1E0E0" }}>
              {["Usuario", "Email", "Rol", "Estado", "Creado", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!users && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 14 }}>Cargando...</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #F0F2F7" }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      backgroundColor: ROLE_COLORS[u.role] ?? "#4548FF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#FFF", fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>
                      {(u.name ?? u.email).charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F" }}>{u.name ?? "—"}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 14, color: "#555" }}>{u.email}</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 20,
                    backgroundColor: `${ROLE_COLORS[u.role] ?? "#4548FF"}18`,
                    color: ROLE_COLORS[u.role] ?? "#4548FF",
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 20,
                    backgroundColor: u.activo ? "#16a34a18" : "#dc262618",
                    color: u.activo ? "#16a34a" : "#dc2626",
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#888" }}>
                  {new Date(u.createdAt).toLocaleDateString("es-CL")}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEdit(u)}
                      style={{ background: "none", border: "1px solid #E1E0E0", borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer", color: "#444" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(u)}
                      style={{
                        background: "none",
                        border: `1px solid ${u.activo ? "#dc262640" : "#16a34a40"}`,
                        borderRadius: 6, padding: "5px 12px", fontSize: 13, cursor: "pointer",
                        color: u.activo ? "#dc2626" : "#16a34a",
                      }}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password hint */}
      <p style={{ marginTop: 16, fontSize: 13, color: "#888", textAlign: "center" }}>
        Contraseña por defecto para nuevos usuarios sin contraseña asignada: <strong>amplifica2024</strong>
      </p>
    </div>
  );
}
