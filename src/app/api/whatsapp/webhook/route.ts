import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

/**
 * Webhook do WhatsApp Business Platform (Meta), usado pelo CRM Assessoria
 * para mapear automaticamente os leads que chegam pelo WhatsApp (link na
 * bio do Instagram -> site -> WhatsApp -> conversa).
 *
 * GET  — handshake de verificação exigido pela Meta ao cadastrar a URL do
 *        webhook no painel de desenvolvedores. A Meta chama esta rota com
 *        ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=..., e
 *        espera receber de volta exatamente o valor de hub.challenge (em
 *        texto puro) quando o verify_token bate com o configurado.
 *
 * POST — recebe cada evento de mensagem em tempo real. Para cada mensagem
 *        nova, encontra (pelo telefone) ou cria um lead na tabela
 *        leads_valore com origem "whatsapp" e status inicial "novo", e
 *        grava o texto em lead_mensagens + atualiza a prévia da última
 *        mensagem no card do lead.
 *
 * Requer as variáveis de ambiente:
 *  - WHATSAPP_VERIFY_TOKEN: senha escolhida por você, cadastrada também
 *    no painel de desenvolvedores da Meta ao configurar o webhook.
 *  - WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID: não são
 *    obrigatórias só para receber mensagens, mas ficam prontas aqui caso
 *    o painel precise responder automaticamente no futuro.
 *
 * Veja o checklist no README para o passo a passo de configuração no
 * painel de desenvolvedores da Meta.
 */

export async function GET(request: NextRequest) {
  const modo = request.nextUrl.searchParams.get("hub.mode");
  const tokenRecebido = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (
    modo === "subscribe" &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    tokenRecebido === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ erro: "Token de verificação inválido" }, { status: 403 });
}

type MensagemWhatsapp = {
  from: string;
  type: string;
  text?: { body: string };
};

type ContatoWhatsapp = {
  wa_id: string;
  profile?: { name?: string };
};

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const payload = await request.json();
    const entradas = payload?.entry ?? [];

    for (const entrada of entradas) {
      for (const mudanca of entrada?.changes ?? []) {
        const valor = mudanca?.value;
        const mensagens: MensagemWhatsapp[] = valor?.messages ?? [];
        const contatos: ContatoWhatsapp[] = valor?.contacts ?? [];

        for (const mensagem of mensagens) {
          const telefone = `+${mensagem.from}`;
          const contato = contatos.find((c) => c.wa_id === mensagem.from);
          const nome = contato?.profile?.name ?? telefone;
          const texto =
            mensagem.type === "text"
              ? mensagem.text?.body ?? "[mensagem sem texto]"
              : `[mensagem do tipo ${mensagem.type}]`;
          const agora = new Date().toISOString();

          // Encontra o lead pelo telefone ou cria um novo (primeira
          // mensagem desse contato).
          const { data: leadExistente } = await supabase
            .from("leads_valore")
            .select("id")
            .eq("telefone", telefone)
            .maybeSingle();

          let leadId = leadExistente?.id as string | undefined;

          if (!leadId) {
            leadId = `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            await supabase.from("leads_valore").insert({
              id: leadId,
              nome,
              telefone,
              origem: "whatsapp",
              status: "novo",
              ultima_mensagem: texto,
              ultima_mensagem_em: agora,
              atualizado_em: agora,
            });
          } else {
            await supabase
              .from("leads_valore")
              .update({
                ultima_mensagem: texto,
                ultima_mensagem_em: agora,
                atualizado_em: agora,
              })
              .eq("id", leadId);
          }

          await supabase.from("lead_mensagens").insert({
            id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            lead_id: leadId,
            direcao: "recebida",
            texto,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // A Meta reenvia o evento se não receber 200 — respondemos 200 mesmo
    // em erro (já registrado no log) para não gerar reenvios em cadeia.
    console.error("Erro no webhook do WhatsApp:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
