"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { Foto } from "./types";

/**
 * Banco de fotos compartilhado com a equipe. Diferente das artes (que
 * ficam ligadas a um post específico), essas fotos são soltas — servem
 * para a designer ter acesso direto a imagens que a Laize (ou qualquer
 * pessoa da equipe) sobe, sem precisar vincular a um conteúdo.
 */
export function useFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const demoMode = !isSupabaseConfigured();

  const carregar = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("fotos")
      .select("*")
      .order("criado_em", { ascending: false });
    setFotos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionarFoto = useCallback(
    async (url: string, nomeArquivo: string, enviadoPor: string) => {
      const foto: Foto = {
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        nome_arquivo: nomeArquivo,
        enviado_por: enviadoPor,
        criado_em: new Date().toISOString(),
      };
      setFotos((prev) => [foto, ...prev]);
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("fotos").insert(foto);
      }
    },
    []
  );

  const excluirFoto = useCallback(async (id: string) => {
    setFotos((prev) => prev.filter((f) => f.id !== id));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("fotos").delete().eq("id", id);
    }
  }, []);

  return { fotos, loading, demoMode, adicionarFoto, excluirFoto, recarregar: carregar };
}
