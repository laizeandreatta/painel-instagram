"use client";

import { useState } from "react";
import clsx from "clsx";
import { usePosts } from "@/lib/usePosts";
import { KanbanBoard } from "@/components/KanbanBoard";
import { CalendarView } from "@/components/CalendarView";
import { TableView } from "@/components/TableView";
import { NewPostDialog } from "@/components/NewPostDialog";
import { useAuth } from "@/lib/useAuth";

export default function DashboardPage() {
  const { posts, atualizarStatus, criarPost, atualizarOrdem, loading } =
    usePosts();
  const { profile } = useAuth();
  const [visao, setVisao] = useState<"kanban" | "tabela" | "calendario">(
    "kanban"
  );

  return (
    <div className="px-6 py-7 md:px-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-2xl font-semibold text-ink md:text-3xl">
            Planejamento de conteúdo
          </h1>
          <p className="text-sm text-ink/50">
            Organize, produza e aprove os conteúdos do Instagram com a
            equipe.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-line bg-white p-1">
            <button
              onClick={() => setVisao("kanban")}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                visao === "kanban"
                  ? "bg-wine text-off-white"
                  : "text-ink/60 hover:text-ink"
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setVisao("tabela")}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                visao === "tabela"
                  ? "bg-wine text-off-white"
                  : "text-ink/60 hover:text-ink"
              )}
            >
              Tabela
            </button>
            <button
              onClick={() => setVisao("calendario")}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                visao === "calendario"
                  ? "bg-wine text-off-white"
                  : "text-ink/60 hover:text-ink"
              )}
            >
              Calendário
            </button>
          </div>
          <NewPostDialog
            responsavelPadrao={profile?.nome ?? ""}
            onCreate={(dados) => criarPost(dados)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink/50">Carregando conteúdos...</p>
      ) : visao === "kanban" ? (
        <KanbanBoard posts={posts} onStatusChange={atualizarStatus} />
      ) : visao === "tabela" ? (
        <TableView posts={posts} onReordenarPost={atualizarOrdem} />
      ) : (
        <CalendarView posts={posts} />
      )}
    </div>
  );
}
