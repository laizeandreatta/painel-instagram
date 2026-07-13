"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { Post, TIPO_LABELS } from "@/lib/types";

const TIPO_DOT: Record<string, string> = {
  estatico: "bg-wine",
  reel: "bg-bordeaux",
  carrossel: "bg-[#c99b3f]",
};

export function CalendarView({ posts }: { posts: Post[] }) {
  const [mesAtual, setMesAtual] = useState(new Date());

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesAtual]);

  const postsPorDia = useMemo(() => {
    const mapa = new Map<string, Post[]>();
    posts.forEach((p) => {
      const chave = format(new Date(p.data_publicacao), "yyyy-MM-dd");
      mapa.set(chave, [...(mapa.get(chave) ?? []), p]);
    });
    return mapa;
  }, [posts]);

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-editorial text-xl font-semibold capitalize text-ink">
          {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMesAtual((d) => subMonths(d, 1))}
            className="rounded-lg border border-line p-1.5 text-ink/60 hover:bg-baby-pink-light"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMesAtual(new Date())}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink/60 hover:bg-baby-pink-light"
          >
            Hoje
          </button>
          <button
            onClick={() => setMesAtual((d) => addMonths(d, 1))}
            className="rounded-lg border border-line p-1.5 text-ink/60 hover:bg-baby-pink-light"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-line text-center text-[11px] font-medium uppercase tracking-wide text-ink/40">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="bg-off-white py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border border-t-0 border-line bg-line">
        {dias.map((dia) => {
          const chave = format(dia, "yyyy-MM-dd");
          const postsDoDia = postsPorDia.get(chave) ?? [];
          const foraDoMes = !isSameMonth(dia, mesAtual);
          return (
            <div
              key={chave}
              className={clsx(
                "min-h-[110px] bg-white p-2 text-left",
                foraDoMes && "bg-off-white/60"
              )}
            >
              <span
                className={clsx(
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isSameDay(dia, new Date())
                    ? "bg-wine text-off-white"
                    : foraDoMes
                    ? "text-ink/25"
                    : "text-ink/60"
                )}
              >
                {format(dia, "d")}
              </span>
              <div className="flex flex-col gap-1">
                {postsDoDia.slice(0, 3).map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    title={post.titulo}
                    className="flex items-center gap-1.5 truncate rounded-md bg-off-white px-1.5 py-1 text-[11px] text-ink/70 hover:bg-baby-pink-light"
                  >
                    <span
                      className={clsx(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        TIPO_DOT[post.tipo]
                      )}
                    />
                    <span className="shrink-0 text-ink/40">
                      {format(new Date(post.data_publicacao), "HH:mm")}
                    </span>
                    <span className="truncate">{post.titulo}</span>
                  </Link>
                ))}
                {postsDoDia.length > 3 && (
                  <span className="px-1.5 text-[10px] text-ink/40">
                    +{postsDoDia.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink/50">
        {Object.entries(TIPO_LABELS).map(([tipo, label]) => (
          <span key={tipo} className="flex items-center gap-1.5">
            <span className={clsx("h-2 w-2 rounded-full", TIPO_DOT[tipo])} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
