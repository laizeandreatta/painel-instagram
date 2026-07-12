"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { usePosts } from "@/lib/usePosts";
import { useAuth } from "@/lib/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { UploadArte } from "@/components/UploadArte";
import { CommentThread } from "@/components/CommentThread";
import {
  CATEGORIA_CORES,
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  PostStatus,
  STATUS_LABELS,
  STATUS_ORDER,
  TIPO_LABELS,
} from "@/lib/types";

export default function PostDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    posts,
    atualizarStatus,
    adicionarComentario,
    adicionarArte,
    atualizarIgMediaId,
    atualizarRoteiro,
    atualizarCategoria,
  } = usePosts();
  const { profile } = useAuth();

  const post = posts.find((p) => p.id === params.id);

  if (!post) {
    return (
      <div className="px-6 py-10 md:px-10">
        <p className="text-sm text-ink/50">Post não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-7 md:px-10">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 flex items-center gap-1.5 text-sm text-ink/50 hover:text-wine"
      >
        <ArrowLeft size={15} /> Voltar para o painel
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="mb-2 inline-block text-[11px] font-semibold uppercase tracking-wider text-wine">
            {TIPO_LABELS[post.tipo]} ·{" "}
            {format(new Date(post.data_publicacao), "dd 'de' MMMM, yyyy", {
              locale: ptBR,
            })}
          </span>
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">
            {post.titulo}
          </h1>
          {post.categoria && (
            <span
              style={{
                background: CATEGORIA_CORES[post.categoria].bg,
                color: CATEGORIA_CORES[post.categoria].text,
              }}
              className="mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium"
            >
              {CATEGORIA_LABELS[post.categoria]}
            </span>
          )}
        </div>
        <StatusBadge status={post.status} />
      </div>

      <div className="mb-8 grid gap-6 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
            Legenda
          </p>
          <p className="text-sm text-ink/80 whitespace-pre-wrap">
            {post.legenda || "—"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
            Hashtags
          </p>
          <p className="text-sm text-wine">{post.hashtags || "—"}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
            Responsável
          </p>
          <p className="text-sm text-ink/80">
            {post.responsavel_nome ?? "—"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
            Designer
          </p>
          <p className="text-sm text-ink/80">{post.designer_nome ?? "—"}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-line bg-white p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
          {post.tipo === "reels"
            ? "Roteiro do Reels"
            : post.tipo === "carrossel"
            ? "Conteúdo dos slides do carrossel"
            : "Roteiro / conteúdo"}
        </p>
        <p className="mb-2 text-xs text-ink/45">
          Fica salvo automaticamente ao clicar fora do campo.
        </p>
        <textarea
          key={post.id}
          defaultValue={post.roteiro ?? ""}
          onBlur={(e) => atualizarRoteiro(post.id, e.target.value)}
          rows={10}
          placeholder={
            post.tipo === "carrossel"
              ? "Slide 1: ...\nSlide 2: ...\nSlide 3: ..."
              : "Escreva aqui o roteiro completo ou o conteúdo de apoio."
          }
          className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
        />
      </div>

      <div className="mb-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">
          Alterar status
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              onClick={() => atualizarStatus(post.id, status)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                post.status === status
                  ? "border-wine bg-wine text-off-white"
                  : "border-line bg-white text-ink/60 hover:border-wine hover:text-wine"
              }`}
            >
              {STATUS_LABELS[status as PostStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/50">
          Alterar assunto
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIA_ORDER.map((valor) => {
            const cor = CATEGORIA_CORES[valor];
            const selecionado = post.categoria === valor;
            return (
              <button
                key={valor}
                onClick={() =>
                  atualizarCategoria(post.id, selecionado ? null : valor)
                }
                style={
                  selecionado ? { background: cor.bg, color: cor.text } : undefined
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

      {post.status === "publicado" && (
        <div className="mb-8 rounded-xl border border-line bg-white p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
            ID do post publicado no Instagram
          </p>
          <p className="mb-2 text-xs text-ink/45">
            Cole aqui o ID (ou link) do post publicado para que a análise de
            desempenho seja coletada automaticamente 24h depois.
          </p>
          <input
            defaultValue={post.ig_media_id ?? ""}
            onBlur={(e) => atualizarIgMediaId(post.id, e.target.value.trim())}
            placeholder="Ex: 17895695668004550 ou link do post"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
          />
        </div>
      )}

      <div className="mb-8">
        <UploadArte
          postId={post.id}
          artes={post.artes}
          enviadoPor={profile?.nome ?? "Você"}
          onEnviado={(url, nome) =>
            adicionarArte(post.id, url, nome, profile?.nome ?? "Você")
          }
        />
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <CommentThread
          comentarios={post.comentarios}
          autorNome={profile?.nome ?? "Você"}
          autorId={profile?.id ?? "anon"}
          onEnviar={(texto) =>
            adicionarComentario(
              post.id,
              texto,
              profile?.nome ?? "Você",
              profile?.id ?? "anon"
            )
          }
        />
      </div>
    </div>
  );
}
