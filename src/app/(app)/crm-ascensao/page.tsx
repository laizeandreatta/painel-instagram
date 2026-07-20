"use client";

import { useLeads, RECURSO_ASCENSAO } from "@/lib/useLeads";
import { useAuth } from "@/lib/useAuth";
import { LeadKanbanBoard } from "@/components/LeadKanbanBoard";
import { NewLeadDialog } from "@/components/NewLeadDialog";
import { ENTREGA_STATUS_ORDER, LEAD_STATUS_LABELS } from "@/lib/types";

// CRM Programa Ascensão: diferente dos CRMs Assessoria/Consultoria (que
// acompanham a venda), este acompanha a ENTREGA do produto já vendido —
// da liberação de acesso até o fim do suporte pós-entrega. As vendas
// confirmadas na Hubla chegam aqui automaticamente via
// /api/hubla/webhook-ascensao, já na etapa "Acesso liberado".
export default function CrmAscensaoPage() {
  const { leads, loading, criarLead, atualizarStatus, excluirLead } =
    useLeads(RECURSO_ASCENSAO);
  const { profile } = useAuth();

  const total = leads.length;
  const concluidos = leads.filter((l) => l.status === "concluido").length;

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
            CRM Programa Ascensão
          </h1>
          <p className="text-sm text-ink/50">
            Acompanhamento da entrega do Programa Ascensão: da venda
            confirmada na Hubla até a conclusão do acompanhamento.
          </p>
        </div>

        <NewLeadDialog
          responsavelPadrao={profile?.nome ?? ""}
          onCreate={(dados) => criarLead({ ...dados, status: "acesso_liberado" })}
          statusOrder={ENTREGA_STATUS_ORDER}
          statusLabels={LEAD_STATUS_LABELS}
          statusPadrao="acesso_liberado"
        />
      </div>

      {!loading && total > 0 && (
        <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-line bg-white p-5">
          <div>
            <span className="font-editorial text-2xl font-semibold text-ink">
              {total}
            </span>
            <span className="ml-2 text-sm text-ink/50">
              {total === 1 ? "aluno no total" : "alunos no total"}
            </span>
          </div>
          <div className="h-8 w-px bg-line" />
          <div>
            <span className="font-editorial text-2xl font-semibold text-ink">
              {concluidos}
            </span>
            <span className="ml-2 text-sm text-ink/50">
              {concluidos === 1 ? "concluído" : "concluídos"}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink/50">Carregando leads...</p>
      ) : total === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink/40">
          Nenhum aluno cadastrado ainda. Assim que uma venda for confirmada
          na Hubla, o aluno vai aparecer aqui automaticamente — ou cadastre
          um manualmente com o botão &quot;Novo lead&quot;.
        </div>
      ) : (
        <LeadKanbanBoard
          leads={leads}
          onStatusChange={atualizarStatus}
          onExcluir={handleExcluir}
          statusOrder={ENTREGA_STATUS_ORDER}
          statusLabels={LEAD_STATUS_LABELS}
        />
      )}

      <p className="mt-4 text-xs text-ink/30">
        Etapas da entrega: {ENTREGA_STATUS_ORDER.map((s) => LEAD_STATUS_LABELS[s]).join(" → ")}
      </p>
    </div>
  );
}
