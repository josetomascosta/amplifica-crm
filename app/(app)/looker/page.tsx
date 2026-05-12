"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "amplifica_looker_url";

export default function LookerPage() {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    setUrl(saved);
    setInput(saved);
    if (!saved) setEditing(true);
  }, []);

  function saveUrl() {
    const trimmed = input.trim();
    localStorage.setItem(STORAGE_KEY, trimmed);
    setUrl(trimmed);
    setEditing(false);
  }

  function toEmbedUrl(raw: string) {
    if (!raw) return "";
    if (raw.includes("datastudio.google.com")) {
      raw = raw.replace("datastudio.google.com", "lookerstudio.google.com");
    }
    if (raw.includes("lookerstudio.google.com") && !raw.includes("/embed/")) {
      raw = raw.replace("/reporting/", "/embed/reporting/");
    }
    return raw;
  }

  const embedUrl = toEmbedUrl(url);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #E1E0E0", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Seguimiento de Pedidos
          </h1>
          <p style={{ fontSize: 12, color: "#888", marginTop: 1 }}>Looker Studio — métricas y metas Amplifica</p>
        </div>
        {url && !editing && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowInstructions((v) => !v)}
              style={{ padding: "7px 12px", borderRadius: 7, border: "1.5px solid #f97316", backgroundColor: "rgba(249,115,22,0.07)", color: "#f97316", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {showInstructions ? "Ocultar ayuda" : "⚠️ ¿No carga?"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "8px 18px", borderRadius: 7, border: "none", backgroundColor: "#4548FF", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              ↗ Abrir en Looker Studio
            </a>
            <button
              onClick={() => setEditing(true)}
              style={{ padding: "7px 12px", borderRadius: 7, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              ✎ URL
            </button>
          </div>
        )}
      </div>

      {/* Instructions panel */}
      {showInstructions && url && !editing && (
        <div style={{ backgroundColor: "#fff8f0", borderBottom: "1px solid #fed7aa", padding: "14px 24px", flexShrink: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#c2410c", marginBottom: 8 }}>
            ⚠️ Looker Studio bloquea iframes por defecto. Para activar el embed:
          </p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {[
              'Abre el reporte en Looker Studio (botón azul arriba)',
              'Clic en "Compartir" → "Incrustar informe"',
              'Activa "Habilitar la incorporación"',
              'Copia la URL del campo "URL del informe" (NO el código iframe completo)',
              'Vuelve aquí y actualiza la URL con ✎ URL',
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 12, color: "#7c2d12", marginBottom: 3, lineHeight: 1.5 }}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Setup / Edit */}
      {(editing || !url) && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F0F2F7" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #E1E0E0", padding: "36px 44px", maxWidth: 540, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
              Configurar Looker Studio
            </h2>
            <div style={{ backgroundColor: "#F0F2F7", borderRadius: 10, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Para que el embed funcione:</p>
              <ol style={{ paddingLeft: 16, margin: 0 }}>
                {[
                  'En Looker Studio, clic en "Compartir" → "Incrustar informe"',
                  'Activa "Habilitar la incorporación"',
                  'Copia la URL del campo "URL del informe"',
                  'Pégala aquí abajo',
                ].map((s, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#555", marginBottom: 3, lineHeight: 1.5 }}>{s}</li>
                ))}
              </ol>
            </div>
            <input
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://lookerstudio.google.com/reporting/..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #E1E0E0", fontSize: 13, fontFamily: "'Inter', sans-serif", marginBottom: 12, outline: "none", boxSizing: "border-box" }}
              onKeyDown={(e) => e.key === "Enter" && input.trim() && saveUrl()}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={saveUrl}
                disabled={!input.trim()}
                style={{ padding: "10px 24px", borderRadius: 8, border: "none", backgroundColor: input.trim() ? "#4548FF" : "#ccc", color: "#fff", fontSize: 14, fontWeight: 600, cursor: input.trim() ? "pointer" : "not-allowed" }}
              >
                Guardar y abrir
              </button>
              {url && (
                <button
                  onClick={() => setEditing(false)}
                  style={{ padding: "10px 24px", borderRadius: 8, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", color: "#555", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancelar
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 14 }}>
              Si el embed sigue sin funcionar, usa el botón "Abrir en Looker Studio" que aparece en el header.
            </p>
          </div>
        </div>
      )}

      {/* Iframe */}
      {!editing && url && (
        <iframe
          src={embedUrl}
          style={{ flex: 1, border: "none", width: "100%" }}
          allowFullScreen
          title="Looker Studio — Seguimiento Amplifica"
        />
      )}
    </div>
  );
}
