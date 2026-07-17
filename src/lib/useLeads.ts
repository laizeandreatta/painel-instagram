"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { MOCK_LEADS } from "./mockData";
import { Lead, LeadStatus } from "./types";

/**
 * Hook central de dados do CRM Assessoria (leads da Valore).
 *
 * Segue o mesmo padrão do usePosts: em "modo demo" os dados vivem em
 * memória; assim que o Supabase estiver configurado, lê e grava na tabela
 * leads_valore (compartilhada com toda a equipe). Os leads também podem
 * chegar automaticamente pela rota /api/whatsapp/webhook, que usa a
 * service role key para gravar direto no banco.
 */
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>(isSupabaseConfigured() ? [] : MOCK_LEADS);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const demoMode = !isSupabaseConfigured();

  const carregar = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: leadsData } = await supabase
      .from("leads_valore")
      .select("*")
      .order("atualizado_em", { ascending: false });

    const { data: mensagensData } = await supabase
      .from("lead_mensagens")
      .select("*")
      .order("criado_em", { ascending: true });

    const leads: Lead[] = (leadsData ?? []).map((l) => ({
      ...l,
      mensagens: (mensagensData ?? []).filter((m) => m.lead_id === l.id),
    }));

    setLeads(leads);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criarLead = useCallback(async (novo: Partial<Lead>) => {
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
      await supabase.from("leads_valore").insert({
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
  }, []);

  const atualizarStatus = useCallback(async (leadId: string, status: LeadStatus) => {
    const agora = new Date().toISOString();
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status, atualizado_em: agora } : l))
    );
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from("leads_valore")
        .update({ status, atualizado_em: agora })
        .eq("id", leadId);
    }
  }, []);

  // Atualização genérica de campos (nome, telefone, notas, responsável,
  // valor da proposta) — usada pelos campos editáveis do card/detalhe.
  const atualizarCampos = useCallback(async (leadId: string, patch: Partial<Lead>) => {
    const agora = new Date().toISOString();
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, ...patch, atualizado_em: agora } : l))
    );
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from("leads_valore")
        .update({ ...patch, atualizado_em: agora })
        .eq("id", leadId);
    }
  }, []);

  const excluirLead = useCallback(async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("leads_valore").delete().eq("id", leadId);
    }
  }, []);

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
