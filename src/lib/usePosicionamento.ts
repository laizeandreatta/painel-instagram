"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import {
  PosicionamentoCliente,
  PosicionamentoConteudo,
  PosicionamentoModulos,
} from "./types";
import { modulosVazios } from "./posicionamentoModulos";

/**
 * Dados do Posicionamento de Valor: dossiê de posicionamento por cliente
 * (12 módulos preenchidos via IA a partir da transcrição da reunião de
 * descoberta, revisados à mão) + calendário de conteúdo por cliente.
 *
 * Modo demo (Supabase não configurado): um cliente de exemplo em
 * memória, igual ao resto do painel. Com Supabase configurado, lê/grava
 * nas tabelas posicionamento_clientes e posicionamento_conteudos — veja
 * supabase/migration-posicionamento.sql.
 */

function slugify(s: string): string {
  return (
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cliente"
  );
}

function demoCliente(): PosicionamentoCliente {
  const modulos = modulosVazios();
  modulos["03"] = {
    declaracao:
      "A estrategista que traduz posicionamento em arquitetura comercial — para quem já construiu autoridade, mas ainda não organizou isso em oferta e receita.",
    respostas: [
      "Consultoria de marca pessoal e posicionamento estratégico",
      "Empreendedoras com autoridade construída, mas comunicação dispersa",
      "Transformar clareza de posicionamento em crescimento comercial mensurável",
      "Mentoria genérica de redes sociais sem estratégia de negócio por trás",
      "A ponte entre estratégia de marca e arquitetura comercial",
    ],
  };
  const agora = new Date().toISOString();
  return {
    id: "demo-cliente-1",
    nome: "Cliente Exemplo",
    slug: "cliente-exemplo",
    transcricao_bruta: "",
    gerado_em: null,
    modulos,
    cliente_user_id: null,
    criado_em: agora,
    atualizado_em: agora,
  };
}

function demoConteudos(clienteId: string): PosicionamentoConteudo[] {
  return [
    {
      id: "demo-c1",
      cliente_id: clienteId,
      titulo: "Por que autoridade sem oferta não vira receita",
      data: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      editoria: "Posicionamento",
      descricao: "Carrossel explicando o gargalo comercial mais comum em quem já tem audiência.",
      status: "ideia",
      criado_em: new Date().toISOString(),
    },
    {
      id: "demo-c2",
      cliente_id: clienteId,
      titulo: "Bastidor da virada de carreira",
      data: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
      editoria: "Narrativa",
      descricao: "Reels contando o ponto de virada da trajetória.",
      status: "producao",
      criado_em: new Date().toISOString(),
    },
  ];
}

// ---------------------------------------------------------------------
// Lista de clientes (uso da equipe) — /posicionamento
// ---------------------------------------------------------------------
export function usePosicionamentoClientes() {
  const demoMode = !isSupabaseConfigured();
  const [clientes, setClientes] = useState<PosicionamentoCliente[]>(
    demoMode ? [demoCliente()] : []
  );
  const [loading, setLoading] = useState(!demoMode);

  const carregar = useCallback(async () => {
    if (demoMode) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posicionamento_clientes")
      .select("*")
      .order("nome", { ascending: true });
    if (error) console.error("Erro ao carregar clientes do Posicionamento:", error);
    setClientes((data as PosicionamentoCliente[]) ?? []);
    setLoading(false);
  }, [demoMode]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criarCliente = useCallback(
    async (nome: string): Promise<{ cliente: PosicionamentoCliente | null; erro: string | null }> => {
      const nomeLimpo = nome.trim();
      if (!nomeLimpo) return { cliente: null, erro: "Digite um nome antes de criar." };
      const slug = slugify(nomeLimpo);
      const agora = new Date().toISOString();

      if (demoMode) {
        const novo: PosicionamentoCliente = {
          id: `demo-${Date.now()}`,
          nome: nomeLimpo,
          slug,
          transcricao_bruta: "",
          gerado_em: null,
          modulos: modulosVazios(),
          cliente_user_id: null,
          criado_em: agora,
          atualizado_em: agora,
        };
        setClientes((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
        return { cliente: novo, erro: null };
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("posicionamento_clientes")
        .insert({ nome: nomeLimpo, slug, modulos: modulosVazios() })
        .select()
        .single();

      if (error || !data) {
        console.error("Erro ao criar cliente do Posicionamento:", error);
        return { cliente: null, erro: "Não foi possível criar agora. Tente de novo em instantes." };
      }
      await carregar();
      return { cliente: data as PosicionamentoCliente, erro: null };
    },
    [demoMode, carregar]
  );

  const excluirCliente = useCallback(
    async (id: string) => {
      setClientes((prev) => prev.filter((c) => c.id !== id));
      if (demoMode) return;
      const supabase = createClient();
      // As linhas de posicionamento_conteudos têm "on delete cascade" —
      // apagar o cliente já leva o calendário de conteúdo dele junto.
      await supabase.from("posicionamento_clientes").delete().eq("id", id);
    },
    [demoMode]
  );

  return { clientes, loading, demoMode, criarCliente, excluirCliente, recarregar: carregar };
}

// ---------------------------------------------------------------------
// Um cliente (uso da equipe, edição completa)
// ---------------------------------------------------------------------
export function usePosicionamentoCliente(clienteId: string | null) {
  const demoMode = !isSupabaseConfigured();
  const [cliente, setCliente] = useState<PosicionamentoCliente | null>(null);
  const [loading, setLoading] = useState(Boolean(clienteId) && !demoMode);

  const carregar = useCallback(async () => {
    if (!clienteId) {
      setCliente(null);
      return;
    }
    if (demoMode) {
      setCliente(clienteId === "demo-cliente-1" ? demoCliente() : null);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posicionamento_clientes")
      .select("*")
      .eq("id", clienteId)
      .maybeSingle();
    if (error) console.error("Erro ao carregar cliente do Posicionamento:", error);
    setCliente((data as PosicionamentoCliente) ?? null);
    setLoading(false);
  }, [clienteId, demoMode]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarGeracao = useCallback(
    async (transcricao: string, modulos: PosicionamentoModulos) => {
      const agora = new Date().toISOString();
      setCliente((prev) =>
        prev ? { ...prev, transcricao_bruta: transcricao, gerado_em: agora, modulos } : prev
      );
      if (demoMode || !clienteId) return;
      const supabase = createClient();
      await supabase
        .from("posicionamento_clientes")
        .update({ transcricao_bruta: transcricao, gerado_em: agora, modulos, atualizado_em: agora })
        .eq("id", clienteId);
    },
    [demoMode, clienteId]
  );

  const salvarModulos = useCallback(
    async (modulos: PosicionamentoModulos) => {
      const agora = new Date().toISOString();
      setCliente((prev) => (prev ? { ...prev, modulos, atualizado_em: agora } : prev));
      if (demoMode || !clienteId) return;
      const supabase = createClient();
      await supabase
        .from("posicionamento_clientes")
        .update({ modulos, atualizado_em: agora })
        .eq("id", clienteId);
    },
    [demoMode, clienteId]
  );

  return { cliente, loading, demoMode, salvarGeracao, salvarModulos, recarregar: carregar };
}

// ---------------------------------------------------------------------
// Calendário de conteúdo de um cliente
// ---------------------------------------------------------------------
export function usePosicionamentoConteudos(clienteId: string | null) {
  const demoMode = !isSupabaseConfigured();
  const [conteudos, setConteudos] = useState<PosicionamentoConteudo[]>([]);
  const [loading, setLoading] = useState(Boolean(clienteId) && !demoMode);

  const carregar = useCallback(async () => {
    if (!clienteId) {
      setConteudos([]);
      return;
    }
    if (demoMode) {
      setConteudos(clienteId === "demo-cliente-1" ? demoConteudos(clienteId) : []);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posicionamento_conteudos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("data", { ascending: true });
    if (error) console.error("Erro ao carregar conteúdos do Posicionamento:", error);
    setConteudos((data as PosicionamentoConteudo[]) ?? []);
    setLoading(false);
  }, [clienteId, demoMode]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criarConteudo = useCallback(
    async (novo: Partial<PosicionamentoConteudo>) => {
      if (!clienteId) return;
      const item: PosicionamentoConteudo = {
        id: `${demoMode ? "demo-" : ""}${Date.now()}`,
        cliente_id: clienteId,
        titulo: novo.titulo ?? "",
        data: novo.data ?? null,
        editoria: novo.editoria ?? "",
        descricao: novo.descricao ?? "",
        status: novo.status ?? "ideia",
        criado_em: new Date().toISOString(),
      };
      setConteudos((prev) => [...prev, item]);
      if (demoMode) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("posicionamento_conteudos")
        .insert({
          cliente_id: clienteId,
          titulo: item.titulo,
          data: item.data,
          editoria: item.editoria,
          descricao: item.descricao,
          status: item.status,
        })
        .select()
        .single();
      if (!error && data) {
        setConteudos((prev) => prev.map((c) => (c.id === item.id ? (data as PosicionamentoConteudo) : c)));
      }
    },
    [clienteId, demoMode]
  );

  const atualizarConteudo = useCallback(
    async (id: string, patch: Partial<PosicionamentoConteudo>) => {
      setConteudos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      if (demoMode) return;
      const supabase = createClient();
      await supabase.from("posicionamento_conteudos").update(patch).eq("id", id);
    },
    [demoMode]
  );

  const excluirConteudo = useCallback(
    async (id: string) => {
      setConteudos((prev) => prev.filter((c) => c.id !== id));
      if (demoMode) return;
      const supabase = createClient();
      await supabase.from("posicionamento_conteudos").delete().eq("id", id);
    },
    [demoMode]
  );

  return { conteudos, loading, demoMode, criarConteudo, atualizarConteudo, excluirConteudo, recarregar: carregar };
}

// ---------------------------------------------------------------------
// Visão do cliente: acha o dossiê ligado ao login dele (só leitura — a
// política de RLS "cliente le proprio posicionamento" garante que essa
// consulta só pode voltar a própria linha dele, nunca a de outro
// cliente).
// ---------------------------------------------------------------------
export function useMeuPosicionamento() {
  const demoMode = !isSupabaseConfigured();
  const [cliente, setCliente] = useState<PosicionamentoCliente | null>(demoMode ? demoCliente() : null);
  const [conteudos, setConteudos] = useState<PosicionamentoConteudo[]>(
    demoMode ? demoConteudos("demo-cliente-1") : []
  );
  const [loading, setLoading] = useState(!demoMode);

  useEffect(() => {
    if (demoMode) return;
    let cancelado = false;
    async function carregar() {
      setLoading(true);
      const supabase = createClient();
      const { data: clienteData, error } = await supabase
        .from("posicionamento_clientes")
        .select("*")
        .maybeSingle();
      if (error) console.error("Erro ao carregar seu Posicionamento de Valor:", error);
      if (cancelado) return;
      setCliente((clienteData as PosicionamentoCliente) ?? null);
      if (clienteData) {
        const { data: conteudosData } = await supabase
          .from("posicionamento_conteudos")
          .select("*")
          .eq("cliente_id", clienteData.id)
          .order("data", { ascending: true });
        if (!cancelado) setConteudos((conteudosData as PosicionamentoConteudo[]) ?? []);
      }
      if (!cancelado) setLoading(false);
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [demoMode]);

  return { cliente, conteudos, loading, demoMode };
}
