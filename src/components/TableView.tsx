"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDown, ArrowUp, ImageIcon, MessageCircle } from "lucide-react";
import {
  CATEGORIA_CORES,
  CATEGORIA_LABELS,
  Post,
  TIPO_LABELS,
} from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

type Coluna = "titulo" | "data_publicacao" | "responsavel_nome" | "designer_nome";

const COLUNAS: { chave: Coluna; label: string }[] = [
  { chave: "titulo", label: "Título" },
  { chave: "data_publicacao", label: "Publicação" },
  { chave: "responsavel_nome", label: "Responsável" },
  { chave: "designer_nome", label: "Designer" },
];

export function TableView({ posts }: { posts: Post[] }) {
  const [ordenarPor, setOrdenarPor] = useState<Coluna>("data_publicacao");
  const [ordemAsc, setOrdemAsc] = useState(true);

  function alternarOrdenacao(coluna: Coluna) {
    if (ordenarPor === coluna) {
      setOrdemAsc((v) => !v);
    } else {
      setOrdenarPor(coluna);
      setOrdemAsc(true);
    }
  }

  const postsOrdenados = useMemo(() => {
    const copia = [...posts];
    copia.sort((a, b) => {
      const valorA = (a[ordenarPor] ?? "") as string;
      const valorB = (b[ordenarPor] ?? "") as string;
      const comparacao = valorA.localeCompare(valorB, "pt-BR");
      return ordemAsc ? comparacao : -comparacao;
    });
    return copia;
  }, [posts, ordenarPor, ordemAsc]);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink/40">
        Nenhum conteúdo cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-off-white text-xs uppercase tracking-wide text-ink/50">
            {COLUNAS.map((coluna) => (
              <th key={coluna.chave} className="px-4 py-3 font-medium">
                <button
                  onClick={() => alternarOrdenacao(coluna.chave)}
                  className="flex items-center gap-1 hover:text-wine"
                >
                  {coluna.label}
                  {ordenarPor === coluna.chave &&
                    (ordemAsc ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    ))}
                </button>
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Assunto</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Conteúdo</th>
          </tr>
        </thead>
        <tbody>
          {postsOrdenados.map((post) => {
            const cor = post.categoria ? CATEGORIA_CORES[post.categoria] : null;
            return (
              <tr
                key={post.id}
                className="border-b border-line last:border-b-0 hover:bg-baby-pink-light/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/post/${post.id}`}
                    className="font-medium text-ink hover:text-wine"
                  >
                    {post.titulo}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                  {format(new Date(post.data_publicacao), "dd 'de' MMM, HH:mm", {
                    locale: ptBR,
                  })}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {post.responsavel_nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {post.designer_nome ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                  {TIPO_LABELS[post.tipo]}
                </td>
                <td className="px-4 py-3">
                  {post.categoria && cor ? (
                    <span
                      style={{ background: cor.bg, color: cor.text }}
                      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                    >
                      {CATEGORIA_LABELS[post.categoria]}
                    </span>
                  ) : (
                    <span className="text-ink/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={post.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink/45">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ImageIcon size={13} /> {post.artes.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={13} /> {post.comentarios.length}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
