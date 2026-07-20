"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { MOCK_LEADS_ASSESSORIA, MOCK_LEADS_CONSULTORIA } from "./mockData";
import { Lead, LeadStatus } from "./types";

/**
 * Hook central de dados dos CRMs de leads. É usado tanto pelo CRM
 * Assessoria quanto pelo CRM Consultoria — são serviços diferentes, cada
 * um com sua própria tabela no Supabase, mas com o mesmo funil/formato de
 * card, então o hook recebe qual "recurso" (tabelas + dados de demo) usar.
 *
 * Em "modo demo" os dados vivem em memória; assim que o Supabase estiver
 * configurado, lê e grava na tabela indicada em `recurso` (compartilhada
 * com toda a equipe). Os leads também podem chegar automaticamente por
 * rotas de webhook (veja /api/whatsapp/webhook e /api/hubla/webhook), que
 * usam a service role key para gravar direto no banco.
 */
export type RecursoLeads = {
  tabelaLeads: string;
  tabelaMensagens: string;
  mockLeads: Lead[];
};

export const RECURSO_ASSESSORIA: RecursoLeads = {
  tabelaLeads: "leads_assessoria",
  tabelaMensagens: "lead_mensagens_assessoria",
  mockLeads: MOCK_LEADS_ASSESSORIA,
};

export const RECURSO_CONSULTORIA: RecursoLeads = {
  tabelaLeads: "leads_valore",
  tabelaMensagens: "lead_mensagens",
  mockLeads: MOCK_LEADS_CONSULTORIA,
};

export const RECURSO_ASCENSAO: RecursoLeads = {
    tabelaLeads: "leads_ascensao",
    tabelaMensagens: "lead_mensagens_ascensao",
    mockLeads: [],
};

export function useLeads(recurso: RecursoLeads) {
  const { tabelaLeads, tabelaMensagens, mockLeads } = recurso;
  const [leads, setLeads] = useState<Lead[]>(
    isSupabaseConfigured() ? [] : mockLeads
  );
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const demoMode = !isSupabaseConfigured();

  const carregar = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: leadsData } = await supabase
      .from(tabelaLeads)
      .select("*")
      .order("atualizado_em", { ascending: false });

    const { data: mensagensData } = await supabase
      .from(tabelaMensagens)
      .select("*")
      .order("criado_em", { ascending: true });

    const leads: Lead[] = (leadsData ?? []).map((l) => ({
      ...l,
      mensagens: (mensagensData ?? []).filter((m) => m.lead_id === l.id),
    }));

    setLeads(leads);
    setLoading(false);
  }, [tabelaLeads, tabelaMensagens]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criarLead = useCallback(
    async (novo: Partial<Lead>) => {
      const id = `l-${Date.now()}`;
      const agora = new Date().toISOString();
      const lead: Lead = {
        id,
        nome: novo.nome ?? "Sem nome",
        telefone: novo.telefone ?? "",
        origem: novo.origem ?? "manual",
        status: novo.status ?? "novo",
        notas: novo.notas ?? "",
        responsavel_nome: novo.responsavel_nome ?? null,
        valor_proposta: novo.valor_proposta ?? null,
        ultima_mensagem: null,
        ultima_mensagem_em: null,
        mensagens: [],
        criado_em: agora,
        atualizado_em: agora,
      };
      setLeads((prev) => [lead, ...prev]);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from(tabelaLeads).insert({
          id,
          nome: lead.nome,
          telefone: lead.telefone,
          origem: lead.origem,
          status: lead.status,
          notas: lead.notas,
          responsavel_nome: lead.responsavel_nome,
          valor_proposta: lead.valor_proposta,
        });
      }
      return lead;
    },
    [tabelaLeads]
  );

  const atualizarStatus = useCallback(
    async (leadId: string, status: LeadStatus) => {
      const agora = new Date().toISOString();
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status, atualizado_em: agora } : l))
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from(tabelaLeads)
          .update({ status, atualizado_em: agora })
          .eq("id", leadId);
      }
    },
    [tabelaLeads]
  );

  // Atualização genérica de campos (nome, telefone, notas, responsável,
  // valor da proposta) — usada pelos campos editáveis do card/detalhe.
  const atualizarCampos = useCallback(
    async (leadId: string, patch: Partial<Lead>) => {
      const agora = new Date().toISOString();
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, ...patch, atualizado_em: agora } : l))
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from(tabelaLeads)
          .update({ ...patch, atualizado_em: agora })
          .eq("id", leadId);
      }
    },
    [tabelaLeads]
  );

  const excluirLead = useCallback(
    async (leadId: string) => {
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from(tabelaLeads).delete().eq("id", leadId);
      }
    },
    [tabelaLeads]
  );

  return {
    leads,
    loading,
    demoMode,
    criarLead,
    atualizarStatus,
    atualizarCampos,
    excluirLead,
    recarregar: carregar,
  };
}
