"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { PosicionamentoCliente } from "@/lib/types";

type Props = {
  cliente: PosicionamentoCliente;
  onGerar: (transcricao: string) => Promise<{ ok: boolean; erro?: string }>;
};

export function DiagnosticoPainel({ cliente, onGerar }: Props) {
  const [transcricao, setTranscricao] = useState(cliente.transcricao_bruta || "");
  const [gerando, setGerando] = useState(false);
  const [status, setStatus] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function handleGerar() {
    if (!transcricao.trim()) {
      setStatus({ tipo: "erro", texto: "Cole a transcrição antes de gerar." });
      return;
    }
    setGerando(true);
    setStatus({ tipo: "ok", texto: "Lendo a transcrição e preenchendo os 12 módulos... (pode levar até um minuto)" });
    const resultado = await onGerar(transcricao);
    setGerando(false);
    setStatus(
      resultado.ok
        ? { tipo: "ok", texto: "Dossiê gerado. Revise o conteúdo na aba Painel Estratégico." }
        : { tipo: "erro", texto: resultado.erro ?? "Não foi possível gerar agora." }
    );
  }

  return (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm text-ink/60">
        Cole abaixo a transcrição da reunião de descoberta (do Meet, do
        roteiro de perguntas) e clique em &quot;Gerar com IA&quot; — os 12
        módulos do dossiê são preenchidos automaticamente, com base
        estrita no que foi dito na reunião.
      </p>

      <textarea
        value={transcricao}
        onChange={(e) => setTranscricao(e.target.value)}
        placeholder="Cole aqui a transcrição da reunião..."
        rows={14}
        className="mb-4 w-full resize-y rounded-xl border border-line bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-wine"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGerar}
          disabled={gerando}
          className="flex items-center gap-2 rounded-lg bg-wine px-5 py-2.5 text-sm font-medium text-off-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {gerando ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {gerando ? "Gerando..." : "Gerar com IA"}
        </button>
        {cliente.gerado_em && (
          <span className="text-xs text-ink/40">
            Última geração: {new Date(cliente.gerado_em).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      {status && (
        <p className={`mt-3 text-sm ${status.tipo === "erro" ? "text-wine" : "text-ink/60"}`}>{status.texto}</p>
      )}
    </div>
  );
}
