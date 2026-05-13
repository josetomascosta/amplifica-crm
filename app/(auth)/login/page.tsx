"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AmplificaIsotipoSidebar } from "@/components/ui/amplifica-logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Email o contraseña incorrectos");
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
        {/* Logo — según brand manual: isotipo + wordmark + leyenda */}
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

        {/* Card */}
        <form
          onSubmit={handleSubmit}
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

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
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

          {error && (
            <p style={{ fontSize: 13, color: "#ff6b6b", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: loading ? "#6668cc" : "#4548FF",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <Link
            href="/forgot-password"
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "'Inter', sans-serif",
              textDecoration: "none",
            }}
          >
            Olvidé mi contraseña
          </Link>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
            Acceso exclusivo equipo @amplifica.io
          </p>
        </form>
      </div>
    </div>
  );
}
