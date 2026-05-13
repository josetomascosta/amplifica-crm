"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const ROLE_LABEL: Record<string, string> = {
  SALES: "Business Developer",
  SDR: "SDR",
  JEFATURA: "Jefe de Ventas",
  ADMIN: "Administrador",
  ONBOARDING: "Onboarding",
  MARKETING: "Marketing",
};

export default function PerfilPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;

  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPw !== confirm) { setError("Las contraseñas nuevas no coinciden"); return; }
    if (newPw.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setLoading(true);

    const res = await fetch("/api/perfil/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
    });

    if (res.ok) {
      setSuccess(true);
      setCurrent(""); setNewPw(""); setConfirm("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al cambiar contraseña");
    }
    setLoading(false);
  }

  const role = (session?.user as { role?: string })?.role ?? "SALES";

  return (
    <div style={{ padding: 32, maxWidth: 560 }}>
      <h1
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 28,
          textTransform: "uppercase",
          color: "#121755",
          margin: "0 0 8px",
          letterSpacing: "0.02em",
        }}
      >
        Mi Perfil
      </h1>
      <p style={{ fontSize: 14, color: "#666", fontFamily: "'Inter', sans-serif", margin: "0 0 32px" }}>
        Gestiona tu cuenta y contraseña
      </p>

      {/* User info card */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #E1E0E0",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#4548FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "'Barlow Condensed', sans-serif",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", fontFamily: "'Inter', sans-serif", margin: "0 0 2px" }}>
              {user?.name ?? "—"}
            </p>
            <p style={{ fontSize: 13, color: "#888", fontFamily: "'Inter', sans-serif", margin: "0 0 2px" }}>
              {user?.email ?? "—"}
            </p>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 600,
                color: "#4548FF",
                backgroundColor: "rgba(69,72,255,0.08)",
                borderRadius: 6,
                padding: "2px 8px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #E1E0E0",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, color: "#1D1D1F", margin: "0 0 20px" }}>
          Cambiar contraseña
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Contraseña actual", value: current, onChange: setCurrent },
            { label: "Nueva contraseña", value: newPw, onChange: setNewPw },
            { label: "Confirmar nueva contraseña", value: confirm, onChange: setConfirm },
          ].map(({ label, value, onChange }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#888",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {label}
              </label>
              <input
                type="password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #E1E0E0",
                  backgroundColor: "#fff",
                  color: "#1D1D1F",
                  fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                }}
              />
            </div>
          ))}

          {error && (
            <p style={{ fontSize: 13, color: "#e53935", fontFamily: "'Inter', sans-serif" }}>{error}</p>
          )}
          {success && (
            <p style={{ fontSize: 13, color: "#2e7d32", fontFamily: "'Inter', sans-serif" }}>
              Contraseña actualizada correctamente
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              alignSelf: "flex-start",
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: loading ? "#9999ff" : "#4548FF",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
