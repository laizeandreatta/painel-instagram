"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send } from "lucide-react";
import { Comentario } from "@/lib/types";

export function CommentThread({
  comentarios,
  autorNome,
  autorId,
  onEnviar,
}: {
  comentarios: Comentario[];
  autorNome: string;
  autorId: string;
  onEnviar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    onEnviar(texto.trim());
    setTexto("");
  }

  return (
    <div>
      <h3 className="mb-3 font-editorial text-lg font-semibold text-ink">
        Aprovação e comentários
      </h3>

      <div className="mb-4 flex flex-col gap-3">
        {comentarios.length === 0 && (
          <p className="text-sm text-ink/40">
            Nenhum comentário ainda. Deixe um feedback para a equipe.
          </p>
        )}
        {comentarios.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-line bg-off-white px-3 py-2.5"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                {c.autor_nome}
              </span>
              <span className="text-[11px] text-ink/40">
                {format(new Date(c.criado_em), "dd MMM, HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
            <p className="text-sm text-ink/75">{c.texto}</p>
          </div>
        ))}
      </div>

      <form onSubmit={enviar} className="flex items-center gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`Comentar como ${autorNome}...`}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-wine px-3.5 py-2 text-sm font-medium text-off-white hover:opacity-90"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
