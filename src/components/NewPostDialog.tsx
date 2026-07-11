"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Post, PostType, TIPO_LABELS } from "@/lib/types";

export function NewPostDialog({
  onCreate,
}: {
  onCreate: (dados: Partial<Post>) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [legenda, setLegenda] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [tipo, setTipo] = useState<PostType>("feed");
  const [data, setData] = useState(
    new Date().toISOString().slice(0, 10)
  );

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onCreate({
      titulo,
      legenda,
      hashtags,
      tipo,
      data_publicacao: new Date(data).toISOString(),
    });
    setTitulo("");
    setLegenda("");
    setHashtags("");
    setTipo("feed");
    setAberto(false);
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 rounded-lg bg-wine px-4 py-2 text-sm font-medium text-off-white hover:opacity-90"
      >
        <Plus size={16} /> Novo conteúdo
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Novo conteúdo
              </h3>
              <button
                onClick={() => setAberto(false)}
                className="text-ink/40 hover:text-wine"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvar} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  Título
                </label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  placeholder="Ex: Lançamento cápsula verão"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  Legenda
                </label>
                <textarea
                  value={legenda}
                  onChange={(e) => setLegenda(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  placeholder="Escreva a legenda do post..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  Hashtags
                </label>
                <input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  placeholder="#moda #lancamento"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                    Formato
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as PostType)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  >
                    {Object.entries(TIPO_LABELS).map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                    Data
                  </label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 rounded-lg bg-wine py-2.5 text-sm font-medium text-off-white hover:opacity-90"
              >
                Criar conteúdo
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
