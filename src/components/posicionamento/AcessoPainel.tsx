"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { PosicionamentoCliente } from "@/lib/types";

type Props = {
  cliente: PosicionamentoCliente;
  onCriarAcesso: (dados: { email: string; senha: string; nome: string }) => Promise<{ ok: boolean; erro?: string }>;
};

export function AcessoPainel({ cliente, onCriarAcesso }: Props) {
  const jaTemAcesso = Boolean(cliente.cliente_user_id);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleSalvar() {
    if (!email.trim()) {
      setStatus({ tipo: "erro", texto: "Preencha o e-mail do cliente." });
      return;
    }
    setEnviando(true);
    const resultado = await onCriarAcesso({ email: email.trim(), senha, nome: cliente.nome });
    setEnviando(false);
    setStatus(
      resultado.ok
        ? {
            tipo: "ok",
            texto: jaTemAcesso
              ? "Acesso atualizado."
              : `Login criado. Avise ${cliente.nome.split(" ")[0]} que já pode entrar em /login com esse e-mail e senha.`,
          }
        : { tipo: "erro", texto: resultado.erro ?? "Não foi possível salvar agora." }
    );
    if (resultado.ok) setSenha("");
  }

  return (
    <div className="max-w-md">
      <div className="mb-5 flex items-center gap-2 text-sm text-ink/60">
        <KeyRound size={16} className="text-wine" />
        {jaTemAcesso
          ? "Este cliente já tem login. Você pode redefinir a senha dele abaixo a qualquer momento."
          : "Crie um login para este cliente. Ele vai entrar pelo /login do painel e só vai ver o próprio dossiê de Posicionamento de Valor — sem acesso a mais nada, e sem poder editar, só visualizar e copiar."}
      </div>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">E-mail do cliente</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="cliente@email.com"
        className="mb-4 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-wine"
      />

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
        {jaTemAcesso ? "Nova senha (deixe em branco para não trocar)" : "Senha inicial"}
      </label>
      <input
        type="text"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="mín. 6 caracteres"
        className="mb-5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-wine"
      />

      <button
        onClick={handleSalvar}
        disabled={enviando}
        className="flex items-center gap-2 rounded-lg bg-wine px-5 py-2.5 text-sm font-medium text-off-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {enviando && <Loader2 size={16} className="animate-spin" />}
        {jaTemAcesso ? "Salvar acesso" : "Criar acesso"}
      </button>

      {status && (
        <p className={`mt-3 text-sm ${status.tipo === "erro" ? "text-wine" : "text-ink/60"}`}>{status.texto}</p>
      )}
    </div>
  );
}
