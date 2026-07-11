"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Fica escutando em segundo plano os links de "recuperar senha" e
 * "link mágico" que o Supabase manda por e-mail. Quando alguém clica
 * nesses links, o Supabase cria uma sessão temporária e volta para o
 * painel — esse componente detecta isso e leva a pessoa direto para a
 * tela de "Definir senha", em vez de deixá-la solta no dashboard sem
 * nunca ter escolhido uma senha.
 */
export function AuthRecoveryListener() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Verificação direta na URL: se o link que a pessoa clicou ainda
    // traz "type=recovery" no endereço (isso acontece assim que ela
    // chega, antes do Supabase processar o token), já manda pra tela
    // certa. Isso cobre o caso de o evento PASSWORD_RECOVERY disparar
    // antes deste componente terminar de montar.
    if (typeof window !== "undefined") {
      const hash = window.location.hash;

      if (hash.includes("type=recovery") && window.location.pathname !== "/definir-senha") {
        router.replace("/definir-senha" + hash);
      } else if (hash.includes("error=") || hash.includes("error_code=")) {
        // O link chegou, mas o Supabase recusou o token (expirado, já
        // usado, etc). Isso também vem escondido depois do "#", que só
        // o navegador consegue ler — por isso extraímos a mensagem
        // aqui e mandamos como texto normal pra tela de login, em vez
        // de deixar a pessoa numa tela de login em branco sem
        // explicação nenhuma.
        const parsed = new URLSearchParams(hash.replace(/^#/, ""));
        const mensagem =
          parsed.get("error_description") || parsed.get("error_code") || "link inválido ou expirado";
        router.replace("/login?erro=" + encodeURIComponent(mensagem.replace(/\+/g, " ")));
      }
    }

    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/definir-senha");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
