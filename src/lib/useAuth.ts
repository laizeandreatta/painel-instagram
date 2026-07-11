"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { Profile } from "./types";

const DEMO_PROFILE: Profile = {
  id: "demo-user",
  nome: "Laize (modo demo)",
  email: "laizeandreatta@gmail.com",
  papel: "admin",
};

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(
    isSupabaseConfigured() ? null : DEMO_PROFILE
  );
  const [loading, setLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(
        data
          ? {
              id: data.id,
              nome: data.nome,
              email: data.email,
              papel: data.papel,
              avatar_url: data.avatar_url,
            }
          : {
              id: session.user.id,
              nome: session.user.email ?? "Usuário",
              email: session.user.email ?? "",
              papel: "editor",
            }
      );
      setLoading(false);
    }

    loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { profile, loading, demoMode: !isSupabaseConfigured() };
}
