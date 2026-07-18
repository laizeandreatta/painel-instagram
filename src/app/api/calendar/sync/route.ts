import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sincronizarAgendamentos } from "@/lib/googleCalendar";

/**
 * Confere a agenda do Google e marca no CRM Assessoria quem já agendou a
 * consultoria (veja src/lib/googleCalendar.ts para a lógica completa).
 *
 * Duas formas de chamar essa rota:
 *
 *  1. GET com ?secret=SEU_CRON_SECRET — usada pelo Vercel Cron (veja
 *     vercel.json), roda automaticamente uma vez por dia.
 *
 *  2. POST com o cabeçalho "Authorization: Bearer <token da sessão>" —
 *     usada pelo botão "Verificar agendamentos" no CRM Assessoria, pra
 *     conferir na hora sem esperar o cron do dia seguinte. Só funciona
 *     pra quem já está logado no painel.
 */

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const resultado = await sincronizarAgendamentos();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    console.error("Erro ao sincronizar agenda:", e);
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !url || !anonKey) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const supabaseAnon = createSupabaseClient(url, anonKey);
  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const resultado = await sincronizarAgendamentos();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    console.error("Erro ao sincronizar agenda:", e);
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
