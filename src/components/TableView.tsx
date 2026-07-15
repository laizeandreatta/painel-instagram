"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImageIcon,
  MessageCircle,
} from "lucide-react";
import {
  CATEGORIA_CORES,
  CATEGORIA_LABELS,
  Post,
  TIPO_LABELS,
} from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

type Coluna =
  | "ordem"
  | "titulo"
  | "data_publicacao"
  | "responsavel_nome"
  | "designer_nome";

const COLUNAS: { chave: Coluna; label: string }[] = [
  { chave: "ordem", label: "Ordem" },
  { chave: "titulo", label: "Título" },
  { chave: "data_publicacao", label: "Publicação" },
  { chave: "responsavel_nome", label: "Responsável" },
  { chave: "designer_nome", label: "Designer" },
];

function celulas(post: Post, posicao: number) {
  const cor = post.categoria ? CATEGORIA_CORES[post.categoria] : null;
  return (
    <>
      <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums text-ink/40">
        {posicao}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
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
      <td className="px-4 py-3 text-ink/70">{post.designer_nome ?? "—"}</td>
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
    </>
  );
}

function LinhaArrastavel({ post, posicao }: { post: Post; posicao: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-line bg-white last:border-b-0 hover:bg-baby-pink-light/40"
    >
      <td className="px-3 py-3 text-ink/30">
        <button
          {...attributes}
          {...listeners}
          title="Arrastar para reordenar"
          className="flex cursor-grab items-center justify-center rounded p-1 hover:bg-off-white hover:text-wine active:cursor-grabbing"
        >
          <GripVertical size={15} />
        </button>
      </td>
      {celulas(post, posicao)}
    </tr>
  );
}

function LinhaEstatica({ post, posicao }: { post: Post; posicao: number }) {
  return (
    <tr className="border-b border-line last:border-b-0 hover:bg-baby-pink-light/40">
      <td className="px-3 py-3" />
      {celulas(post, posicao)}
    </tr>
  );
}

export function TableView({
  posts,
  onReordenarPost,
}: {
  posts: Post[];
  onReordenarPost: (postId: string, novaOrdem: number) => void;
}) {
  const [ordenarPor, setOrdenarPor] = useState<Coluna>("ordem");
  const [ordemAsc, setOrdemAsc] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

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
      if (ordenarPor === "ordem") {
        const comparacao = (a.ordem ?? 0) - (b.ordem ?? 0);
        return ordemAsc ? comparacao : -comparacao;
      }
      const valorA = (a[ordenarPor] ?? "") as string;
      const valorB = (b[ordenarPor] ?? "") as string;
      const comparacao = valorA.localeCompare(valorB, "pt-BR");
      return ordemAsc ? comparacao : -comparacao;
    });
    return copia;
  }, [posts, ordenarPor, ordemAsc]);

  // Arrastar só faz sentido quando a lista está exibindo a ordem manual
  // (senão a posição visual não bateria com a ordem que seria salva).
  const arrastavel = ordenarPor === "ordem" && ordemAsc;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = postsOrdenados.findIndex((p) => p.id === active.id);
    const newIndex = postsOrdenados.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const novaLista = arrayMove(postsOrdenados, oldIndex, newIndex);
    const anterior = novaLista[newIndex - 1];
    const seguinte = novaLista[newIndex + 1];

    let novaOrdem: number;
    if (anterior && seguinte) {
      novaOrdem = ((anterior.ordem ?? 0) + (seguinte.ordem ?? 0)) / 2;
    } else if (anterior && !seguinte) {
      novaOrdem = (anterior.ordem ?? 0) + 1;
    } else if (!anterior && seguinte) {
      novaOrdem = (seguinte.ordem ?? 0) - 1;
    } else {
      novaOrdem = 1;
    }

    onReordenarPost(String(active.id), novaOrdem);
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-ink/40">
        Nenhum conteúdo cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      {arrastavel && (
        <p className="border-b border-line bg-off-white px-4 py-2 text-xs text-ink/45">
          Arraste pelo ícone ⠿ para reordenar os conteúdos manualmente.
        </p>
      )}
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-off-white text-xs uppercase tracking-wide text-ink/50">
            <th className="w-8 px-3 py-3" />
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
        {arrastavel ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={postsOrdenados.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {postsOrdenados.map((post, index) => (
                  <LinhaArrastavel key={post.id} post={post} posicao={index + 1} />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        ) : (
          <tbody>
            {postsOrdenados.map((post, index) => (
              <LinhaEstatica key={post.id} post={post} posicao={index + 1} />
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}
