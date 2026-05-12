"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";

type TopbarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  title?: string;
};

export function Topbar({ user, title }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        height: 60,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E1E0E0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {title && (
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "#121755",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h1>
      )}
      {!title && <div />}

      {/* User avatar */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 8,
          }}
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={32}
              height={32}
              style={{ borderRadius: "50%" }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#4548FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {getInitials(user.name || user.email || "U")}
            </div>
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#1D1D1F",
              fontFamily: "'Inter', sans-serif",
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name || user.email}
          </span>
          <ChevronDown />
        </button>

        {menuOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 20 }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E1E0E0",
                borderRadius: 12,
                padding: "8px 0",
                minWidth: 180,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                zIndex: 30,
              }}
            >
              <div
                style={{
                  padding: "8px 16px 12px",
                  borderBottom: "1px solid #E1E0E0",
                  marginBottom: 4,
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  {user.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#ef4444",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M3 5l4 4 4-4"
        stroke="#888"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
