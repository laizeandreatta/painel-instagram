import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageIcon, MessageCircle } from "lucide-react";
import { CATEGORIA_CORES, CATEGORIA_LABELS, Post, TIPO_LABELS } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function PostCard({ post }: { post: Post }) {
  const cor = post.categoria ? CATEGORIA_CORES[post.categoria] : null;
  return (
    <Link
      href={`/post/${post.id}`}
      className="group block rounded-xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-wine">
          {TIPO_LABELS[post.tipo]}
        </span>
        <StatusBadge status={post.status} />
      </div>
      <h3 className="mb-1 text-base font-semibold leading-snug text-ink group-hover:text-wine">
        {post.titulo}
      </h3>
      {post.categoria && cor && (
        <span
          style={{ background: cor.bg, color: cor.text }}
          className="mb-2 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium"
        >
          {CATEGORIA_LABELS[post.categoria]}
        </span>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-ink/45">
        <span>
          {format(new Date(post.data_publicacao), "dd 'de' MMM", {
            locale: ptBR,
          })}
        </span>
        <span className="flex items-center gap-3">
          {post.artes.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon size={13} /> {post.artes.length}
            </span>
          )}
          {post.comentarios.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle size={13} /> {post.comentarios.length}
            </span>
          )}
        </span>
      </div>
      {post.designer_nome && (
        <div className="mt-3 border-t border-line pt-2 text-xs text-ink/45">
          Designer: <span className="text-ink/70">{post.designer_nome}</span>
        </div>
      )}
    </Link>
  );
}
