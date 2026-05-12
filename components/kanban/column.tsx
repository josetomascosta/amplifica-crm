"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DealCard } from "./deal-card";
import { formatCLP } from "@/lib/utils";
import { STAGE_COLORS } from "@/lib/pipeline";
import type { DealWithRelations } from "./board";
import type { PipelineStage } from "@/lib/pipeline";

type ColumnProps = {
  stage: PipelineStage;
  deals: DealWithRelations[];
  onDealClick: (deal: DealWithRelations) => void;
};

export function KanbanColumn({ stage, deals, onDealClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const stageColor = STAGE_COLORS[stage.color];
  const totalValue = deals.reduce((sum, d) => sum + (d.monto || 0), 0);

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Column header */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E1E0E0",
          borderRadius: 12,
          padding: "10px 12px",
          borderTop: `3px solid ${stageColor}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {stage.emoji && (
              <span style={{ fontSize: 14 }}>{stage.emoji}</span>
            )}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 12,
                color: "#1D1D1F",
              }}
            >
              {stage.label}
            </span>
          </div>
          <span
            style={{
              backgroundColor: stageColor + "18",
              color: stageColor,
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: "#888",
              marginTop: 4,
            }}
          >
            {formatCLP(totalValue)}
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: 80,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderRadius: 12,
          padding: 4,
          backgroundColor: isOver ? stageColor + "0A" : "transparent",
          transition: "background-color 0.15s",
        }}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              stageColor={stageColor}
              onClick={() => onDealClick(deal)}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div
            style={{
              height: 60,
              border: `2px dashed ${stageColor}30`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#ccc",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Sin deals
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
