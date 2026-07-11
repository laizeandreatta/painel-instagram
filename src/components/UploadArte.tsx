"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
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
      <h3 className="mb-3 font-editorial text-lg font-semibold text-ink">
        Artes ({artes.length})
      </h3>

      {artes.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {artes.map((arte) => (
            <a
              key={arte.id}
              href={arte.url}
              target="_blank"
              rel="noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-lg border border-line bg-off-white"
            >
              <img
                src={arte.url}
                alt={arte.nome_arquivo}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </a>
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
