"use client";

const SHEETS_URL = "https://docs.google.com/spreadsheets/d/1hEl4SnRSKSdabKc4JG9JoQeeziEayb3zal2nnlbjhqw/edit?usp=sharing&rm=minimal";
const SHEETS_OPEN_URL = "https://docs.google.com/spreadsheets/d/1hEl4SnRSKSdabKc4JG9JoQeeziEayb3zal2nnlbjhqw/edit?gid=1716441601#gid=1716441601";

export default function MaquinasPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #E1E0E0", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: "#121755", textTransform: "uppercase", letterSpacing: "0.03em", margin: 0 }}>
            2026 · Máquinas de Ventas
          </h1>
          <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Google Sheets — editable directamente</p>
        </div>
        <a
          href={SHEETS_OPEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "7px 16px", borderRadius: 7, border: "1.5px solid #E1E0E0", backgroundColor: "#fff", color: "#555", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
        >
          ↗ Abrir en Google Sheets
        </a>
      </div>

      {/* Iframe */}
      <iframe
        src={SHEETS_URL}
        style={{ flex: 1, border: "none", width: "100%" }}
        allow="clipboard-write"
        title="Máquinas de Ventas 2026"
      />
    </div>
  );
}
