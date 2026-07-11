"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export default function DefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <DefinirSenhaForm />
    </Suspense>
  );
}

function DefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoMode = !isSupabaseConfigured();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [temSessao, setTemSessao] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    if (demoMode) {
      router.replace("/dashboard");
      return;
    }
    const supabase = createClient();

    // Se o link do e-mail trouxer um "token_hash" na própria URL (e não
    // escondido depois de um #), a gente confirma esse código agora,
    // aqui no navegador. Isso só roda quando o JavaScript da página
    // realmente executa — ou seja, só quando uma pessoa de verdade abre
    // o link, e não quando um antivírus/scanner de e-mail "visita" o
    // link sozinho por trás dos panos (isso é bem comum em contas
    // Gmail/Outlook corporativas e é o que estava consumindo o link
    // antes da pessoa conseguir clicar nele).
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function verificar() {
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as "recovery" | "email",
          token_hash: tokenHash,
        });
        setTemSessao(!error);
        setVerificando(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setTemSessao(Boolean(data.session));
      setVerificando(false);
    }

    verificar();
  }, [demoMode, router, searchParams]);

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
          {verificando ? (
            <p className="text-sm text-ink/60">Verificando o link...</p>
          ) : !temSessao ? (
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
