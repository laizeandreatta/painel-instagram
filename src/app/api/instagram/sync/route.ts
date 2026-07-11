import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

/**
 * Rota de sincronização com o Instagram (Meta Graph API).
 *
 * O que ela faz, uma vez por dia (chamada por um Vercel Cron Job, veja
 * vercel.json):
 *
 *  1. Busca o número atual de seguidores da conta profissional do
 *     Instagram e salva um "retrato" na tabela seguidores_historico,
 *     para montar o gráfico de crescimento.
 *
 *  2. Para cada post com status "publicado", data de publicação há
 *     mais de 24h e que tenha um ig_media_id preenchido (colado na
 *     página do post), busca as métricas de desempenho (curtidas,
 *     comentários, alcance, impressões, salvamentos) e salva na
 *     tabela analises_posts — só faz isso uma vez por post.
 *
 * Requer as variáveis de ambiente:
 *  - IG_ACCESS_TOKEN: token de acesso de longa duração da conta.
 *  - IG_BUSINESS_ACCOUNT_ID: ID da conta profissional do Instagram.
 *  - CRON_SECRET: senha simples para proteger essa rota.
 *
 * Veja o README para o passo a passo de como conseguir essas
 * informações no painel de desenvolvedores da Meta.
 */

const GRAPH_VERSION = "v21.0";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const accessToken = process.env.IG_ACCESS_TOKEN;
  const igAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !igAccountId) {
    return NextResponse.json(
      {
        erro:
          "Defina IG_ACCESS_TOKEN e IG_BUSINESS_ACCOUNT_ID nas variáveis de ambiente.",
      },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const resultado = { seguidores: false, posts_analisados: 0, erros: [] as string[] };

  // 1. Seguidores
  try {
    const resp = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${igAccountId}?fields=followers_count&access_token=${accessToken}`
    );
    const json = await resp.json();
    if (json.followers_count !== undefined) {
      await supabase.from("seguidores_historico").insert({
        data: new Date().toISOString(),
        seguidores: json.followers_count,
      });
      resultado.seguidores = true;
    } else {
      resultado.erros.push(`Seguidores: ${JSON.stringify(json)}`);
    }
  } catch (e) {
    resultado.erros.push(`Seguidores: ${String(e)}`);
  }

  // 2. Desempenho dos posts publicados há mais de 24h
  const vinteQuatroHorasAtras = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, ig_media_id, tipo")
    .eq("status", "publicado")
    .lte("data_publicacao", vinteQuatroHorasAtras)
    .not("ig_media_id", "is", null);

  const { data: jaAnalisados } = await supabase
    .from("analises_posts")
    .select("post_id");
  const idsAnalisados = new Set((jaAnalisados ?? []).map((a) => a.post_id));

  for (const post of posts ?? []) {
    if (idsAnalisados.has(post.id) || !post.ig_media_id) continue;

    try {
      // Métricas variam por tipo de mídia. Esse conjunto cobre feed/carrossel/reels.
      const metricas = "impressions,reach,saved,likes,comments,shares";
      const resp = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${post.ig_media_id}/insights?metric=${metricas}&access_token=${accessToken}`
      );
      const json = await resp.json();

      if (json.error) {
        resultado.erros.push(`Post ${post.id}: ${json.error.message}`);
        continue;
      }

      const valores: Record<string, number> = {};
      for (const item of json.data ?? []) {
        valores[item.name] = item.values?.[0]?.value ?? 0;
      }

      await supabase.from("analises_posts").insert({
        post_id: post.id,
        coletado_em: new Date().toISOString(),
        curtidas: valores.likes ?? 0,
        comentarios: valores.comments ?? 0,
        compartilhamentos: valores.shares ?? 0,
        salvamentos: valores.saved ?? 0,
        alcance: valores.reach ?? 0,
        impressoes: valores.impressions ?? 0,
      });
      resultado.posts_analisados += 1;
    } catch (e) {
      resultado.erros.push(`Post ${post.id}: ${String(e)}`);
    }
  }

  return NextResponse.json(resultado);
}
