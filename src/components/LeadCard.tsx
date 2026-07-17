"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, Phone, Trash2 } from "lucide-react";
import { LEAD_ORIGEM_LABELS, Lead } from "@/lib/types";

// Normaliza o telefone para o formato aceito pelo link wa.me (só dígitos).
function linkWhatsapp(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  return `https://wa.me/${digitos}`;
}

export function LeadCard({
  lead,
  onExcluir,
}: {
  lead: Lead;
  onExcluir?: (leadId: string) => void;
}) {
  return (
    <div className="group rounded-xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-wine">
          {LEAD_ORIGEM_LABELS[lead.origem]}
        </span>
        {onExcluir && (
          <button
            onClick={() => onExcluir(lead.id)}
            title="Excluir lead"
            className="text-ink/30 opacity-0 hover:text-bordeaux group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <h3 className="mb-1 text-base font-semibold leading-snug text-ink">
        {lead.nome}
      </h3>

      {lead.telefone && (
        <a
          href={linkWhatsapp(lead.telefone)}
          target="_blank"
          rel="noreferrer"
          className="mb-2 flex items-center gap-1 text-xs text-ink/50 hover:text-wine"
        >
          <Phone size={12} /> {lead.telefone}
        </a>
      )}

      {lead.ultima_mensagem && (
        <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-off-white px-2.5 py-2 text-xs text-ink/60">
          <MessageCircle size={13} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{lead.ultima_mensagem}</span>
        </p>
      )}

      {typeof lead.valor_proposta === "number" && lead.valor_proposta > 0 && (
        <p className="mb-2 text-xs font-medium text-ink/70">
          Proposta:{" "}
          {lead.valor_proposta.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-ink/45">
        <span>
          {format(new Date(lead.criado_em), "dd 'de' MMM", { locale: ptBR })}
        </span>
        {lead.responsavel_nome && (
          <span className="text-ink/60">{lead.responsavel_nome}</span>
        )}
      </div>
    </div>
  );
}
