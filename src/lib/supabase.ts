import { createBrowserClient } from "@supabase/ssr";

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

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local"
    );
  }
  return createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
}
