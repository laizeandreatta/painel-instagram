"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { MOCK_EQUIPE } from "./mockData";

export type MembroEquipe = {
  id: string;
  nome: string;
  papel?: string;
};

/**
 * Lista de pessoas da equipe, usada para preencher os seletores de
 * "Responsável" e "Designer" nos conteúdos. Em modo demo usa a equipe
 * de exemplo; com Supabase configurado, busca a tabela "perfis" (todo
 * mundo que já aceitou o convite e criou login).
 */
export function useTeam() {
  const [equipe, setEquipe] = useState<MembroEquipe[]>(
    isSupabaseConfigured() ? [] : MOCK_EQUIPE
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let ativo = true;
    const supabase = createClient();
    supabase
      .from("perfis")
      .select("id, nome, papel")
      .order("nome", { ascending: true })
      .then(({ data }) => {
        if (ativo && data) setEquipe(data);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return equipe;
}
