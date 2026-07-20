import clsx from "clsx";
import { LEAD_STATUS_LABELS, LeadStatus } from "@/lib/types";

const STYLES: Record<LeadStatus, string> = {
  novo: "bg-[#e2e5f0] text-[#3a4470] border border-[#cdd2e6]",
  conversa_iniciada: "bg-[#f4e9d8] text-[#7a5a24] border border-[#e9d7b6]",
  reuniao_agendada: "bg-[#dbe7f0] text-[#294a63] border border-[#c3d9e8]",
  proposta_enviada: "bg-baby-pink-light text-bordeaux border border-baby-pink",
  fechado: "bg-[#d9eee9] text-[#1f6b58] border border-[#bfe3da]",
  perdido: "bg-[#f1e1e1] text-[#8c3d2e] border border-[#e5cbcb]",
    acesso_liberado: "bg-[#dce7f0] text-[#2c4a66] border border-[#c3d5e6]",
    onboarding_enviado: "bg-[#f4e9d8] text-[#7a5a24] border border-[#e9d7b6]",
    em_acompanhamento: "bg-[#e2e5f0] text-[#3a4470] border border-[#cdd2e6]",
    concluido: "bg-[#d9eee9] text-[#1f6b58] border border-[#bfe3da]",
    suporte_pos_entrega: "bg-[#eae3f4] text-[#55407a] border border-[#dccdec]",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        STYLES[status]
      )}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
