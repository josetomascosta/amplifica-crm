"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./column";
import { DealCard } from "./deal-card";
import { DealPanel } from "./deal-panel";
import { PIPELINE_STAGES, STAGE_COLORS } from "@/lib/pipeline";
import type { Deal, Contacto, Actividad, User } from "@prisma/client";

export type DealWithRelations = Deal & {
  propietario: Pick<User, "id" | "name" | "image" | "email"> | null;
  contactos: Contacto[];
  actividades: Actividad[];
};

export type BoardFilters = {
  businessDeveloper: string;
  categoriasSeller: string;
  tipoPlan: string;
  clasificacionLead: string;
};

type BoardProps = {
  initialDeals: DealWithRelations[];
  filters?: BoardFilters;
};

export function KanbanBoard({ initialDeals, filters }: BoardProps) {
  const [deals, setDeals] = useState<DealWithRelations[]>(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const dealsByStage = useCallback(
    (stageId: string) => {
      return deals
        .filter((d) => d.etapa === stageId)
        .filter((d) => !filters?.businessDeveloper || d.businessDeveloper === filters.businessDeveloper)
        .filter((d) => !filters?.categoriasSeller || d.categoriasSeller === filters.categoriasSeller)
        .filter((d) => !filters?.tipoPlan || d.tipoPlan === filters.tipoPlan)
        .filter((d) => !filters?.clasificacionLead || d.clasificacionLead === filters.clasificacionLead);
    },
    [deals, filters]
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const activeDeal = deals.find((d) => d.id === active.id);
    if (!activeDeal) return;

    // Determine target stage
    let targetStage = over.id as string;
    const overDeal = deals.find((d) => d.id === over.id);
    if (overDeal) targetStage = overDeal.etapa;

    if (activeDeal.etapa === targetStage) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === activeDeal.id ? { ...d, etapa: targetStage } : d
      )
    );

    // Persist
    const res = await fetch(`/api/deals/${activeDeal.id}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa: targetStage }),
    });

    if (!res.ok) {
      // Rollback
      setDeals((prev) =>
        prev.map((d) =>
          d.id === activeDeal.id ? { ...d, etapa: activeDeal.etapa } : d
        )
      );
    }
  }

  function handleDealUpdate(updated: DealWithRelations) {
    setDeals((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
    setSelectedDeal(updated);
  }

  async function handleStageChange(dealId: string, etapa: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.etapa === etapa) return;

    // Optimistic
    const updated = { ...deal, etapa };
    setDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
    setSelectedDeal(updated as DealWithRelations);

    await fetch(`/api/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa }),
    });
  }

  function addDeal(deal: DealWithRelations) {
    setDeals((prev) => [deal, ...prev]);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 24px 24px",
            overflowX: "auto",
            minHeight: "calc(100vh - 120px)",
            alignItems: "flex-start",
          }}
        >
          {PIPELINE_STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage(stage.id)}
              onDealClick={setSelectedDeal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div style={{ opacity: 0.85, transform: "rotate(2deg)" }}>
              <DealCard
                deal={activeDeal}
                stageColor={
                  STAGE_COLORS[
                    PIPELINE_STAGES.find((s) => s.id === activeDeal.etapa)
                      ?.color || "blue"
                  ]
                }
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedDeal && (
        <DealPanel
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdate={handleDealUpdate}
          onStageChange={handleStageChange}
        />
      )}
    </>
  );
}
