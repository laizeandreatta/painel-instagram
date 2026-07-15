"use client";

import { CATEGORIA_CORES, CATEGORIA_LABELS, CATEGORIA_ORDER, Post } from "@/lib/types";

// Resumo do total de conteúdos cadastrados e do percentual de cada
// editoria, exibido no topo do Planejamento. Considera todo o conteúdo
// do painel, independente do status (ideia, em produção, agendado,
// postado etc.).
export function EstatisticasPosts({ posts }: { posts: Post[] }) {
  const total = posts.length;

  if (total === 0) return null;

  const porCategoria = CATEGORIA_ORDER.map((categoria) => {
    const quantidade = posts.filter((p) => p.categoria === categoria).length;
    return {
      categoria,
      quantidade,
      percentual: (quantidade / total) * 100,
    };
  })
    .filter((item) => item.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade);

  const semEditoria = posts.filter((p) => !p.categoria).length;

  return (
    <div className="mb-6 rounded-xl border border-line bg-white p-5">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-editorial text-2xl font-semibold text-ink">
          {total}
        </span>
        <span className="text-sm text-ink/50">
          {total === 1
            ? "conteúdo cadastrado no total"
            : "conteúdos cadastrados no total"}
        </span>
      </div>

      <div className="space-y-2.5">
        {porCategoria.map(({ categoria, quantidade, percentual }) => {
          const cor = CATEGORIA_CORES[categoria];
          return (
            <div key={categoria} className="flex items-center gap-3">
              <span
                className="w-52 shrink-0 truncate text-xs font-medium"
                style={{ color: cor.text }}
                title={CATEGORIA_LABELS[categoria]}
              >
                {CATEGORIA_LABELS[categoria]}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-off-white">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percentual}%`, background: cor.text }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs text-ink/50">
                {quantidade} · {percentual.toFixed(0)}%
              </span>
            </div>
          );
        })}

        {semEditoria > 0 && (
          <div className="flex items-center gap-3">
            <span className="w-52 shrink-0 truncate text-xs font-medium text-ink/40">
              Sem editoria
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-off-white">
              <div
                className="h-full rounded-full bg-ink/20"
                style={{ width: `${(semEditoria / total) * 100}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-xs text-ink/50">
              {semEditoria} · {((semEditoria / total) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
