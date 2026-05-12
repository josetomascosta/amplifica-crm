"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "amplifica_maquinas_url";

export default function MaquinasPage() {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    setUrl(saved);
    setInput(saved);
    if (!saved) setEditing(true);
  }, []);

  function saveUrl() {
    localStorage.setItem(STORAGE_KEY, input.trim());
    setUrl(input.trim());
    setEditing(false);
  }

  function clearUrl() {
    localStorage.removeItem(STORAGE_KEY);
    setUrl("");
    setInput("");
    setEditing(true);
  }

  // Convert Google Sheets "edit" URL to embed URL
  function toEmbedUrl(raw: string) {
    if (!raw) return "";
    // Google Sheets: replace /edit with /edit?embedded=true
    if (raw.includes("docs.google.com/spreadsheets")) {
      const base = raw.split("?")[0].replace(/\/(edit|preview|copy)$/, "");
      return `${base}/edit?usp=sharing&rm=minimal`;
    }
    return raw;
  }

  const embedUrl = toEmbedUrl(url);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 0px)", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #E1E0E0",
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 24,
              color: "#121755",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            2026 · Máquinas de Ventas
          </h1>
          <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Google Sheets embebido — editable directamente
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {url && !editing && (
            <>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1.5px solid #E1E0E0",
                  backgroundColor: "#fff",
                  color: "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ↗ Abrir en Google Sheets
              </a>
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1.5px solid #E1E0E0",
                  backgroundColor: "#fff",
                  color: "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✎ Cambiar URL
              </button>
            </>
          )}
        </div>
      </div>

      {/* Setup / Edit URL */}
      {(editing || !url) && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F0F2F7",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              border: "1px solid #E1E0E0",
              padding: "40px 48px",
              maxWidth: 520,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <h2
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#121755",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                marginBottom: 8,
              }}
            >
              Configurar Máquinas de Ventas
            </h2>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.5 }}>
              Pega el enlace de Google Sheets del archivo{" "}
              <strong>2026 | Máquinas de Ventas</strong>. Asegúrate de que el archivo esté compartido con acceso de edición.
            </p>
            <input
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1.5px solid #E1E0E0",
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => e.key === "Enter" && input.trim() && saveUrl()}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={saveUrl}
                disabled={!input.trim()}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: input.trim() ? "#4548FF" : "#ccc",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: input.trim() ? "pointer" : "not-allowed",
                }}
              >
                Guardar y abrir
              </button>
              {url && (
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "1.5px solid #E1E0E0",
                    backgroundColor: "#fff",
                    color: "#555",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 16 }}>
              La URL se guarda en este navegador — no se sube al servidor.
            </p>
          </div>
        </div>
      )}

      {/* Iframe */}
      {!editing && url && (
        <iframe
          src={embedUrl}
          style={{ flex: 1, border: "none", width: "100%" }}
          allow="clipboard-write"
          title="Máquinas de Ventas 2026"
        />
      )}
    </div>
  );
}
