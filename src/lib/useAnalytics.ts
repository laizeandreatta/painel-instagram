"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { MOCK_ANALISES, MOCK_SEGUIDORES } from "./mockData";
import { AnalisePost, SeguidoresSnapshot } from "./types";

export function useAnalytics() {
  const [analises, setAnalises] = useState<AnalisePost[]>(
    isSupabaseConfigured() ? [] : MOCK_ANALISES
  );
  const [seguidores, setSeguidores] = useState<SeguidoresSnapshot[]>(
    isSupabaseConfigured() ? [] : MOCK_SEGUIDORES
  );
  const [loading, setLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    async function carregar() {
      const supabase = createClient();
      const { data: analisesData } = await supabase
        .from("analises_posts")
        .select("*")
        .order("coletado_em", { ascending: false });
      const { data: seguidoresData } = await supabase
        .from("seguidores_historico")
        .select("*")
        .order("data", { ascending: true });

      setAnalises(analisesData ?? []);
      setSeguidores(seguidoresData ?? []);
      setLoading(false);
    }

    carregar();
  }, []);

  return { analises, seguidores, loading, demoMode: !isSupabaseConfigured() };
}
