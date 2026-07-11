import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Retorna true quando as variáveis de ambiente do Supabase foram
 * configuradas. Enquanto isso não acontece, o painel roda em "modo
 * demonstração" usando dados fictícios guardados em memória, para que
 * seja possível ver e testar tudo antes de conectar o banco de dados
 * de verdade.
 */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Guarda uma única instância do cliente no navegador. Criar mais de um
// cliente causava um problema real: cada instância tentava ler o token
// de recuperação de senha (#access_token=...) da URL de forma
// independente, e só a primeira conseguia — as outras partes do painel
// (como o listener que leva para a tela de "Definir senha") nunca
// recebiam o evento e a pessoa acabava caindo direto na tela de login
// comum, sem nunca ter escolhido uma senha.
let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local"
    );
  }
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
  }
  return browserClient;
}
