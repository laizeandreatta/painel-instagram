"use client";

import { useCallback, useState } from "react";
import { Plus, Trash2, Compass } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  usePosicionamentoClientes,
  usePosicionamentoCliente,
  usePosicionamentoConteudos,
  useMeuPosicionamento,
} from "@/lib/usePosicionamento";
import { DiagnosticoPainel } from "@/components/posicionamento/DiagnosticoPainel";
import { PainelEstrategico } from "@/components/posicionamento/PainelEstrategico";
import { ConteudosPainel } from "@/components/posicionamento/ConteudosPainel";
import { AcessoPainel } from "@/components/posicionamento/AcessoPainel";
import { PosicionamentoModulos } from "@/lib/types";

export default function PosicionamentoPage() {
  const { profile } = useAuth();

  if (profile?.papel === "cliente") return <VisaoCliente />;
  return <VisaoEquipe />;
}

// ---------------------------------------------------------------------
// Visão do cliente: só o próprio dossiê, só leitura.
// ---------------------------------------------------------------------
function VisaoCliente() {
  const { cliente, conteudos, loading, demoMode } = useMeuPosicionamento();
  const [aba, setAba] = useState<"painel" | "conteudos">("painel");

  if (loading) {
    return <p className="px-6 py-7 text-sm text-ink/50 md:px-10">Carregando...</p>;
  }

  if (!cliente) {
    return (
      <div className="px-6 py-7 md:px-10">
        <p className="text-sm text-ink/50">
          Ainda não encontramos um dossiê de Posicionamento de Valor vinculado ao seu acesso. Fale com a Laize.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-7 md:px-10">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-wine">
        <Compass size={13} />
        Posicionamento de Valor
      </div>
      <h1 className="mb-1 font-editorial text-2xl font-semibold text-ink md:text-3xl">{cliente.nome}</h1>
      <p className="mb-6 text-sm text-ink/50">Dossiê Estratégico — visualização e cópia, sem edição.</p>

      {demoMode && (
        <div className="mb-6 rounded-lg border border-baby-pink bg-baby-pink-light px-3 py-2.5 text-xs text-bordeaux">
          Modo demonstração — dados de exemplo.
        </div>
      )}

      <Abas
        aba={aba}
        onChange={(v) => setAba(v as typeof aba)}
        itens={[
          { v: "painel", label: "Painel Estratégico" },
          { v: "conteudos", label: "Conteúdos" },
        ]}
      />

      <div className="mt-6">
        {aba === "painel" && <PainelEstrategico modulos={cliente.modulos} readOnly />}
        {aba === "conteudos" && <ConteudosPainel conteudos={conteudos} readOnly />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Visão da equipe: lista de clientes + workspace de 4 abas.
// ---------------------------------------------------------------------
function VisaoEquipe() {
  const { clientes, loading, demoMode, criarCliente, excluirCliente } = usePosicionamentoClientes();
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [statusNovo, setStatusNovo] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    const nome = nomeNovo.trim();
    if (!nome) {
      setStatusNovo("Digite um nome antes de criar.");
      return;
    }
    setCriando(true);
    const { cliente, erro } = await criarCliente(nome);
    setCriando(false);
    if (erro || !cliente) {
      setStatusNovo(erro);
      return;
    }
    setNomeNovo("");
    setFormAberto(false);
    setStatusNovo(null);
    setSelecionadoId(cliente.id);
  }

  function handleExcluir(id: string, nome: string) {
    const confirmado = window.confirm(`Excluir o dossiê de "${nome}"? Não pode ser desfeito.`);
    if (!confirmado) return;
    excluirCliente(id);
    if (selecionadoId === id) setSelecionadoId(null);
  }

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Lista de clientes */}
      <div className="border-b border-line bg-white px-5 py-6 md:w-72 md:shrink-0 md:border-b-0 md:border-r">
        <h1 className="mb-1 font-editorial text-xl font-semibold text-ink">Posicionamento de Valor</h1>
        <p className="mb-5 text-xs text-ink/45">Dossiê de posicionamento por cliente.</p>

        {!formAberto ? (
          <button
            onClick={() => setFormAberto(true)}
            className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2.5 text-sm font-medium text-ink/60 hover:border-wine hover:text-wine"
          >
            <Plus size={15} /> Novo cliente
          </button>
        ) : (
          <form onSubmit={handleCriar} className="mb-4 flex flex-col gap-2">
            <input
              autoFocus
              value={nomeNovo}
              onChange={(e) => setNomeNovo(e.target.value)}
              placeholder="Nome do cliente"
              maxLength={80}
              className="rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={criando}
                className="flex-1 rounded-lg bg-wine py-2 text-sm font-medium text-off-white hover:opacity-90 disabled:opacity-60"
              >
                {criando ? "Criando..." : "Criar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormAberto(false);
                  setStatusNovo(null);
                }}
                className="flex-1 rounded-lg border border-line py-2 text-sm text-ink/60 hover:text-ink"
              >
                Cancelar
              </button>
            </div>
            {statusNovo && <p className="text-xs text-wine">{statusNovo}</p>}
          </form>
        )}

        {demoMode && (
          <div className="mb-4 rounded-lg border border-baby-pink bg-baby-pink-light px-3 py-2.5 text-xs text-bordeaux">
            Modo demonstração — dados de exemplo.
          </div>
        )}

        {loading ? (
          <p className="text-sm text-ink/40">Carregando...</p>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-ink/40">Nenhum cliente ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {clientes.map((c) => (
              <li key={c.id} className="group flex items-center">
                <button
                  onClick={() => setSelecionadoId(c.id)}
                  className={`flex-1 truncate rounded-lg px-3 py-2 text-left text-sm ${
                    selecionadoId === c.id ? "bg-wine text-off-white" : "text-ink/70 hover:bg-baby-pink-light"
                  }`}
                >
                  {c.nome}
                </button>
                <button
                  onClick={() => handleExcluir(c.id, c.nome)}
                  title="Excluir"
                  className="hidden px-2 text-ink/30 hover:text-wine group-hover:block"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Workspace do cliente selecionado */}
      <div className="flex-1 px-6 py-7 md:px-10">
        {selecionadoId ? (
          <ClienteWorkspace clienteId={selecionadoId} />
        ) : (
          <div className="flex h-full items-center justify-center py-20 text-center text-sm text-ink/40">
            Selecione um cliente à esquerda, ou crie um novo, para começar o diagnóstico de posicionamento.
          </div>
        )}
      </div>
    </div>
  );
}

function ClienteWorkspace({ clienteId }: { clienteId: string }) {
  const { cliente, loading, salvarGeracao, salvarModulos, recarregar } = usePosicionamentoCliente(clienteId);
  const { conteudos, criarConteudo, atualizarConteudo, excluirConteudo } = usePosicionamentoConteudos(clienteId);
  const [aba, setAba] = useState<"diagnostico" | "painel" | "conteudos" | "acesso">("diagnostico");

  const chamarComToken = useCallback(async (path: string, body: Record<string, unknown>) => {
    if (!isSupabaseConfigured()) {
      return { erro: "Geração por IA e criação de acesso não funcionam em modo demonstração — conecte o Supabase (veja o README)." };
    }
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const resp = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify(body),
    });
    const json = await resp.json();
    if (!resp.ok) return { erro: json.erro ?? "Não foi possível agora." };
    return json;
  }, []);

  const handleGerar = useCallback(
    async (transcricao: string) => {
      const resultado = await chamarComToken("/api/posicionamento/gerar", { transcricao });
      if (resultado.erro) return { ok: false, erro: resultado.erro as string };
      await salvarGeracao(resultado.transcricao as string, resultado.modulos as PosicionamentoModulos);
      return { ok: true };
    },
    [chamarComToken, salvarGeracao]
  );

  const handleCriarAcesso = useCallback(
    async (dados: { email: string; senha: string; nome: string }) => {
      const resultado = await chamarComToken("/api/posicionamento/criar-acesso", {
        clienteId,
        ...dados,
      });
      if (resultado.erro) return { ok: false, erro: resultado.erro as string };
      await recarregar();
      return { ok: true };
    },
    [chamarComToken, clienteId, recarregar]
  );

  if (loading || !cliente) {
    return <p className="text-sm text-ink/50">Carregando...</p>;
  }

  return (
    <div>
      <h2 className="mb-1 font-editorial text-2xl font-semibold text-ink">{cliente.nome}</h2>
      <p className="mb-6 text-sm text-ink/45">Dossiê Estratégico — Posicionamento de Valor</p>

      <Abas
        aba={aba}
        onChange={(v) => setAba(v as typeof aba)}
        itens={[
          { v: "diagnostico", label: "Diagnóstico" },
          { v: "painel", label: "Painel Estratégico" },
          { v: "conteudos", label: "Conteúdos" },
          { v: "acesso", label: "Acesso do cliente" },
        ]}
      />

      <div className="mt-6">
        {aba === "diagnostico" && <DiagnosticoPainel cliente={cliente} onGerar={handleGerar} />}
        {aba === "painel" && (
          <PainelEstrategico modulos={cliente.modulos} readOnly={false} onSalvar={salvarModulos} />
        )}
        {aba === "conteudos" && (
          <ConteudosPainel
            conteudos={conteudos}
            readOnly={false}
            onCriar={criarConteudo}
            onAtualizar={atualizarConteudo}
            onExcluir={excluirConteudo}
          />
        )}
        {aba === "acesso" && <AcessoPainel cliente={cliente} onCriarAcesso={handleCriarAcesso} />}
      </div>
    </div>
  );
}

function Abas({
  aba,
  onChange,
  itens,
}: {
  aba: string;
  onChange: (v: string) => void;
  itens: { v: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line">
      {itens.map((item) => (
        <button
          key={item.v}
          onClick={() => onChange(item.v)}
          className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            aba === item.v
              ? "border-wine text-wine"
              : "border-transparent text-ink/50 hover:text-ink"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
