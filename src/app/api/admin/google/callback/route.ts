import { NextRequest, NextResponse } from "next/server";

/**
 * Passo 2 da autorização única do Google Calendar — a Google chama essa
 * rota sozinha depois que você aceita a permissão em /api/admin/google/auth.
 * Troca o código recebido por um "refresh token" e mostra na tela pra
 * você copiar e colar na env var GOOGLE_REFRESH_TOKEN da Vercel.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const erroGoogle = request.nextUrl.searchParams.get("error");

  if (!process.env.CRON_SECRET || state !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  if (erroGoogle) {
    return htmlResposta(`Autorização cancelada ou negada: ${erroGoogle}`, true);
  }

  if (!code) {
    return htmlResposta("Nenhum código recebido do Google.", true);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return htmlResposta(
      "Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas variáveis de ambiente antes.",
      true
    );
  }

  const redirectUri = `${request.nextUrl.origin}/api/admin/google/callback`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const json = await resp.json();

  if (!resp.ok || !json.refresh_token) {
    return htmlResposta(
      `Não veio um refresh_token na resposta do Google. Isso costuma acontecer se você já autorizou antes — revogue o acesso em myaccount.google.com/permissions (procure pelo nome do seu app) e tente de novo pelo link do passo 1.<br><br>Resposta completa: <pre>${JSON.stringify(
        json,
        null,
        2
      )}</pre>`,
      true
    );
  }

  return htmlResposta(
    `Copie o valor abaixo e cole na env var <b>GOOGLE_REFRESH_TOKEN</b> das Environment Variables do projeto na Vercel:<br><br>` +
      `<textarea readonly style="width:100%;max-width:640px;height:80px;font-family:monospace;font-size:14px;padding:12px;">${json.refresh_token}</textarea>` +
      `<br><br>Depois de colar e salvar na Vercel, é só rodar um redeploy para valer. Pode fechar esta página.`,
    false
  );
}

function htmlResposta(mensagem: string, erro: boolean) {
  return new NextResponse(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Autorização Google Calendar</title></head>` +
      `<body style="font-family:sans-serif;max-width:680px;margin:48px auto;padding:0 16px;line-height:1.5;color:${
        erro ? "#8C3D2E" : "#1F1F1F"
      }">` +
      `<h2>${erro ? "Algo deu errado" : "Autorização concluída"}</h2>` +
      `<p>${mensagem}</p>` +
      `</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
