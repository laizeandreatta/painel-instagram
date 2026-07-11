"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export default function DefinirSenhaPage() {
  const router = useRouter();
  const demoMode = !isSupabaseConfigured();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [temSessao, setTemSessao] = useState(false);

  useEffect(() => {
    if (demoMode) {
      router.replace("/dashboard");
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setTemSessao(Boolean(data.session));
    });
  }, [demoMode, router]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      setErro("Não foi possível salvar a senha. Peça um novo link de recuperação e tente de novo.");
      return;
    }

    setSucesso(true);
    setTimeout(() => router.replace("/dashboard"), 1500);
  }

  if (demoMode) return null;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-off-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-editorial text-3xl font-semibold tracking-tight text-ink">
            Editorial
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-wine">
            Definir senha
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white/60 p-7 shadow-sm">
          {!temSessao ? (
            <p className="text-sm text-ink/60">
              Este link de recuperação não é mais válido (ele expira depois de
              usado ou após um tempo). Peça um novo e-mail de recuperação de
              senha e clique no link mais recente.
            </p>
          ) : sucesso ? (
            <p className="text-sm text-wine">
              Senha salva! Levando você para o painel...
            </p>
          ) : (
            <form onSubmit={salvar}>
              <p className="mb-5 text-sm text-ink/60">
                Escolha a senha que você vai usar para entrar no painel a
                partir de agora.
              </p>

              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                Nova senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mb-4 w-full rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                placeholder="••••••••"
              />

              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                Confirmar senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="mb-5 w-full rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                placeholder="••••••••"
              />

              {erro && <p className="mb-4 text-sm text-wine">{erro}</p>}

              <button
                type="submit"
                disabled={carregando}
                className="w-full rounded-lg bg-wine py-2.5 text-sm font-medium text-off-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {carregando ? "Salvando..." : "Salvar senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
