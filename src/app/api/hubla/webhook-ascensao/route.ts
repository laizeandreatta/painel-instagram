import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

/**
 * Webhook da Hubla, usado pelo CRM Programa Ascensão (produto diferente do
 * CRM Consultoria) para alimentar automaticamente um lead sempre que
 * houver uma venda confirmada do Programa Ascensão.
 *
 * Diferente do webhook da Consultoria (/api/hubla/webhook), este NÃO manda
 * WhatsApp nem agenda nada — o Programa Ascensão é entregue por acesso a
 * conteúdo, então a venda confirmada já entra direto na etapa "Acesso
 * liberado" do funil de entrega (veja ENTREGA_STATUS_ORDER em
 * src/lib/types.ts), e o acompanhamento manual é feito pela equipe no
 * board.
 *
 * Configure em Hubla > Programa Ascensão > Integrações > Webhook:
 *  - URL: https://painel-instagram.vercel.app/api/hubla/webhook-ascensao
 *  - Produto: Programa Ascensão (todas as ofertas)
 *  - Evento: "Pagamento da fatura realizado" (invoice.payment_succeeded)
 *  - Aba Autenticação: copie o "Hubla Webhook Token" e cole na env var
 *    HUBLA_WEBHOOK_TOKEN_ASCENSAO da Vercel.
 *
 * Requer as variáveis de ambiente:
 *  - HUBLA_WEBHOOK_TOKEN_ASCENSAO: valor do cabeçalho x-hubla-token, pra
 *    garantir que a requisição realmente veio da Hubla.
 *  - HUBLA_PRODUTO_ASCENSAO_ID (opcional): se quiser trocar o produto que
 *    dispara a criação do lead. Por padrão já usa o produto do Programa
 *    Ascensão (cSBEukMTb3BjYwJkwNKo).
 */

const PRODUTO_ASCENSAO_ID =
  process.env.HUBLA_PRODUTO_ASCENSAO_ID || "cSBEukMTb3BjYwJkwNKo";

type PayloadHubla = {
  type: string;
  event: {
    product?: { id: string; name?: string };
    products?: { id: string; offers?: { id: string }[] }[];
    invoice: {
      amount?: { totalCents?: number };
    };
    payer?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  const tokenRecebido = request.headers.get("x-hubla-token");

  if (
    !process.env.HUBLA_WEBHOOK_TOKEN_ASCENSAO ||
    tokenRecebido !== process.env.HUBLA_WEBHOOK_TOKEN_ASCENSAO
  ) {
    return NextResponse.json({ erro: "Token inválido" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const payload: PayloadHubla = await request.json();

    // Só nos interessa quando uma fatura é paga de verdade (venda
    // confirmada) — ignora carrinho abandonado, fatura criada, etc.
    if (payload.type !== "invoice.payment_succeeded") {
      return NextResponse.json({ ok: true, ignorado: payload.type });
    }

    const evento = payload.event;
    const ehDoProgramaAscensao =
      evento.product?.id === PRODUTO_ASCENSAO_ID ||
      evento.products?.some(
        (p) =>
          p.id === PRODUTO_ASCENSAO_ID ||
          p.offers?.some((o) => o.id === PRODUTO_ASCENSAO_ID)
      );

    if (!ehDoProgramaAscensao) {
      return NextResponse.json({ ok: true, ignorado: "outro produto" });
    }

    const payer = evento.payer ?? {};
    const nome =
      [payer.firstName, payer.lastName].filter(Boolean).join(" ") ||
      "Sem nome";
    const telefone = payer.phone ?? "";
    const email = payer.email ?? null;
    const valor = evento.invoice.amount?.totalCents
      ? evento.invoice.amount.totalCents / 100
      : null;
    const agora = new Date().toISOString();
    const textoVenda = `Venda confirmada na Hubla${
      valor
        ? ` — ${valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}`
        : ""
    }.`;

    // Encontra o lead pelo telefone ou cria um novo.
    let leadId: string | undefined;

    if (telefone) {
      const { data: leadExistente } = await supabase
        .from("leads_ascensao")
        .select("id")
        .eq("telefone", telefone)
        .maybeSingle();
      leadId = leadExistente?.id as string | undefined;
    }

    if (leadId) {
      // Já existia um lead nesse telefone: mantém o status atual (pode já
      // estar em acompanhamento) e só atualiza os dados da venda.
      await supabase
        .from("leads_ascensao")
        .update({
          email,
          valor_proposta: valor,
          ultima_mensagem: textoVenda,
          ultima_mensagem_em: agora,
          atualizado_em: agora,
        })
        .eq("id", leadId);
    } else {
      leadId = `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await supabase.from("leads_ascensao").insert({
        id: leadId,
        nome,
        telefone: telefone || "não informado",
        email,
        origem: "hubla",
        status: "acesso_liberado",
        valor_proposta: valor,
        ultima_mensagem: textoVenda,
        ultima_mensagem_em: agora,
        atualizado_em: agora,
      });
    }

    await supabase.from("lead_mensagens_ascensao").insert({
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lead_id: leadId,
      direcao: "recebida",
      texto: textoVenda,
    });

    return NextResponse.json({ ok: true, leadId });
  } catch (e) {
    // A Hubla reenvia o evento se não receber 200 — respondemos 200 mesmo
    // em erro (já registrado no log) para não gerar reenvios em cadeia.
    console.error("Erro no webhook da Hubla (Programa Ascensão):", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
