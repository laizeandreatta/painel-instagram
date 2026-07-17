"use client";

import { useLeads } from "@/lib/useLeads";
import { useAuth } from "@/lib/useAuth";
import { LeadKanbanBoard } from "@/components/LeadKanbanBoard";
import { NewLeadDialog } from "@/components/NewLeadDialog";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/types";

export default function CrmAssessoriaPage() {
  const { leads, loading, criarLead, atualizarStatus, excluirLead } = useLeads();
  const { profile } = useAuth();

  const total = leads.length;
  const fechados = leads.filter((l) => l.status === "fechado").length;

  function handleExcluir(leadId: string) {
    const confirmado = window.confirm("Excluir este lead? Não pode ser desfeito.");
    if (!confirmado) return;
    excluirLead(leadId);
  }

  return (
    <div className="px-6 py-7 md:px-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl font-semibold text-ink md:text-3xl">
            CRM Assessoria
          </h1>
          <p className="text-sm text-ink/50">
            Leads da assessoria Valore: do clique no WhatsApp da bio até a
            reunião com a Laize.
          </p>
        </div>

        <NewLeadDialog
          responsavelPadrao={profile?.nome ?? ""}
          onCreate={(dados) => criarLead(dados)}
        />
      </div>

      {!loading && total > 0 && (
        <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-line bg-white p-5">
          <div>
            <span className="font-editorial text-2xl font-semibold text-ink">
              {total}
            </span>
            <span className="ml-2 text-sm text-ink/50">
              {total === 1 ? "lead no total" : "leads no total"}
            </span>
          </div>
          <div className="h-8 w-px bg-line" />
          <div>
            <span className="font-editorial text-2xl font-semibold text-ink">
              {fechados}
            </span>
            <span className="ml-2 text-sm text-ink/50">
              {fechados === 1 ? "fechado" : "fechados"}
            </span>
          </div>
          <div className="h-8 w-px bg-line" />
          <div>
            <span className="font-editorial text-2xl font-semibold text-ink">
              {total > 0 ? ((fechados / total) * 100).toFixed(0) : 0}%
            </span>
            <span className="ml-2 text-sm text-ink/50">conversão</span>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink/50">Carregando leads...</p>
      ) : total === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink/40">
          Nenhum lead cadastrado ainda. Assim que a integração com o
          WhatsApp estiver ativa, os leads vão aparecer aqui automaticamente
          — ou cadastre um manualmente com o botão &quot;Novo lead&quot;.
        </div>
      ) : (
        <LeadKanbanBoard
          leads={leads}
          onStatusChange={atualizarStatus}
          onExcluir={handleExcluir}
        />
      )}

      <p className="mt-4 text-xs text-ink/30">
        Etapas do funil: {LEAD_STATUS_ORDER.map((s) => LEAD_STATUS_LABELS[s]).join(" → ")}
      </p>
    </div>
  );
}
