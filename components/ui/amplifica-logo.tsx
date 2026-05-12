"use client";

// Isotipo versión oscura (login, fondos claros) — logo negro/color sobre fondo claro
export function AmplificaIsotipo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/logo-header.png"
      alt="Amplifica"
      width={size * 3.5}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

// Isotipo versión clara (sidebar, fondos oscuros #121755) — logo blanco sobre fondo oscuro
export function AmplificaIsotipoSidebar({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/logo-footer.png"
      alt="Amplifica"
      width={size * 3.5}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

// Wordmark: "amplifica" en Barlow Condensed — solo cuando se necesita sin el isotipo
export function AmplificaWordmark({
  size = 22,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: "'Barlow Condensed', Arial Narrow, sans-serif",
        fontSize: size,
        fontWeight: 700,
        color,
        letterSpacing: "-0.3px",
        lineHeight: 1,
      }}
    >
      amplifica
    </span>
  );
}
