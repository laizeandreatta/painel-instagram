"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Lead, LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/types";
import { useTeam } from "@/lib/useTeam";

export function NewLeadDialog({
  onCreate,
  responsavelPadrao,
  statusOrder = LEAD_STATUS_ORDER,
  statusLabels = LEAD_STATUS_LABELS,
  statusPadrao = "novo",
}: {
  onCreate: (dados: Partial<Lead>) => void;
  responsavelPadrao?: string;
  statusOrder?: LeadStatus[];
  statusLabels?: Record<LeadStatus, string>;
  statusPadrao?: LeadStatus;
}) {
  const equipe = useTeam();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState<LeadStatus>(statusPadrao);
  const [responsavel, setResponsavel] = useState(responsavelPadrao ?? "");
  const [notas, setNotas] = useState("");

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) return;
    onCreate({
      nome,
      telefone,
      origem: "manual",
      status,
      responsavel_nome: responsavel || null,
      notas,
    });
    setNome("");
    setTelefone("");
    setStatus(statusPadrao);
    setResponsavel(responsavelPadrao ?? "");
    setNotas("");
    setAberto(false);
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 rounded-lg bg-wine px-4 py-2 text-sm font-medium text-off-white hover:opacity-90"
      >
        <Plus size={16} /> Novo lead
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8">
          <div className="flex max-h-full w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Novo lead
              </h3>
              <button
                onClick={() => setAberto(false)}
                className="text-ink/40 hover:text-wine"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={salvar}
              className="flex flex-col gap-4 overflow-y-auto px-6 py-5"
            >
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  Nome
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  placeholder="Nome do lead"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  WhatsApp
                </label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  placeholder="+55 11 90000-0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                    Etapa
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  >
                    {statusOrder.map((valor) => (
                      <option key={valor} value={valor}>
                        {statusLabels[valor]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                    Responsável
                  </label>
                  <select
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  >
                    <option value="">—</option>
                    {equipe.map((membro) => (
                      <option key={membro.id} value={membro.nome}>
                        {membro.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  Notas
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  placeholder="Observações sobre o lead..."
                />
              </div>

              <button
                type="submit"
                className="mt-1 rounded-lg bg-wine py-2.5 text-sm font-medium text-off-white hover:opacity-90"
              >
                Criar lead
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
