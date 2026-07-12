"use client";

import { useRef, useState } from "react";
import { Download, UploadCloud } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { ArteUpload } from "@/lib/types";

export function UploadArte({
  postId,
  artes,
  enviadoPor,
  onEnviado,
}: {
  postId: string;
  artes: ArteUpload[];
  enviadoPor: string;
  onEnviado: (url: string, nomeArquivo: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEnviando(true);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const caminho = `${postId}/${Date.now()}-${arquivo.name}`;
      const { error } = await supabase.storage
        .from("artes")
        .upload(caminho, arquivo);
      if (!error) {
        const { data } = supabase.storage.from("artes").getPublicUrl(caminho);
        onEnviado(data.publicUrl, arquivo.name);
      }
    } else {
      // Modo demo: usa uma URL local temporária (não persiste após recarregar).
      const url = URL.createObjectURL(arquivo);
      onEnviado(url, arquivo.name);
    }

    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <h3 className="mb-1 font-editorial text-lg font-semibold text-ink">
        Artes ({artes.length})
      </h3>
      {artes.length > 0 && (
        <p className="mb-3 text-xs text-ink/45">
          O arquivo original enviado fica sempre disponível. Passe o mouse
          sobre a arte e clique em &quot;Baixar&quot; para salvar em alta
          resolução.
        </p>
      )}

      {artes.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {artes.map((arte) => (
            <div
              key={arte.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-off-white"
            >
              <a href={arte.url} target="_blank" rel="noreferrer" className="block h-full w-full">
                <img
                  src={arte.url}
                  alt={arte.nome_arquivo}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
              <a
                href={`${arte.url}?download=${encodeURIComponent(arte.nome_arquivo)}`}
                title="Baixar em alta resolução"
                className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1.5 text-[11px] font-medium text-off-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <Download size={13} /> Baixar
              </a>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-off-white px-4 py-6 text-sm text-ink/50 hover:border-wine hover:text-wine">
        <UploadCloud size={18} />
        {enviando ? "Enviando..." : `Enviar arte como ${enviadoPor}`}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={selecionarArquivo}
          disabled={enviando}
        />
      </label>
    </div>
  );
}
