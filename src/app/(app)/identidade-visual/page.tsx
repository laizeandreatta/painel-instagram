"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, UploadCloud, X } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { useIdentidadeVisual } from "@/lib/useIdentidadeVisual";
import { useAuth } from "@/lib/useAuth";

export default function IdentidadeVisualPage() {
  const {
    cores,
    tipografias,
    moodboard,
    loading,
    adicionarCor,
    excluirCor,
    adicionarTipografia,
    excluirTipografia,
    adicionarImagemMoodboard,
    excluirImagemMoodboard,
  } = useIdentidadeVisual();
  const { profile } = useAuth();

  const [novaCorNome, setNovaCorNome] = useState("");
  const [novaCorHex, setNovaCorHex] = useState("#7A1F30");
  const [novaFonteNome, setNovaFonteNome] = useState("");
  const [novaFonteUso, setNovaFonteUso] = useState("");
  const [novaFonteUrl, setNovaFonteUrl] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  function handleAdicionarCor(e: React.FormEvent) {
    e.preventDefault();
    if (!novaCorNome.trim()) return;
    adicionarCor(novaCorNome.trim(), novaCorHex);
    setNovaCorNome("");
    setNovaCorHex("#7A1F30");
  }

  function handleAdicionarFonte(e: React.FormEvent) {
    e.preventDefault();
    if (!novaFonteNome.trim()) return;
    adicionarTipografia(
      novaFonteNome.trim(),
      novaFonteUso.trim(),
      novaFonteUrl.trim()
    );
    setNovaFonteNome("");
    setNovaFonteUso("");
    setNovaFonteUrl("");
  }

  async function selecionarImagensMoodboard(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0) return;
    setEnviando(true);
    const enviadoPor = profile?.nome ?? "Você";

    for (const arquivo of Array.from(arquivos)) {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const caminho = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}-${arquivo.name}`;
        const { error } = await supabase.storage
          .from("moodboard")
          .upload(caminho, arquivo);
        if (!error) {
          const { data } = supabase.storage
            .from("moodboard")
            .getPublicUrl(caminho);
          await adicionarImagemMoodboard(data.publicUrl, arquivo.name, enviadoPor);
        }
      } else {
        const url = URL.createObjectURL(arquivo);
        await adicionarImagemMoodboard(url, arquivo.name, enviadoPor);
      }
    }

    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleExcluirImagem(id: string, nomeArquivo: string) {
    const confirmado = window.confirm(
      `Excluir "${nomeArquivo}"? Não pode ser desfeito.`
    );
    if (!confirmado) return;
    excluirImagemMoodboard(id);
  }

  return (
    <div className="px-6 py-7 md:px-10">
      <div className="mb-7">
        <h1 className="font-editorial text-2xl font-semibold text-ink md:text-3xl">
          Identidade visual
        </h1>
        <p className="text-sm text-ink/50">
          Paleta de cores, tipografia e moodboard de referência para quem for
          criar as artes. Fica salvo automaticamente.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-ink/50">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 font-editorial text-lg font-semibold text-ink">
              Paleta de cores
            </h2>

            {cores.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-4">
                {cores.map((cor) => (
                  <div
                    key={cor.id}
                    className="group relative flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="h-16 w-16 rounded-lg border border-line shadow-sm"
                      style={{ background: cor.hex }}
                    />
                    <p className="text-xs font-medium text-ink/70">{cor.nome}</p>
                    <p className="text-[11px] uppercase text-ink/40">{cor.hex}</p>
                    <button
                      onClick={() => excluirCor(cor.id)}
                      title="Remover cor"
                      className="absolute -right-1 -top-1 rounded-full bg-bordeaux p-0.5 text-off-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleAdicionarCor}
              className="flex flex-wrap items-end gap-3"
            >
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  Cor
                </label>
                <input
                  type="color"
                  value={novaCorHex}
                  onChange={(e) => setNovaCorHex(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-line"
                />
              </div>
              <div className="min-w-[160px] flex-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  Nome da cor
                </label>
                <input
                  value={novaCorNome}
                  onChange={(e) => setNovaCorNome(e.target.value)}
                  placeholder="Ex: Vinho principal"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-wine px-3 py-2 text-sm font-medium text-off-white hover:opacity-90"
              >
                <Plus size={15} /> Adicionar
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 font-editorial text-lg font-semibold text-ink">
              Tipografia
            </h2>

            {tipografias.length > 0 && (
              <div className="mb-5 flex flex-col gap-2">
                {tipografias.map((fonte) => (
                  <div
                    key={fonte.id}
                    className="group flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{fonte.nome}</p>
                      <p className="text-xs text-ink/50">
                        {fonte.uso}
                        {fonte.url_referencia && (
                          <>
                            {fonte.uso ? " · " : ""}
                            <a
                              href={fonte.url_referencia}
                              target="_blank"
                              rel="noreferrer"
                              className="text-wine hover:underline"
                            >
                              ver fonte
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => excluirTipografia(fonte.id)}
                      title="Remover fonte"
                      className="text-ink/30 opacity-0 transition-opacity hover:text-bordeaux group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleAdicionarFonte}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  Nome da fonte
                </label>
                <input
                  value={novaFonteNome}
                  onChange={(e) => setNovaFonteNome(e.target.value)}
                  placeholder="Ex: Playfair Display"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                />
              </div>
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  Uso
                </label>
                <input
                  value={novaFonteUso}
                  onChange={(e) => setNovaFonteUso(e.target.value)}
                  placeholder="Ex: Títulos"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                />
              </div>
              <div className="min-w-[160px] flex-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  Link de referência (opcional)
                </label>
                <input
                  value={novaFonteUrl}
                  onChange={(e) => setNovaFonteUrl(e.target.value)}
                  placeholder="https://fonts.google.com/..."
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-wine px-3 py-2 text-sm font-medium text-off-white hover:opacity-90"
              >
                <Plus size={15} /> Adicionar
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-1 font-editorial text-lg font-semibold text-ink">
              Moodboard
            </h2>
            <p className="mb-4 text-xs text-ink/45">
              Imagens de referência visual e de estilo.
            </p>

            <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-off-white px-4 py-6 text-sm text-ink/50 hover:border-wine hover:text-wine">
              <UploadCloud size={18} />
              {enviando
                ? "Enviando..."
                : "Enviar imagens (pode selecionar várias de uma vez)"}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={selecionarImagensMoodboard}
                disabled={enviando}
              />
            </label>

            {moodboard.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {moodboard.map((imagem) => (
                  <div
                    key={imagem.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-off-white"
                  >
                    <img
                      src={imagem.url}
                      alt={imagem.nome_arquivo}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <button
                      onClick={() =>
                        handleExcluirImagem(imagem.id, imagem.nome_arquivo)
                      }
                      title="Excluir"
                      className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-bordeaux/80 px-2 py-1.5 text-[11px] font-medium text-off-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
