/**
 * Envio de mensagens pelo WhatsApp Business Platform (Meta), usado para
 * mandar automaticamente o link de agendamento da consultoria assim que
 * uma venda é confirmada na Hubla (veja /api/hubla/webhook).
 *
 * Como essa é a PRIMEIRA mensagem enviada para a pessoa (ela ainda não
 * escreveu pra gente), a Meta exige que seja um "modelo de mensagem"
 * (message template) previamente aprovado — não dá pra mandar texto livre
 * fora de uma janela de 24h de conversa já iniciada pelo cliente.
 *
 * Requer as variáveis de ambiente:
 *  - WHATSAPP_ACCESS_TOKEN: token de acesso permanente do número comercial.
 *  - WHATSAPP_PHONE_NUMBER_ID: ID do número de telefone comercial (não é o
 *    número em si, é o ID que aparece no WhatsApp Manager).
 *  - WHATSAPP_TEMPLATE_AGENDAMENTO: nome do modelo aprovado que contém o
 *    botão/link de agendamento (por padrão "agendamento_consultoria").
 *
 * Veja o README para o passo a passo de como criar o número comercial, o
 * token e aprovar o modelo de mensagem no Meta Business Suite.
 */

const GRAPH_VERSION = "v21.0";

export class WhatsappNaoConfiguradoError extends Error {}

/**
 * Envia o modelo de mensagem de agendamento para o telefone informado.
 * `nome` é usado como variável {{1}} do corpo do modelo (personalização).
 */
export async function enviarWhatsappAgendamento(params: {
  telefone: string;
  nome: string;
}) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName =
    process.env.WHATSAPP_TEMPLATE_AGENDAMENTO || "agendamento_consultoria";

  if (!accessToken || !phoneNumberId) {
    throw new WhatsappNaoConfiguradoError(
      "WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurados."
    );
  }

  // A Graph API espera o telefone só com dígitos (código do país + DDD +
  // número), sem "+", espaços ou traços.
  const para = params.telefone.replace(/\D/g, "");
  const primeiroNome = params.nome.trim().split(" ")[0] || "tudo bem";

  const resp = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: para,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: primeiroNome }],
            },
          ],
        },
      }),
    }
  );

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`Erro ao enviar WhatsApp: ${JSON.stringify(json)}`);
  }
  return json;
}
