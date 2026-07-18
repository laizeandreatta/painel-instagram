import { createAdminClient } from "./supabaseAdmin";

/**
 * Confere na agenda do Google se algum lead do CRM Consultoria marcou a
 * consultoria pelo link de agendamento (https://calendar.app.google/zFyfAuddQbUd7wH76).
 * Casa os compromissos pelo e-mail de quem agendou (a página de
 * agendamento do Google sempre pede e-mail antes de confirmar).
 *
 * Requer as variáveis de ambiente:
 *  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: credenciais do projeto no
 *    Google Cloud Console (tela "IDs do cliente OAuth 2.0").
 *  - GOOGLE_REFRESH_TOKEN: obtido uma única vez autorizando o painel a
 *    ler sua agenda — veja a rota /api/admin/google/auth e o README.
 *  - GOOGLE_CALENDAR_ID (opcional): qual agenda conferir. Por padrão usa
 *    "primary" (a agenda principal da conta que autorizou).
 */

async function obterAccessTokenGoogle(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REFRESH_TOKEN não configurados."
    );
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`Erro ao renovar token do Google: ${JSON.stringify(json)}`);
  }
  return json.access_token as string;
}

type EventoGoogle = {
  id: string;
  status: string;
  start?: { dateTime?: string; date?: string };
  attendees?: { email?: string; organizer?: boolean; resource?: boolean }[];
};

async function listarProximosEventos(accessToken: string): Promise<EventoGoogle[]> {
  const calendarId = encodeURIComponent(
    process.env.GOOGLE_CALENDAR_ID || "primary"
  );
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const resp = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(
      `Erro ao listar eventos do Google Calendar: ${JSON.stringify(json)}`
    );
  }
  return (json.items ?? []) as EventoGoogle[];
}

export async function sincronizarAgendamentos() {
  const supabase = createAdminClient();
  const resultado = { eventosVistos: 0, leadsAtualizados: 0, erros: [] as string[] };

  const accessToken = await obterAccessTokenGoogle();
  const eventos = await listarProximosEventos(accessToken);
  resultado.eventosVistos = eventos.length;

  // Só nos interessam leads que já têm e-mail (veio da venda na Hubla) e
  // que ainda não tiveram o agendamento confirmado.
  const { data: leads } = await supabase
    .from("leads_valore")
    .select("id, email, consultoria_agendada_em")
    .not("email", "is", null)
    .is("consultoria_agendada_em", null);

  if (!leads || leads.length === 0) {
    return resultado;
  }

  const leadsPorEmail = new Map(
    leads
      .filter((l) => l.email)
      .map((l) => [String(l.email).toLowerCase().trim(), l])
  );

  for (const evento of eventos) {
    if (evento.status === "cancelled") continue;
    const inicio = evento.start?.dateTime || evento.start?.date;
    if (!inicio) continue;

    for (const participante of evento.attendees ?? []) {
      if (participante.organizer || participante.resource) continue;
      const email = participante.email?.toLowerCase().trim();
      if (!email) continue;

      const lead = leadsPorEmail.get(email);
      if (!lead) continue;

      try {
        const agora = new Date().toISOString();
        await supabase
          .from("leads_valore")
          .update({ consultoria_agendada_em: inicio, atualizado_em: agora })
          .eq("id", lead.id);

        const dataFormatada = new Date(inicio).toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        });
        await supabase.from("lead_mensagens").insert({
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          lead_id: lead.id,
          direcao: "recebida",
          texto: `Consultoria agendada na agenda para ${dataFormatada}.`,
        });

        resultado.leadsAtualizados += 1;
        // Evita processar o mesmo lead duas vezes nessa mesma execução.
        leadsPorEmail.delete(email);
      } catch (e) {
        resultado.erros.push(`Lead ${lead.id}: ${String(e)}`);
      }
    }
  }

  return resultado;
}
