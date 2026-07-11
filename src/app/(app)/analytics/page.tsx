"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAnalytics } from "@/lib/useAnalytics";
import { usePosts } from "@/lib/usePosts";
import { TrendingUp, Users } from "lucide-react";

export default function AnalyticsPage() {
  const { analises, seguidores, demoMode } = useAnalytics();
  const { posts } = usePosts();

  const dadosSeguidores = seguidores.map((s) => ({
    data: format(new Date(s.data), "dd/MM"),
    seguidores: s.seguidores,
  }));

  const crescimento =
    seguidores.length >= 2
      ? seguidores[seguidores.length - 1].seguidores - seguidores[0].seguidores
      : 0;

  const dadosPosts = analises
    .map((a) => {
      const post = posts.find((p) => p.id === a.post_id);
      return {
        titulo: post?.titulo ?? a.post_id,
        curtidas: a.curtidas,
        comentarios: a.comentarios,
        alcance: a.alcance,
        salvamentos: a.salvamentos,
      };
    })
    .slice(0, 8);

  const totalAlcance = analises.reduce((acc, a) => acc + a.alcance, 0);
  const totalCurtidas = analises.reduce((acc, a) => acc + a.curtidas, 0);
  const engajamentoMedio =
    analises.length > 0
      ? Math.round(
          (analises.reduce(
            (acc, a) => acc + a.curtidas + a.comentarios + a.compartilhamentos,
            0
          ) /
            analises.length) *
            10
        ) / 10
      : 0;

  return (
    <div className="px-6 py-7 md:px-10">
      <div className="mb-7">
        <h1 className="font-editorial text-2xl font-semibold text-ink md:text-3xl">
          Desempenho
        </h1>
        <p className="text-sm text-ink/50">
          Resultados coletados automaticamente 24h após cada publicação, e
          evolução de seguidores da conta.
        </p>
        {demoMode && (
          <p className="mt-2 inline-block rounded-lg border border-baby-pink bg-baby-pink-light px-3 py-1.5 text-xs text-bordeaux">
            Modo demonstração — conecte a API do Instagram para ver dados
            reais (veja o README).
          </p>
        )}
      </div>

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-ink/50">
            <Users size={14} /> Seguidores
          </div>
          <p className="font-editorial text-2xl font-semibold text-ink">
            {seguidores.at(-1)?.seguidores?.toLocaleString("pt-BR") ?? "—"}
          </p>
          <p className={`text-xs ${crescimento >= 0 ? "text-wine" : "text-ink/50"}`}>
            {crescimento >= 0 ? "+" : ""}
            {crescimento.toLocaleString("pt-BR")} nos últimos {seguidores.length} dias
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-ink/50">
            <TrendingUp size={14} /> Alcance total
          </div>
          <p className="font-editorial text-2xl font-semibold text-ink">
            {totalAlcance.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-ink/45">{totalCurtidas.toLocaleString("pt-BR")} curtidas somadas</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-ink/50">
            <TrendingUp size={14} /> Engajamento médio / post
          </div>
          <p className="font-editorial text-2xl font-semibold text-ink">
            {engajamentoMedio.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-ink/45">curtidas + comentários + compartilhamentos</p>
        </div>
      </div>

      <div className="mb-7 rounded-xl border border-line bg-white p-5">
        <h2 className="mb-4 font-editorial text-lg font-semibold text-ink">
          Crescimento de seguidores
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dadosSeguidores}>
            <defs>
              <linearGradient id="corSeguidores" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6d1f30" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6d1f30" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7dcd6" />
            <XAxis dataKey="data" tick={{ fontSize: 12, fill: "#1a121399" }} />
            <YAxis tick={{ fontSize: 12, fill: "#1a121399" }} width={50} />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e7dcd6",
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="seguidores"
              stroke="#6d1f30"
              strokeWidth={2}
              fill="url(#corSeguidores)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <h2 className="mb-4 font-editorial text-lg font-semibold text-ink">
          Desempenho por post (24h após publicação)
        </h2>
        {dadosPosts.length === 0 ? (
          <p className="text-sm text-ink/45">
            Ainda não há posts com análise coletada.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosPosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7dcd6" />
              <XAxis
                dataKey="titulo"
                tick={{ fontSize: 11, fill: "#1a121399" }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={70}
              />
              <YAxis tick={{ fontSize: 12, fill: "#1a121399" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e7dcd6",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="curtidas" fill="#6d1f30" radius={[4, 4, 0, 0]} />
              <Bar dataKey="alcance" fill="#f4cdd7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="salvamentos" fill="#4a1220" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
