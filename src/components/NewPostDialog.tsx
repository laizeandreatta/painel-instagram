"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  CATEGORIA_CORES,
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  Categoria,
  Post,
  PostStatus,
  PostType,
  STATUS_LABELS,
  STATUS_ORDER,
  TIPO_LABELS,
} from "@/lib/types";
import { useTeam } from "@/lib/useTeam";
import { handlePasteControlled } from "@/lib/textUtils";

export function NewPostDialog({
  onCreate,
  responsavelPadrao,
}: {
  onCreate: (dados: Partial<Post>) => void;
  responsavelPadrao?: string;
}) {
  const equipe = useTeam();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [legenda, setLegenda] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [roteiro, setRoteiro] = useState("");
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [tipo, setTipo] = useState<PostType>("estatico");
  const [status, setStatus] = useState<PostStatus>("ideia");
  const [responsavel, setResponsavel] = useState(responsavelPadrao ?? "");
  const [designer, setDesigner] = useState("");
  const [data, setData] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [hora, setHora] = useState(
    new Date().toTimeString().slice(0, 5)
  );

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onCreate({
      titulo,
      legenda,
      hashtags,
      roteiro,
      categoria,
      tipo,
      status,
      responsavel_nome: responsavel || null,
      designer_nome: designer || null,
      data_publicacao: new Date(`${data}T${hora}`).toISOString(),
    });
    setTitulo("");
    setLegenda("");
    setHashtags("");
    setRoteiro("");
    setCategoria(null);
    setTipo("estatico");
    setStatus("ideia");
    setResponsavel(responsavelPadrao ?? "");
    setDesigner("");
    setAberto(false);
  }

  const rotuloRoteiro =
    tipo === "reel"
      ? "Roteiro do Reel"
      : tipo === "carrossel"
      ? "Conteúdo dos slides do carrossel"
      : "Roteiro / conteúdo";

  const placeholderRoteiro =
    tipo === "reel"
      ? "Gancho, desenvolvimento, CTA... escreva a fala ou o roteiro completo do vídeo."
      : tipo === "carrossel"
      ? "Slide 1: ...\nSlide 2: ...\nSlide 3: ...\n\nCole aqui o texto de cada slide do carrossel."
      : "Anotações de produção, roteiro ou texto de apoio para este conteúdo.";

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 rounded-lg bg-wine px-4 py-2 text-sm font-medium text-off-white hover:opacity-90"
      >
        <Plus size={16} /> Novo conteúdo
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8">
          <div className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
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

            <form
              onSubmit={salvar}
              className="flex flex-col gap-4 overflow-y-auto px-6 py-5"
            >
              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                    Designer
                  </label>
                  <select
                    value={designer}
                    onChange={(e) => setDesigner(e.target.value)}
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
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PostStatus)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  >
                    {STATUS_ORDER.map((valor) => (
                      <option key={valor} value={valor}>
                        {STATUS_LABELS[valor]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  Assunto
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIA_ORDER.map((valor) => {
                    const cor = CATEGORIA_CORES[valor];
                    const selecionado = categoria === valor;
                    return (
                      <button
                        key={valor}
                        type="button"
                        onClick={() =>
                          setCategoria(selecionado ? null : valor)
                        }
                        style={
                          selecionado
                            ? { background: cor.bg, color: cor.text }
                            : undefined
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selecionado
                            ? "border-transparent"
                            : "border-line bg-white text-ink/60 hover:border-wine hover:text-wine"
                        }`}
                      >
                        {CATEGORIA_LABELS[valor]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  {rotuloRoteiro}
                </label>
                <textarea
                  value={roteiro}
                  onChange={(e) => setRoteiro(e.target.value)}
                  onPaste={(e) => handlePasteControlled(e, roteiro, setRoteiro)}
                  rows={8}
                  className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                  placeholder={placeholderRoteiro}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
                  Legenda
                </label>
                <textarea
                  value={legenda}
                  onChange={(e) => setLegenda(e.target.value)}
                  onPaste={(e) => handlePasteControlled(e, legenda, setLegenda)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
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

              <button
                type="submit"
                className="mt-1 rounded-lg bg-wine py-2.5 text-sm font-medium text-off-white hover:opacity-90"
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
