import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageIcon, MessageCircle } from "lucide-react";
import { Post, TIPO_LABELS } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function PostCard({ post }: { post: Post }) {
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
      <h3 className="mb-1 font-editorial text-base font-semibold leading-snug text-ink group-hover:text-wine">
        {post.titulo}
      </h3>
      <p className="mb-3 line-clamp-2 text-sm text-ink/60">{post.legenda}</p>
      <div className="flex items-center justify-between text-xs text-ink/45">
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
