"use client";

import { useState } from "react";
import Link from "next/link";
import { AmplificaIsotipoSidebar } from "@/components/ui/amplifica-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
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
          {sent ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
                Revisa tu correo
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif", textAlign: "center", lineHeight: 1.5 }}>
                Si el correo existe, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link
                href="/login"
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "#4548FF",
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Volver al inicio de sesión
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", margin: 0 }}>
                Recuperar contraseña
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif", margin: 0, lineHeight: 1.5 }}>
                Ingresa tu correo @amplifica.io y te enviaremos un enlace de recuperación.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@amplifica.io"
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
                {loading ? "Enviando..." : "Enviar enlace"}
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
