"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoMode = !isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (demoMode) {
      router.replace("/dashboard");
      return;
    }
    const erroUrl = searchParams.get("erro");
    if (erroUrl) {
      setErro(
        "O link que você usou não é mais válido: " +
          erroUrl +
          ". Peça um novo e-mail de recuperação de senha."
      );
    }
  }, [demoMode, router, searchParams]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-off-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-editorial text-3xl font-semibold tracking-tight text-ink">
            Dashboard
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-wine">
            Laize Andreatta
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="rounded-2xl border border-line bg-white/60 p-7 shadow-sm"
        >
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
            E-mail
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
            placeholder="voce@email.com"
          />

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
            Senha
          </label>
          <input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mb-5 w-full rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
            placeholder="••••••••"
          />

          {erro && <p className="mb-4 text-sm text-wine">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-wine py-2.5 text-sm font-medium text-off-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/40">
          Acesso restrito à equipe. Peça ao administrador para criar sua
          conta no Supabase.
        </p>
      </div>
    </div>
  );
}
