import { NextRequest, NextResponse } from "next/server";

/**
 * Passo 1 da autorização única do Google Calendar (veja o README).
 *
 * Acesse esta URL no navegador, logado com a conta do Google cuja
 * agenda tem o link de agendamento da consultoria, e coloque o
 * CRON_SECRET na query string:
 *
 *   https://SEU-PAINEL.vercel.app/api/admin/google/auth?secret=SEU_CRON_SECRET
 *
 * Você vai cair na tela de permissão do Google — aceite (mesmo que
 * apareça o aviso "o Google não verificou esse app", é esperado, porque
 * o painel é seu). Depois disso, a rota /api/admin/google/callback
 * mostra o "refresh token" pra você copiar e colar na env var
 * GOOGLE_REFRESH_TOKEN da Vercel. Só precisa fazer isso uma vez.
 *
 * Requer GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET já configurados (veja
 * o passo a passo do Google Cloud Console no README).
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { erro: "Defina GOOGLE_CLIENT_ID nas variáveis de ambiente antes." },
      { status: 400 }
    );
  }

  const redirectUri = `${request.nextUrl.origin}/api/admin/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state: secret,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
