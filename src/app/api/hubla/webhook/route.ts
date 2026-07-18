import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

/**
 * Webhook da Hubla, usado pelo CRM Assessoria para alimentar automaticamente
 * um lead sempre que houver uma venda confirmada da consultoria
 * (https://app.hub.la/edit/sWUzrJ6JRzAXaRpF0WBM/offers).
 *
 * Configure em Hubla > Integrações > Webhook:
 *  - URL: https://painel-instagram.vercel.app/api/hubla/webhook
 *  - Produto/Oferta: a da consultoria
 *  - Evento: "Pagamento da fatura realizado" (invoice.payment_succeeded)
 *  - Aba Autenticação: copie o "Hubla Webhook Token" e cole na env var
 *    HUBLA_WEBHOOK_TOKEN da Vercel.
 *
 * Requer as variáveis de ambiente:
 *  - HUBLA_WEBHOOK_TOKEN: valor do cabeçalho x-hubla-token, pra garantir
 *    que a requisição realmente veio da Hubla.
 *  - HUBLA_PRODUTO_ID (opcional): se quiser trocar o produto/oferta que
 *    dispara a criação do lead. Por padrão já usa o produto da consultoria
 *    (sWUzrJ6JRzAXaRpF0WBM).
 */

const PRODUTO_CONSULTORIA_ID =
  process.env.HUBLA_PRODUTO_ID || "sWUzrJ6JRzAXaRpF0WBM";

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
    !process.env.HUBLA_WEBHOOK_TOKEN ||
    tokenRecebido !== process.env.HUBLA_WEBHOOK_TOKEN
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
    const ehDoProdutoDaConsultoria =
      evento.product?.id === PRODUTO_CONSULTORIA_ID ||
      evento.products?.some(
        (p) =>
          p.id === PRODUTO_CONSULTORIA_ID ||
          p.offers?.some((o) => o.id === PRODUTO_CONSULTORIA_ID)
      );

    if (!ehDoProdutoDaConsultoria) {
      return NextResponse.json({ ok: true, ignorado: "outro produto" });
    }

    const payer = evento.payer ?? {};
    const nome =
      [payer.firstName, payer.lastName].filter(Boolean).join(" ") ||
      "Sem nome";
    const telefone = payer.phone ?? "";
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
        .from("leads_valore")
        .select("id")
        .eq("telefone", telefone)
        .maybeSingle();
      leadId = leadExistente?.id as string | undefined;
    }

    if (leadId) {
      // Já existia um lead nesse telefone (veio pelo WhatsApp/site/manual):
      // a venda fecha o funil, então marcamos como "fechado".
      await supabase
        .from("leads_valore")
        .update({
          status: "fechado",
          valor_proposta: valor,
          ultima_mensagem: textoVenda,
          ultima_mensagem_em: agora,
          atualizado_em: agora,
        })
        .eq("id", leadId);
    } else {
      leadId = `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await supabase.from("leads_valore").insert({
        id: leadId,
        nome,
        telefone: telefone || "não informado",
        origem: "hubla",
        status: "fechado",
        notas: payer.email ? `E-mail: ${payer.email}` : "",
        valor_proposta: valor,
        ultima_mensagem: textoVenda,
        ultima_mensagem_em: agora,
        atualizado_em: agora,
      });
    }

    await supabase.from("lead_mensagens").insert({
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lead_id: leadId,
      direcao: "recebida",
      texto: textoVenda,
    });

    return NextResponse.json({ ok: true, leadId });
  } catch (e) {
    // A Hubla reenvia o evento se não receber 200 — respondemos 200 mesmo
    // em erro (já registrado no log) para não gerar reenvios em cadeia.
    console.error("Erro no webhook da Hubla:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
