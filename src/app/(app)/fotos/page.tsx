"use client";

import { useRef, useState } from "react";
import { Download, Trash2, UploadCloud } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { useFotos } from "@/lib/useFotos";
import { useAuth } from "@/lib/useAuth";

export default function FotosPage() {
  const { fotos, loading, adicionarFoto, excluirFoto } = useFotos();
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function selecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
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
          .from("fotos")
          .upload(caminho, arquivo);
        if (!error) {
          const { data } = supabase.storage.from("fotos").getPublicUrl(caminho);
          await adicionarFoto(data.publicUrl, arquivo.name, enviadoPor);
        }
      } else {
        const url = URL.createObjectURL(arquivo);
        await adicionarFoto(url, arquivo.name, enviadoPor);
      }
    }

    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleExcluir(id: string, nomeArquivo: string) {
    const confirmado = window.confirm(
      `Excluir "${nomeArquivo}"? Não pode ser desfeito.`
    );
    if (!confirmado) return;
    excluirFoto(id);
  }

  return (
    <div className="px-6 py-7 md:px-10">
      <div className="mb-7">
        <h1 className="font-editorial text-2xl font-semibold text-ink md:text-3xl">
          Minhas fotos
        </h1>
        <p className="text-sm text-ink/50">
          Banco de imagens compartilhado com a equipe — envie fotos aqui para
          que a designer tenha acesso direto a elas, sem precisar vincular a
          um conteúdo específico.
        </p>
      </div>

      <label className="mb-7 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white px-4 py-8 text-sm text-ink/50 hover:border-wine hover:text-wine">
        <UploadCloud size={18} />
        {enviando
          ? "Enviando..."
          : "Enviar fotos (pode selecionar várias de uma vez)"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={selecionarArquivos}
          disabled={enviando}
        />
      </label>

      {loading ? (
        <p className="text-sm text-ink/50">Carregando fotos...</p>
      ) : fotos.length === 0 ? (
        <p className="text-sm text-ink/50">Nenhuma foto enviada ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-white"
            >
              <a
                href={foto.url}
                target="_blank"
                rel="noreferrer"
                className="block h-full w-full"
              >
                <img
                  src={foto.url}
                  alt={foto.nome_arquivo}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
              <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={`${foto.url}?download=${encodeURIComponent(
                    foto.nome_arquivo
                  )}`}
                  title="Baixar em alta resolução"
                  className="flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1.5 text-[11px] font-medium text-off-white backdrop-blur-sm"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => handleExcluir(foto.id, foto.nome_arquivo)}
                  title="Excluir"
                  className="flex items-center gap-1 rounded-full bg-bordeaux/80 px-2 py-1.5 text-[11px] font-medium text-off-white backdrop-blur-sm"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
