import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { MODULOS } from "@/lib/posicionamentoModulos";
import { PosicionamentoModulos } from "@/lib/types";

/**
 * Gera o dossiê de Posicionamento de Valor a partir da transcrição da
 * reunião de descoberta, usando a API da Anthropic (Claude). Só quem já
 * está logado no painel como equipe (qualquer papel diferente de
 * "cliente") pode chamar essa rota — mesmo padrão de autenticação de
 * /api/calendar/sync (cabeçalho "Authorization: Bearer <token da
 * sessão>").
 *
 * Precisa de ANTHROPIC_API_KEY nas variáveis de ambiente (veja o README,
 * seção Posicionamento de Valor, para como conseguir essa chave).
 */

const LIMITE_TRANSCRICAO = 50000;

function construirPrompt(transcricao: string, truncada: boolean): string {
  const linhas: string[] = [];
  linhas.push(
    'Você é uma consultora de posicionamento de marca pessoal, no método "Posicionamento de Valor" (pilares: Posicionamento, Produto, Audiência). Leia a transcrição de uma reunião de descoberta com um cliente e preencha os 12 módulos abaixo, respondendo cada pergunta ESTRITAMENTE com base no que foi dito na conversa.'
  );
  linhas.push(
    'Regras de escrita: tom consultivo e de desejo (nunca de medo ou carência), sem usar antíteses do tipo "não é sobre X, é sobre Y", frases diretas e específicas, sem inventar fatos que não foram ditos. Quando um tópico não foi abordado na reunião, responda exatamente "Não abordado na reunião".'
  );
  linhas.push("");
  linhas.push(
    'Para cada módulo, escreva também uma "declaracao": uma frase-síntese (1 a 2 frases, tom editorial, poderia abrir um documento de posicionamento) que resume o território/insight central daquele módulo com base nas respostas.'
  );
  linhas.push("");
  MODULOS.forEach((m) => {
    linhas.push(`MÓDULO ${m.num} — ${m.titulo}`);
    m.perguntas.forEach((p, i) => linhas.push(`  ${i + 1}. ${p.q}`));
    linhas.push("");
  });
  linhas.push(
    "Responda APENAS com um JSON no formato exato abaixo (uma chave por módulo, respostas na mesma ordem das perguntas listadas), sem nenhum texto antes ou depois:"
  );
  linhas.push('{"01": {"declaracao": "...", "respostas": ["...", "..."]}, "02": {...}, ... "12": {...}}');
  linhas.push("");
  if (truncada) linhas.push("[Nota: a transcrição abaixo foi cortada por limite de tamanho — trabalhe com o que está disponível.]");
  linhas.push("TRANSCRIÇÃO DA REUNIÃO:");
  linhas.push(transcricao);
  return linhas.join("\n");
}

function modulosVaziosLocal(): PosicionamentoModulos {
  const out: PosicionamentoModulos = {};
  MODULOS.forEach((m) => {
    out[m.num] = { declaracao: "", respostas: m.perguntas.map(() => "") };
  });
  return out;
}

type ModuloRecebido = { declaracao?: unknown; respostas?: unknown[] };

function validarModulos(parsed: unknown): PosicionamentoModulos {
  const out = modulosVaziosLocal();
  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, ModuloRecebido>;
  MODULOS.forEach((m) => {
    const got = obj[m.num];
    if (!got) return;
    if (typeof got.declaracao === "string") out[m.num].declaracao = got.declaracao;
    const respostasRecebidas = got.respostas;
    if (Array.isArray(respostasRecebidas)) {
      out[m.num].respostas = m.perguntas.map((_, i) => {
        const valor = respostasRecebidas[i];
        return typeof valor === "string" ? valor : "";
      });
    }
  });
  return out;
}

// Extrai o primeiro bloco { ... } da resposta — o modelo às vezes cerca
// o JSON com texto ou blocos de código markdown mesmo quando instruído a
// não fazer isso.
function extrairJson(texto: string): unknown {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim <= inicio) throw new Error("Resposta sem JSON reconhecível.");
  return JSON.parse(texto.slice(inicio, fim + 1));
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
  const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const { data: perfil } = await supabaseAnon
    .from("perfis")
    .select("papel")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (perfil?.papel === "cliente") {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { erro: "Geração por IA não configurada. Defina ANTHROPIC_API_KEY nas variáveis de ambiente (veja o README)." },
      { status: 500 }
    );
  }

  let transcricao: string;
  try {
    const body = await request.json();
    transcricao = String(body.transcricao ?? "").trim();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (!transcricao) {
    return NextResponse.json({ erro: "Cole a transcrição antes de gerar." }, { status: 400 });
  }

  let truncada = false;
  if (transcricao.length > LIMITE_TRANSCRICAO) {
    transcricao = transcricao.slice(0, LIMITE_TRANSCRICAO);
    truncada = true;
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = construirPrompt(transcricao, truncada);
    const modelo = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

    const resposta = await anthropic.messages.create({
      model: modelo,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const textoResposta = resposta.content
      .filter((bloco): bloco is Anthropic.TextBlock => bloco.type === "text")
      .map((bloco) => bloco.text)
      .join("\n");

    const parsed = extrairJson(textoResposta);
    const modulos = validarModulos(parsed);

    return NextResponse.json({ ok: true, modulos, truncada, transcricao });
  } catch (e) {
    console.error("Erro ao gerar dossiê de Posicionamento de Valor:", e);
    return NextResponse.json(
      { erro: "Não foi possível gerar agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
