"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Trash2 } from "lucide-react";
import { usePosts } from "@/lib/usePosts";
import { useAuth } from "@/lib/useAuth";
import { useTeam } from "@/lib/useTeam";
import { StatusBadge } from "@/components/StatusBadge";
import { UploadArte } from "@/components/UploadArte";
import { CommentThread } from "@/components/CommentThread";
import { handlePasteUncontrolled } from "@/lib/textUtils";
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
    excluirArte,
    atualizarIgMediaId,
    atualizarRoteiro,
    atualizarCategoria,
    atualizarCampos,
    excluirPost,
  } = usePosts();
  const { profile } = useAuth();
  const equipe = useTeam();

  const post = posts.find((p) => p.id === params.id);

  if (!post) {
    return (
      <div className="px-6 py-10 md:px-10">
        <p className="text-sm text-ink/50">Post não encontrado.</p>
      </div>
    );
  }

  function handleExcluir() {
    if (!post) return;
    const confirmado = window.confirm(
      `Excluir "${post.titulo}"? Isso remove o conteúdo, as artes e os comentários e não pode ser desfeito.`
    );
    if (!confirmado) return;
    excluirPost(post.id);
    router.push("/dashboard");
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
            {format(new Date(post.data_publicacao), "dd 'de' MMMM, yyyy 'às' HH:mm", {
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

      <div className="mb-8 rounded-xl border border-line bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
              Responsável
            </label>
            <select
              value={post.responsavel_nome ?? ""}
              onChange={(e) =>
                atualizarCampos(post.id, {
                  responsavel_nome: e.target.value || null,
                })
              }
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
            >
              <option value="">—</option>
              {equipe.map((membro) => (
                <option key={membro.id} value={membro.nome}>
                  {membro.nome}
                </option>
              ))}
              {post.responsavel_nome &&
                !equipe.some((m) => m.nome === post.responsavel_nome) && (
                  <option value={post.responsavel_nome}>
                    {post.responsavel_nome}
                  </option>
                )}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
              Designer
            </label>
            <select
              value={post.designer_nome ?? ""}
              onChange={(e) =>
                atualizarCampos(post.id, {
                  designer_nome: e.target.value || null,
                })
              }
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
            >
              <option value="">—</option>
              {equipe.map((membro) => (
                <option key={membro.id} value={membro.nome}>
                  {membro.nome}
                </option>
              ))}
              {post.designer_nome &&
                !equipe.some((m) => m.nome === post.designer_nome) && (
                  <option value={post.designer_nome}>
                    {post.designer_nome}
                  </option>
                )}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
              Data de publicação
            </label>
            <input
              key={`data-${post.id}`}
              type="date"
              defaultValue={format(new Date(post.data_publicacao), "yyyy-MM-dd")}
              onBlur={(e) => {
                const horaAtual = format(new Date(post.data_publicacao), "HH:mm");
                atualizarCampos(post.id, {
                  data_publicacao: new Date(
                    `${e.target.value}T${horaAtual}`
                  ).toISOString(),
                });
              }}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
              Horário de publicação
            </label>
            <input
              key={`hora-${post.id}`}
              type="time"
              defaultValue={format(new Date(post.data_publicacao), "HH:mm")}
              onBlur={(e) => {
                const dataAtual = format(new Date(post.data_publicacao), "yyyy-MM-dd");
                atualizarCampos(post.id, {
                  data_publicacao: new Date(
                    `${dataAtual}T${e.target.value}`
                  ).toISOString(),
                });
              }}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-line bg-white p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
          {post.tipo === "reel"
            ? "Roteiro do Reel"
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
          onPaste={handlePasteUncontrolled}
          rows={10}
          placeholder={
            post.tipo === "carrossel"
              ? "Slide 1: ...\nSlide 2: ...\nSlide 3: ..."
              : "Escreva aqui o roteiro completo ou o conteúdo de apoio."
          }
          className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
        />
      </div>

      <div className="mb-8 rounded-xl border border-line bg-white p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink/50">
          Legenda
        </p>
        <p className="mb-2 text-xs text-ink/45">
          Fica salva automaticamente ao clicar fora do campo.
        </p>
        <textarea
          key={`legenda-${post.id}`}
          defaultValue={post.legenda}
          onBlur={(e) => atualizarCampos(post.id, { legenda: e.target.value })}
          onPaste={handlePasteUncontrolled}
          rows={3}
          placeholder="Escreva a legenda do post..."
          className="mb-4 w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-wine"
        />

        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
          Hashtags
        </label>
        <input
          key={`hashtags-${post.id}`}
          defaultValue={post.hashtags}
          onBlur={(e) => atualizarCampos(post.id, { hashtags: e.target.value })}
          placeholder="#moda #lancamento"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm text-wine outline-none focus:border-wine"
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

      {post.status === "postado" && (
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
          onExcluir={(arteId) => excluirArte(post.id, arteId)}
        />
      </div>

      <div className="mb-8 rounded-xl border border-line bg-white p-5">
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

      <div className="rounded-xl border border-bordeaux/30 bg-bordeaux/5 p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-bordeaux">
          Excluir conteúdo
        </p>
        <p className="mb-3 text-xs text-ink/45">
          Remove este conteúdo, as artes enviadas e os comentários por
          completo. Não pode ser desfeito.
        </p>
        <button
          onClick={handleExcluir}
          className="flex items-center gap-1.5 rounded-lg border border-bordeaux px-3 py-1.5 text-xs font-medium text-bordeaux transition-colors hover:bg-bordeaux hover:text-off-white"
        >
          <Trash2 size={14} /> Excluir conteúdo
        </button>
      </div>
    </div>
  );
}
