"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AmplificaIsotipoSidebar } from "@/components/ui/amplifica-logo";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al restablecer contraseña");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#121755",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <AmplificaIsotipoSidebar size={52} />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 11,
              color: "#aaaaaa",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            CRM Comercial
          </span>
        </div>

        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "32px 40px",
            width: 340,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {done ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
                ¡Contraseña actualizada!
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
                Redirigiendo al inicio de sesión…
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", margin: 0 }}>
                Nueva contraseña
              </p>

              {[
                { label: "Nueva contraseña", value: password, onChange: setPassword },
                { label: "Confirmar contraseña", value: confirm, onChange: setConfirm },
              ].map(({ label, value, onChange }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
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
                      border: "1.5px solid rgba(255,255,255,0.15)",
                      backgroundColor: "rgba(255,255,255,0.07)",
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontFamily: "'Inter', sans-serif",
                      outline: "none",
                    }}
                  />
                </div>
              ))}

              {error && (
                <p style={{ fontSize: 13, color: "#ff6b6b", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: loading ? "#6668cc" : "#4548FF",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>

              <Link
                href="/login"
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: "none",
                }}
              >
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
