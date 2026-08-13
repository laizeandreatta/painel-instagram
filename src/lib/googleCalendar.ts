import { createAdminClient } from "./supabaseAdmin";

/**
 * Confere na agenda do Google se algum lead de um dos funis com
 * agendamento (CRM Consultoria, CRM Reputação Digital) marcou a conversa
 * pelo link de agendamento correspondente. Casa os compromissos pelo
 * e-mail de quem agendou (a página de agendamento do Google sempre pede
 * e-mail antes de confirmar) — cada funil é conferido contra a mesma
 * agenda do Google, já que os dois links de agendamento (Consultoria e
 * Reputação Digital) criam eventos na mesma agenda.
 *
 * Requer as variáveis de ambiente:
 * - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: credenciais do projeto no
 *   Google Cloud Console (tela "IDs do cliente OAuth 2.0").
 * - GOOGLE_REFRESH_TOKEN: obtido uma única vez autorizando o painel a
 *   ler sua agenda — veja a rota /api/admin/google/auth e o README.
 * - GOOGLE_CALENDAR_ID (opcional): qual agenda conferir. Por padrão usa
 *   "primary" (a agenda principal da conta que autorizou).
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

// Cada funil com agendamento entra aqui: tabela de leads, tabela de
// mensagens, qual coluna marca "agendado" e o texto da mensagem
// registrada quando o agendamento é confirmado. `novoStatus` (opcional)
// também avança o card no quadro Kanban quando o agendamento é achado.
type RecursoAgendamento = {
  tabelaLeads: string;
  tabelaMensagens: string;
  campoAgendado: string;
  textoMensagem: (dataFormatada: string) => string;
  novoStatus?: string;
};

const RECURSOS_AGENDAMENTO: RecursoAgendamento[] = [
  {
    tabelaLeads: "leads_valore",
    tabelaMensagens: "lead_mensagens",
    campoAgendado: "consultoria_agendada_em",
    textoMensagem: (data) => `Consultoria agendada na agenda para ${data}.`,
  },
  {
    tabelaLeads: "leads_reputacao",
    tabelaMensagens: "lead_mensagens_reputacao",
    campoAgendado: "reputacao_agendada_em",
    textoMensagem: (data) => `Reunião agendada na agenda para ${data}.`,
    novoStatus: "reuniao_agendada",
  },
];

export async function sincronizarAgendamentos() {
  const supabase = createAdminClient();
  const resultado = { eventosVistos: 0, leadsAtualizados: 0, erros: [] as string[] };

  const accessToken = await obterAccessTokenGoogle();
  const eventos = await listarProximosEventos(accessToken);
  resultado.eventosVistos = eventos.length;

  // Para cada funil, monta um mapa e-mail -> lead (só os que ainda não
  // têm o agendamento confirmado).
  const mapasPorRecurso = await Promise.all(
    RECURSOS_AGENDAMENTO.map(async (recurso) => {
      const { data: leads } = await supabase
        .from(recurso.tabelaLeads)
        .select(`id, email, ${recurso.campoAgendado}`)
        .not("email", "is", null)
        .is(recurso.campoAgendado, null);

      const mapa = new Map<string, { id: string; email: string }>();
      for (const l of (leads ?? []) as { id: string; email: string | null }[]) {
        if (l.email) {
          mapa.set(String(l.email).toLowerCase().trim(), {
            id: l.id,
            email: l.email,
          });
        }
      }

      return { recurso, mapa };
    })
  );

  for (const evento of eventos) {
    if (evento.status === "cancelled") continue;
    const inicio = evento.start?.dateTime || evento.start?.date;
    if (!inicio) continue;

    for (const participante of evento.attendees ?? []) {
      if (participante.organizer || participante.resource) continue;
      const email = participante.email?.toLowerCase().trim();
      if (!email) continue;

      for (const { recurso, mapa } of mapasPorRecurso) {
        const lead = mapa.get(email);
        if (!lead) continue;

        try {
          const agora = new Date().toISOString();
          const patch: Record<string, unknown> = {
            [recurso.campoAgendado]: inicio,
            atualizado_em: agora,
          };
          if (recurso.novoStatus) {
            patch.status = recurso.novoStatus;
          }

          await supabase.from(recurso.tabelaLeads).update(patch).eq("id", lead.id);

          const dataFormatada = new Date(inicio).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          });
          await supabase.from(recurso.tabelaMensagens).insert({
            id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            lead_id: lead.id,
            direcao: "recebida",
            texto: recurso.textoMensagem(dataFormatada),
          });

          resultado.leadsAtualizados += 1;
          // Evita processar o mesmo lead duas vezes nessa mesma execução.
          mapa.delete(email);
        } catch (e) {
          resultado.erros.push(`Lead ${lead.id}: ${String(e)}`);
        }
      }
    }
  }

  return resultado;
}
