import { redirect } from "next/navigation";

type Params = Record<string, string | string[] | undefined>;

function toQueryString(params: Params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, v));
    } else {
      search.append(key, value);
    }
  }
  return search.toString();
}

// Esta página nunca é vista de verdade — ela só decide para onde
// mandar a pessoa. O motivo de não ser um redirecionamento simples:
// os links de e-mail do Supabase (recuperar senha, convite etc) caem
// primeiro aqui, e traziam informação (token ou erro) em parâmetros
// que um "redirect('/dashboard')" simples jogava fora no meio do
// caminho — por isso o link parecia "não fazer nada" e a pessoa
// acabava só na tela de login comum, sem explicação.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  if (params.error || params.error_description || params.error_code) {
    const mensagem =
      typeof params.error_description === "string"
        ? params.error_description
        : "O link usado não é mais válido.";
    redirect(`/login?erro=${encodeURIComponent(mensagem)}`);
  }

  if (params.token_hash && params.type) {
    redirect(`/definir-senha?${toQueryString(params)}`);
  }

  redirect("/dashboard");
}
