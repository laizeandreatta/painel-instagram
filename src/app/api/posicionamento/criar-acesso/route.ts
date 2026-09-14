import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabaseAdmin";

/**
 * Cria (ou redefine a senha de) o login de acesso de um cliente do
 * Posicionamento de Valor — o cliente entra pelo /login normal do
 * painel, com papel "cliente", e só enxerga o próprio dossiê (a
 * Sidebar e o layout escondem/bloqueiam o resto; o banco, com RLS,
 * garante isso mesmo que alguém tente acessar outra URL direto).
 *
 * Só quem já está logado como equipe pode chamar (mesmo padrão de
 * autenticação de /api/calendar/sync). Usa a service role key (só no
 * servidor) porque criar um login e definir senha exige a API admin do
 * Supabase Auth.
 */

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

  const { data: perfilSolicitante } = await supabaseAnon
    .from("perfis")
    .select("papel")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (perfilSolicitante?.papel === "cliente") {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  let body: { clienteId?: string; email?: string; senha?: string; nome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const clienteId = String(body.clienteId ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const senha = String(body.senha ?? "");
  const nome = String(body.nome ?? "").trim();

  if (!clienteId || !email || !nome) {
    return NextResponse.json({ erro: "Preencha nome e e-mail do cliente." }, { status: 400 });
  }
  if (senha && senha.length < 6) {
    return NextResponse.json({ erro: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: cliente, error: clienteError } = await admin
    .from("posicionamento_clientes")
    .select("id, cliente_user_id")
    .eq("id", clienteId)
    .maybeSingle();
  if (clienteError || !cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  try {
    let userId = cliente.cliente_user_id as string | null;

    if (userId) {
      // Já existe login — atualiza e-mail/nome e, se uma nova senha foi
      // informada, troca a senha também.
      const updatePayload: { email?: string; password?: string } = {};
      if (senha) updatePayload.password = senha;
      if (Object.keys(updatePayload).length) {
        const { error } = await admin.auth.admin.updateUserById(userId, updatePayload);
        if (error) throw error;
      }
      await admin.from("perfis").update({ nome, email }).eq("id", userId);
    } else {
      // Login novo: cria o usuário no Supabase Auth (e-mail já
      // confirmado — não precisa clicar em nenhum link) e o perfil
      // com papel "cliente".
      if (!senha) {
        return NextResponse.json({ erro: "Defina uma senha para o primeiro acesso." }, { status: 400 });
      }
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });
      if (createError || !created.user) {
        const mensagem =
          createError?.message?.includes("already been registered") || createError?.code === "email_exists"
            ? "Já existe uma conta com esse e-mail."
            : "Não foi possível criar o login agora.";
        return NextResponse.json({ erro: mensagem }, { status: 400 });
      }
      userId = created.user.id;

      const { error: perfilError } = await admin.from("perfis").insert({
        id: userId,
        nome,
        email,
        papel: "cliente",
      });
      if (perfilError) throw perfilError;

      const { error: vincularError } = await admin
        .from("posicionamento_clientes")
        .update({ cliente_user_id: userId })
        .eq("id", clienteId);
      if (vincularError) throw vincularError;
    }

    return NextResponse.json({ ok: true, clienteUserId: userId, email });
  } catch (e) {
    console.error("Erro ao criar/atualizar acesso do cliente do Posicionamento:", e);
    return NextResponse.json({ erro: "Não foi possível salvar o acesso agora. Tente de novo em instantes." }, { status: 500 });
  }
}
