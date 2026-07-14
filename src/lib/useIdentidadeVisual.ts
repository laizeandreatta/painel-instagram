"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { CorPaleta, MoodboardImagem, Tipografia } from "./types";

/**
 * Identidade visual da marca: paleta de cores, tipografia de referência e
 * moodboard de imagens. Editável direto pelo painel, para que a Laize não
 * precise pedir ajuda toda vez que quiser atualizar alguma coisa.
 */
export function useIdentidadeVisual() {
  const [cores, setCores] = useState<CorPaleta[]>([]);
  const [tipografias, setTipografias] = useState<Tipografia[]>([]);
  const [moodboard, setMoodboard] = useState<MoodboardImagem[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured());

  const carregar = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const supabase = createClient();
    const [
      { data: coresData },
      { data: tipografiasData },
      { data: moodboardData },
    ] = await Promise.all([
      supabase.from("paleta_cores").select("*").order("ordem", { ascending: true }),
      supabase
        .from("tipografias")
        .select("*")
        .order("ordem", { ascending: true }),
      supabase
        .from("moodboard_imagens")
        .select("*")
        .order("criado_em", { ascending: false }),
    ]);
    setCores(coresData ?? []);
    setTipografias(tipografiasData ?? []);
    setMoodboard(moodboardData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionarCor = useCallback(async (nome: string, hex: string) => {
    const cor: CorPaleta = {
      id: `cor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome,
      hex,
      ordem: Date.now(),
      criado_em: new Date().toISOString(),
    };
    setCores((prev) => [...prev, cor]);
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("paleta_cores").insert(cor);
    }
  }, []);

  const excluirCor = useCallback(async (id: string) => {
    setCores((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("paleta_cores").delete().eq("id", id);
    }
  }, []);

  const adicionarTipografia = useCallback(
    async (nome: string, uso: string, urlReferencia: string) => {
      const tipografia: Tipografia = {
        id: `tipo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome,
        uso: uso || null,
        url_referencia: urlReferencia || null,
        ordem: Date.now(),
        criado_em: new Date().toISOString(),
      };
      setTipografias((prev) => [...prev, tipografia]);
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("tipografias").insert(tipografia);
      }
    },
    []
  );

  const excluirTipografia = useCallback(async (id: string) => {
    setTipografias((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("tipografias").delete().eq("id", id);
    }
  }, []);

  const adicionarImagemMoodboard = useCallback(
    async (url: string, nomeArquivo: string, enviadoPor: string) => {
      const imagem: MoodboardImagem = {
        id: `mb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        nome_arquivo: nomeArquivo,
        enviado_por: enviadoPor,
        criado_em: new Date().toISOString(),
      };
      setMoodboard((prev) => [imagem, ...prev]);
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("moodboard_imagens").insert(imagem);
      }
    },
    []
  );

  const excluirImagemMoodboard = useCallback(async (id: string) => {
    setMoodboard((prev) => prev.filter((m) => m.id !== id));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("moodboard_imagens").delete().eq("id", id);
    }
  }, []);

  return {
    cores,
    tipografias,
    moodboard,
    loading,
    adicionarCor,
    excluirCor,
    adicionarTipografia,
    excluirTipografia,
    adicionarImagemMoodboard,
    excluirImagemMoodboard,
  };
}
