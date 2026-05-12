"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatCLP, getInitials, daysSince } from "@/lib/utils";
import type { DealWithRelations } from "./board";

type DealCardProps = {
  deal: DealWithRelations;
  stageColor: string;
  onClick: () => void;
};

export function DealCard({ deal, stageColor, onClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const daysInStage = daysSince(deal.updatedAt);
  const isStale = daysInStage >= 7;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: "#FFFFFF",
        border: `1px solid ${isStale ? "rgba(239,68,68,0.3)" : "#E1E0E0"}`,
        borderRadius: 12,
        padding: 12,
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: isDragging
          ? "0 8px 24px rgba(0,0,0,0.12)"
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header: drag handle + avatar + nombre */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Drag handle — separado del onClick */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{
            cursor: "grab",
            color: "#ccc",
            flexShrink: 0,
            paddingTop: 2,
            display: "flex",
            alignItems: "center",
          }}
          title="Arrastrar"
        >
          <DragIcon />
        </div>

        {/* Avatar iniciales */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: stageColor + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: stageColor,
          }}
        >
          {getInitials(deal.nombre)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: "#1D1D1F",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {deal.nombre}
          </p>
          {deal.ecommerce && (
            <p style={{ fontSize: 11, color: "#888", fontFamily: "'Inter', sans-serif", marginTop: 1 }}>
              {deal.ecommerce}
            </p>
          )}
        </div>
      </div>

      {/* Monto */}
      {deal.monto ? (
        <p
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: "#121755",
            letterSpacing: "0.02em",
          }}
        >
          {formatCLP(deal.monto)}
        </p>
      ) : null}

      {/* Footer: badges + propietario + días */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {deal.categoriasSeller && (
            <Badge label={deal.categoriasSeller} color={stageColor} />
          )}
          {deal.clasificacionLead && (
            <Badge
              label={deal.clasificacionLead}
              color={
                deal.clasificacionLead === "Bueno" ? "#22c55e"
                : deal.clasificacionLead === "Malo" ? "#ef4444"
                : "#f97316"
              }
            />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {deal.propietario && (
            <div
              title={deal.propietario.name || deal.propietario.email || ""}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "#4548FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {deal.propietario.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={deal.propietario.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                getInitials(deal.propietario.name || deal.propietario.email || "U")
              )}
            </div>
          )}
          <span
            style={{
              fontSize: 10,
              color: isStale ? "#ef4444" : "#aaa",
              fontFamily: "'Inter', sans-serif",
              fontWeight: isStale ? 600 : 400,
            }}
          >
            {daysInStage}d
          </span>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        color: color,
        backgroundColor: color + "18",
        borderRadius: 4,
        padding: "2px 6px",
      }}
    >
      {label}
    </span>
  );
}

function DragIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
      <circle cx="3" cy="3" r="1.5" fill="currentColor" />
      <circle cx="9" cy="3" r="1.5" fill="currentColor" />
      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
      <circle cx="9" cy="8" r="1.5" fill="currentColor" />
      <circle cx="3" cy="13" r="1.5" fill="currentColor" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}
