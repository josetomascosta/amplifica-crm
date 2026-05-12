"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AmplificaIsotipoSidebar } from "@/components/ui/amplifica-logo";

type IconProps = { size: number; active: boolean };
type NavItem = { href: string; label: string; icon: React.ComponentType<IconProps>; roles?: string[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/pipeline", label: "Pipeline", icon: IconPipeline, roles: ["SALES", "ADMIN", "JEFATURA"] },
  { href: "/marcas", label: "Marcas", icon: IconMarcas, roles: ["SALES", "ADMIN", "JEFATURA", "ONBOARDING"] },
  { href: "/importar", label: "Importar", icon: IconImportar, roles: ["SALES", "ADMIN"] },
  { href: "/reportes", label: "Reportes", icon: IconReportes, roles: ["SALES", "ADMIN", "JEFATURA", "MARKETING"] },
  { href: "/maquinas", label: "Máquinas 2026", icon: IconMaquinas, roles: ["SALES", "ADMIN", "JEFATURA"] },
  { href: "/looker", label: "Seguimiento", icon: IconLooker, roles: ["SALES", "ADMIN", "JEFATURA", "MARKETING"] },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/okr", label: "OKR", icon: IconOKR },
  { href: "/admin/metas", label: "Metas", icon: IconMetas },
  { href: "/admin/usuarios", label: "Usuarios", icon: IconUsuarios },
];

function NavLink({ href, label, Icon, active, small }: { href: string; label: string; Icon: React.ComponentType<IconProps>; active: boolean; small?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: small ? "8px 12px" : "10px 12px",
        borderRadius: 8, textDecoration: "none",
        color: active ? "#FFFFFF" : small ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.55)",
        backgroundColor: active ? "rgba(69,72,255,0.25)" : "transparent",
        fontFamily: "'Inter', sans-serif",
        fontSize: small ? 13 : 14,
        fontWeight: active ? 600 : 400,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = small ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.55)"; } }}
    >
      <Icon size={small ? 16 : 18} active={active} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "SALES";
  const isAdmin = role === "ADMIN";

  const visibleItems = NAV_ITEMS.filter(({ roles }) => !roles || roles.includes(role));

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        backgroundColor: "#121755",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 8px 24px" }}>
        <AmplificaIsotipoSidebar size={38} />
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {visibleItems.map(({ href, label, icon: Icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            Icon={Icon}
            active={pathname === href || pathname.startsWith(href + "/")}
          />
        ))}
      </nav>

      {/* Admin section — only for ADMIN role */}
      {isAdmin && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 12px 6px", fontFamily: "'Inter', sans-serif" }}>
            Admin
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {ADMIN_ITEMS.map(({ href, label, icon: Icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                Icon={Icon}
                active={pathname === href || pathname.startsWith(href + "/")}
                small
              />
            ))}
          </nav>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 0, height: 8 }} />

      {/* Version */}
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "0 12px", fontFamily: "'Inter', sans-serif" }}>
        CRM v1.0 MVP
      </p>
    </aside>
  );
}

// Icons

function IconDashboard({ size, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill={active ? "#4548FF" : "currentColor"} />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity={active ? 1 : 0.7} />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity={active ? 1 : 0.7} />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity={active ? 1 : 0.5} />
    </svg>
  );
}

function IconPipeline({ size, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="4" height="14" rx="2" fill="currentColor" />
      <rect x="8" y="6" width="4" height="11" rx="2" fill="currentColor" opacity={active ? 1 : 0.7} />
      <rect x="14" y="9" width="4" height="8" rx="2" fill="currentColor" opacity={active ? 1 : 0.5} />
    </svg>
  );
}

function IconMarcas({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 18c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconImportar({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconReportes({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 14l4-5 4 3 4-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconMaquinas({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="7" x2="7" y2="18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconLooker({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10 L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 10 L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconOKR({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function IconMetas({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 17 L3 8 L7 8 L7 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 17 L8.5 5 L12.5 5 L12.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 17 L14 10 L18 10 L18 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsuarios({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 17c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 9a3 3 0 0 0 0-6M17 17c0-2.761-1.343-5-4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
