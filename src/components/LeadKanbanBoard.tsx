"use client";

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, Lead, LeadStatus } from "@/lib/types";
import { LeadCard } from "./LeadCard";

function DraggableCard({
    lead,
    onExcluir,
}: {
    lead: Lead;
    onExcluir?: (leadId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
          useDraggable({ id: lead.id });

  const style = transform
      ? {
                transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
                opacity: isDragging ? 0.4 : 1,
      }
        : undefined;

  return (
        <div ref={setNodeRef} style={style}>
                <div {...listeners} {...attributes}>
                        <LeadCard lead={lead} onExcluir={onExcluir} />
                </div>
        </div>
      );
}

function Column({
    status,
    labels,
    leads,
    onExcluir,
}: {
    status: LeadStatus;
    labels: Record<LeadStatus, string>;
    leads: Lead[];
    onExcluir?: (leadId: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
  
    return (
          <div
                  ref={setNodeRef}
                  className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
                            isOver ? "border-wine bg-baby-pink-light" : "border-line bg-off-white"
                  }`}
                >
                <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="text-sm font-semibold text-ink">
                          {labels[status]}
                        </h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-ink/50 border border-line">
                          {leads.length}
                        </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 kanban-scroll overflow-y-auto pb-2">
                  {leads.map((lead) => (
                            <DraggableCard key={lead.id} lead={lead} onExcluir={onExcluir} />
                          ))}
                  {leads.length === 0 && (
                            <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-ink/35">
                                        Nenhum lead
                            </p>
                        )}
                </div>
          </div>
        );
}

// O board é usado pelos três CRMs (Assessoria, Consultoria e Programa
// Ascensão) — por padrão mostra o funil de vendas (LEAD_STATUS_ORDER),
// mas o CRM Ascensão passa suas próprias etapas de entrega via
// `statusOrder`/`statusLabels` (veja lib/types.ts: ENTREGA_STATUS_ORDER).
export function LeadKanbanBoard({
    leads,
    onStatusChange,
    onExcluir,
    statusOrder = LEAD_STATUS_ORDER,
    statusLabels = LEAD_STATUS_LABELS,
}: {
    leads: Lead[];
    onStatusChange: (leadId: string, status: LeadStatus) => void;
    onExcluir?: (leadId: string) => void;
    statusOrder?: LeadStatus[];
    statusLabels?: Record<LeadStatus, string>;
}) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
          useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
        );
  
    function handleDragStart(event: DragStartEvent) {
          setActiveId(String(event.active.id));
    }
  
    function handleDragEnd(event: DragEndEvent) {
          setActiveId(null);
          const { active, over } = event;
          if (!over) return;
          const novoStatus = over.id as LeadStatus;
          if (statusOrder.includes(novoStatus)) {
                  onStatusChange(String(active.id), novoStatus);
          }
    }
  
    const activeLead = leads.find((l) => l.id === activeId);
  
    return (
          <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {statusOrder.map((status) => (
                            <Column
                                          key={status}
                                          status={status}
                                          labels={statusLabels}
                                          leads={leads.filter((l) => l.status === status)}
                                          onExcluir={onExcluir}
                                        />
                          ))}
                </div>
                  <DragOverlay>
                    {activeLead ? (
                            <div className="w-72 rotate-2 opacity-95">
                                        <LeadCard lead={activeLead} />
                            </div>
                          ) : null}
                  </DragOverlay>
          </DndContext>
        );
}
</div>
