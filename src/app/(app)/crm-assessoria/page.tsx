"use client";

import { useState } from "react";
import { CalendarCheck2, Loader2 } from "lucide-react";
import { useLeads } from "@/lib/useLeads";
import { useAuth } from "@/lib/useAuth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { LeadKanbanBoard } from "@/components/LeadKanbanBoard";
import { NewLeadDialog } from "@/components/NewLeadDialog";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/types";

export default function CrmAssessoriaPage() {
  const { leads, loading, criarLead, atualizarStatus, excluirLead, recarregar } =
    useLeads();
  const { profile } = useAuth();
  const [verificando, setVerificando] = useState(false);

  const total = leads.length;
  const fechados = leads.filter((l) => l.status === "fechado").length;

  function handleExcluir(leadId: string) {
    const confirmado = window.confirm("Excluir este lead? Não pode ser desfeito.");
    if (!confirmado) return;
    excluirLead(leadId);
  }

  // Confere na hora, na agenda do Google, se alguém marcou a consultoria
  // pelo link de agendamento enviado no WhatsApp pós-venda (veja
  // /api/calendar/sync). Além desse botão manual, a mesma checagem roda
  // sozinha uma vez por dia (Vercel Cron).
  async function verificarAgendamentos() {
    if (!isSupabaseConfigured()) return;
    setVerificando(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resp = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        window.alert(
          `Não deu pra verificar agora: ${json.erro ?? "erro desconhecido"}. Confira se o Google Calendar já foi configurado (veja o README).`
        );
      } else if (json.leadsAtualizados > 0) {
        window.alert(
          `${json.leadsAtualizados} lead(s) marcados como "Consultoria agendada".`
        );
        recarregar();
      } else {
        window.alert("Nenhum agendamento novo encontrado por enquanto.");
      }
    } catch (e) {
      window.alert(`Não deu pra verificar agora: ${String(e)}`);
    } finally {
      setVerificando(false);
    }
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

        <div className="flex items-center gap-2">
          <button
            onClick={verificarAgendamentos}
            disabled={verificando}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-wine hover:text-wine disabled:opacity-50"
          >
            {verificando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CalendarCheck2 size={16} />
            )}
            Verificar agendamentos
          </button>

          <NewLeadDialog
            responsavelPadrao={profile?.nome ?? ""}
            onCreate={(dados) => criarLead(dados)}
          />
        </div>
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
