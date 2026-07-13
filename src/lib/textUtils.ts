// Remove marcações de markdown (**negrito**, # títulos, código, etc.)
// de textos colados de ferramentas como ChatGPT, para que o conteúdo
// cole "limpo", sem os símbolos aparecendo literalmente no painel.
export function stripMarkdown(texto: string): string {
  return texto
    // negrito+itálico (*** ou ___)
    .replace(/(\*\*\*|___)(.*?)\1/g, "$2")
    // negrito (** ou __)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    // itálico (* ou _)
    .replace(/(?<![*\w])\*([^*\n]+)\*(?!\*)/g, "$1")
    .replace(/(?<![_\w])_([^_\n]+)_(?!_)/g, "$1")
    // tachado
    .replace(/~~(.*?)~~/g, "$1")
    // código inline e blocos de código
    .replace(/[`]{3}[a-zA-Z]*\n?/g, "")
    .replace(/[`]([^`]+)[`]/g, "$1")
    // links [texto](url) -> texto
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    // títulos "# ", "## " etc no início da linha
    .replace(/^#{1,6}\s+/gm, "")
    // citações "> " no início da linha
    .replace(/^>\s?/gm, "")
    // marcadores de lista "- ", "* ", "+ "
    .replace(/^(\s*)[-*+]\s+/gm, "$1")
    // listas numeradas "1. "
    .replace(/^(\s*)\d+\.\s+/gm, "$1")
    // linhas horizontais ---
    .replace(/^-{3,}$/gm, "")
    .trim();
}

// Handler de colar (paste) para <textarea> não-controlados (defaultValue),
// onde é seguro manipular o DOM diretamente via setRangeText.
export function handlePasteUncontrolled(
  e: React.ClipboardEvent<HTMLTextAreaElement>
) {
  const texto = e.clipboardData.getData("text/plain");
  if (!texto) return;
  e.preventDefault();
  const limpo = stripMarkdown(texto);
  const el = e.currentTarget;
  const inicio = el.selectionStart ?? el.value.length;
  const fim = el.selectionEnd ?? el.value.length;
  el.setRangeText(limpo, inicio, fim, "end");
}

// Handler de colar para campos controlados (value + onChange em estado React).
export function handlePasteControlled(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
  valorAtual: string,
  setValor: (v: string) => void
) {
  const texto = e.clipboardData.getData("text/plain");
  if (!texto) return;
  e.preventDefault();
  const limpo = stripMarkdown(texto);
  const el = e.currentTarget;
  const inicio = el.selectionStart ?? valorAtual.length;
  const fim = el.selectionEnd ?? valorAtual.length;
  const novoValor = valorAtual.slice(0, inicio) + limpo + valorAtual.slice(fim);
  setValor(novoValor);
  requestAnimationFrame(() => {
    try {
      el.selectionStart = el.selectionEnd = inicio + limpo.length;
    } catch {
      // campo pode ter perdido foco nesse meio-tempo, ignora
    }
  });
}
