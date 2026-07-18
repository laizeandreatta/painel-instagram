import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { enviarWhatsappAgendamento } from "@/lib/whatsapp";

/**
 * Webhook da Hubla, usado pelo CRM Assessoria para alimentar automaticamente
 * um lead sempre que houver uma venda confirmada da consultoria
 * (https://app.hub.la/edit/sWUzrJ6JRzAXaRpF0WBM/offers).
 *
 * Além de criar/atualizar o lead como "fechado", essa rota manda pro
 * comprador um WhatsApp com o link de agendamento da consultoria
 * (link de agendamento: https://calendar.app.google/zFyfAuddQbUd7wH76,
 * embutido no modelo de mensagem aprovado — veja src/lib/whatsapp.ts). A
 * rota /api/calendar/sync confere depois, na agenda do Google, se a
 * pessoa realmente marcou o horário.
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
 *  - WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / (opcional)
 *    WHATSAPP_TEMPLATE_AGENDAMENTO: veja src/lib/whatsapp.ts. Se não
 *    estiverem configuradas, o lead ainda é criado normalmente — só o
 *    envio do WhatsApp fica pulado (e registrado no log do servidor).
 */

const PRODUTO_CONSULTORIA_ID =
  process.env.HUBLA_PRODUTO_ID || "sWUzrJ6JRzAXaRpF0WBM";

const LINK_AGENDAMENTO = "https://calendar.app.google/zFyfAuddQbUd7wH76";

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
          email,
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
        email,
        origem: "hubla",
        status: "fechado",
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

    // Manda o WhatsApp com o link de agendamento. Se as variáveis do
    // WhatsApp não estiverem configuradas ainda, ou o envio falhar por
    // qualquer motivo, não derruba o webhook — só registra no log e o
    // lead fica criado normalmente (dá pra mandar o link na mão).
    if (telefone) {
      try {
        await enviarWhatsappAgendamento({ telefone, nome });
        const textoConvite = `Link de agendamento enviado por WhatsApp: ${LINK_AGENDAMENTO}`;
        await supabase
          .from("leads_valore")
          .update({ convite_agendamento_enviado_em: agora })
          .eq("id", leadId);
        await supabase.from("lead_mensagens").insert({
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          lead_id: leadId,
          direcao: "enviada",
          texto: textoConvite,
        });
      } catch (erroWhatsapp) {
        console.error(
          "Não foi possível enviar o WhatsApp de agendamento:",
          erroWhatsapp
        );
      }
    }

    return NextResponse.json({ ok: true, leadId });
  } catch (e) {
    // A Hubla reenvia o evento se não receber 200 — respondemos 200 mesmo
    // em erro (já registrado no log) para não gerar reenvios em cadeia.
    console.error("Erro no webhook da Hubla:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
