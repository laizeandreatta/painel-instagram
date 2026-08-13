import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

/**
 * Rota pública chamada pelo formulário de aplicação do Método Reputação
 * que Vende (aplicacao-reputacao.html, hospedado na HostGator em
 * www.laizeandreatta.com.br) sempre que alguém envia o formulário.
 * Cria (ou atualiza, se já existir pelo telefone) um lead na tabela
 * leads_reputacao, já na etapa "novo" do funil. O agendamento na agenda
 * do Google é conferido depois, separadamente, pela rota
 * /api/calendar/sync.
 *
 * Como o formulário roda em outro domínio (fora do painel), a rota
 * precisa responder com cabeçalhos de CORS liberando esse domínio.
 */

const ORIGENS_PERMITIDAS = [
  "https://www.laizeandreatta.com.br",
  "https://laizeandreatta.com.br",
];

function corsHeaders(origin: string | null) {
  const permitido =
    origin && ORIGENS_PERMITIDAS.includes(origin) ? origin : ORIGENS_PERMITIDAS[0];
  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const dados = await request.json();

    const nome = String(dados.nome ?? "").trim();
    const email = String(dados.email ?? "").trim();
    const telefone = String(dados.whatsapp ?? "").trim();

    if (!nome || !telefone) {
      return NextResponse.json(
        { erro: "Nome e WhatsApp são obrigatórios." },
        { status: 400, headers }
      );
    }

    const notasPartes = [
      dados.instagram ? `Instagram: ${dados.instagram}` : null,
      dados.area_atuacao ? `Área de atuação: ${dados.area_atuacao}` : null,
      dados.oferta_atual ? `O que vende hoje: ${dados.oferta_atual}` : null,
      dados.preco_oferta ? `Preço da oferta principal: ${dados.preco_oferta}` : null,
      dados.responsavel_publicacao ? `Quem publica: ${dados.responsavel_publicacao}` : null,
      dados.faturamento_atual ? `Faturamento atual: ${dados.faturamento_atual}` : null,
      dados.meta_faturamento ? `Meta de faturamento: ${dados.meta_faturamento}` : null,
      dados.problema_marca ? `Principal problema: ${dados.problema_marca}` : null,
      dados.posicao_desejada ? `O que quer que o nome represente: ${dados.posicao_desejada}` : null,
      dados.momento_investimento ? `Momento: ${dados.momento_investimento}` : null,
    ].filter(Boolean);
    const notas = notasPartes.join("\n");

    const agora = new Date().toISOString();
    const supabase = createAdminClient();

    const { data: leadExistente } = await supabase
      .from("leads_reputacao")
      .select("id")
      .eq("telefone", telefone)
      .maybeSingle();

    let leadId = leadExistente?.id as string | undefined;

    if (leadId) {
      await supabase
        .from("leads_reputacao")
        .update({ nome, email, notas, atualizado_em: agora })
        .eq("id", leadId);
    } else {
      leadId = `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await supabase.from("leads_reputacao").insert({
        id: leadId,
        nome,
        telefone,
        email: email || null,
        origem: "site",
        status: "novo",
        notas,
        criado_em: agora,
        atualizado_em: agora,
      });
    }

    await supabase.from("lead_mensagens_reputacao").insert({
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lead_id: leadId,
      direcao: "recebida",
      texto: "Aplicação enviada pelo formulário do site.",
    });

    return NextResponse.json({ ok: true, leadId }, { headers });
  } catch (e) {
    console.error("Erro ao registrar aplicação do Reputação Digital:", e);
    return NextResponse.json({ ok: false }, { status: 500, headers });
  }
}
