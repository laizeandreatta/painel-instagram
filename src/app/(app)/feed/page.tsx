"use client";

import Link from "next/link";
import { ImageIcon, Clapperboard, Layers, Download } from "lucide-react";
import { usePosts } from "@/lib/usePosts";
import { Post } from "@/lib/types";

function primeiraArte(post: Post) {
  return post.artes[0] ?? null;
}

function IconeTipo({ post }: { post: Post }) {
  if (post.tipo === "reel") return <Clapperboard size={14} />;
  if (post.tipo === "carrossel") return <Layers size={14} />;
  return null;
}

export default function FeedPage() {
  const { posts, loading } = usePosts();

  const feedPosts = posts
    .filter((p) => p.status === "agendado" || p.status === "postado")
    .sort(
      (a, b) =>
        new Date(b.data_publicacao).getTime() -
        new Date(a.data_publicacao).getTime()
    );

  return (
    <div className="px-6 py-7 md:px-10">
      <div className="mb-7">
        <h1 className="font-editorial text-2xl font-semibold text-ink md:text-3xl">
          Preview do Feed
        </h1>
        <p className="text-sm text-ink/50">
          Assim vai ficando o feed conforme as artes são enviadas e os posts
          passam para &quot;Agendado&quot; ou &quot;Postado&quot;.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-ink/50">Carregando conteúdos...</p>
      ) : feedPosts.length === 0 ? (
        <p className="text-sm text-ink/50">
          Nenhum post agendado ou postado ainda. Assim que um post tiver arte
          e estiver marcado como &quot;Agendado&quot;, ele aparece aqui.
        </p>
      ) : (
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1 sm:gap-1.5">
          {feedPosts.map((post) => {
            const arte = primeiraArte(post);
            return (
              <div
                key={post.id}
                className="group relative aspect-square overflow-hidden bg-off-white"
              >
                <Link href={`/post/${post.id}`} className="absolute inset-0">
                  {arte ? (
                    <img
                      src={arte.url}
                      alt={post.titulo}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-line px-2 text-center">
                      <ImageIcon size={18} className="text-ink/30" />
                      <span className="line-clamp-2 text-[10.5px] text-ink/40">
                        {post.titulo}
                      </span>
                    </div>
                  )}
                </Link>

                {(post.tipo === "reel" || post.tipo === "carrossel") && (
                  <span className="pointer-events-none absolute right-1.5 top-1.5 text-off-white drop-shadow">
                    <IconeTipo post={post} />
                  </span>
                )}

                {post.status === "agendado" && (
                  <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-ink/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-off-white backdrop-blur-sm">
                    Agendado
                  </span>
                )}

                {arte && (
                  <a
                    href={`${arte.url}?download=${encodeURIComponent(
                      arte.nome_arquivo
                    )}`}
                    title="Baixar em alta resolução"
                    className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-[10px] font-medium text-off-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                  >
                    <Download size={11} /> Baixar
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
