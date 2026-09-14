"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PosicionamentoConteudo, PosicionamentoConteudoStatus } from "@/lib/types";
import { STATUS_CONTEUDO_OPTS, statusConteudoLabel } from "@/lib/posicionamentoModulos";

type Props = {
  conteudos: PosicionamentoConteudo[];
  readOnly: boolean;
  onCriar?: (dados: Partial<PosicionamentoConteudo>) => Promise<void>;
  onAtualizar?: (id: string, patch: Partial<PosicionamentoConteudo>) => Promise<void>;
  onExcluir?: (id: string) => Promise<void>;
};

const STATUS_CLASSES: Record<PosicionamentoConteudoStatus, string> = {
  ideia: "bg-off-white text-ink/60 border border-line",
  producao: "bg-baby-pink-light text-bordeaux",
  agendado: "bg-wine/10 text-wine",
  publicado: "bg-emerald-50 text-emerald-700",
};

export function ConteudosPainel({ conteudos, readOnly, onCriar, onAtualizar, onExcluir }: Props) {
  const [novo, setNovo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [editoria, setEditoria] = useState("");
  const [descricao, setDescricao] = useState("");

  async function handleCriar() {
    if (!titulo.trim() || !onCriar) return;
    await onCriar({ titulo: titulo.trim(), data: data || null, editoria, descricao, status: "ideia" });
    setTitulo("");
    setData("");
    setEditoria("");
    setDescricao("");
    setNovo(false);
  }

  return (
    <div className="max-w-4xl">
      {!readOnly && (
        <div className="mb-4">
          {!novo ? (
            <button
              onClick={() => setNovo(true)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-wine hover:text-wine"
            >
              <Plus size={15} /> Novo conteúdo
            </button>
          ) : (
            <div className="rounded-xl border border-line bg-white p-4">
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título"
                  className="rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                />
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                />
                <input
                  value={editoria}
                  onChange={(e) => setEditoria(e.target.value)}
                  placeholder="Editoria"
                  className="rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                />
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição"
                  className="rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCriar}
                  className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-off-white hover:opacity-90"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setNovo(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm text-ink/60 hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {conteudos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink/40">
          Nenhum conteúdo planejado ainda.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink/45">
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Editoria</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Status</th>
                {!readOnly && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {conteudos.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{c.titulo}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.data ? new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{c.editoria || "—"}</td>
                  <td className="px-4 py-3 text-ink/60">{c.descricao || "—"}</td>
                  <td className="px-4 py-3">
                    {readOnly || !onAtualizar ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[c.status]}`}>
                        {statusConteudoLabel(c.status)}
                      </span>
                    ) : (
                      <select
                        value={c.status}
                        onChange={(e) =>
                          onAtualizar(c.id, { status: e.target.value as PosicionamentoConteudoStatus })
                        }
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${STATUS_CLASSES[c.status]}`}
                      >
                        {STATUS_CONTEUDO_OPTS.map((s) => (
                          <option key={s.v} value={s.v}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onExcluir?.(c.id)}
                        title="Excluir"
                        className="text-ink/30 hover:text-wine"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
