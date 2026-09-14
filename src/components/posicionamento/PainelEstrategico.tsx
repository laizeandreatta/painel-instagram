"use client";

import { useState } from "react";
import { ChevronDown, Save } from "lucide-react";
import { MODULOS } from "@/lib/posicionamentoModulos";
import { PosicionamentoModulos } from "@/lib/types";

type Props = {
  modulos: PosicionamentoModulos;
  readOnly: boolean;
  onSalvar?: (modulos: PosicionamentoModulos) => Promise<void>;
};

export function PainelEstrategico({ modulos, readOnly, onSalvar }: Props) {
  const [aberto, setAberto] = useState<string | null>(MODULOS[0]?.num ?? null);
  const [rascunhos, setRascunhos] = useState<PosicionamentoModulos>(modulos);
  const [salvando, setSalvando] = useState<string | null>(null);

  // Se o cliente mudou (ex: acabou de gerar via IA), os rascunhos locais
  // precisam refletir o novo conteúdo vindo de fora.
  const chaveAtual = JSON.stringify(modulos);
  const [ultimaChave, setUltimaChave] = useState(chaveAtual);
  if (chaveAtual !== ultimaChave) {
    setUltimaChave(chaveAtual);
    setRascunhos(modulos);
  }

  async function salvarModulo(num: string) {
    if (!onSalvar) return;
    setSalvando(num);
    await onSalvar(rascunhos);
    setSalvando(null);
  }

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      {MODULOS.map((m) => {
        const dados = rascunhos[m.num] ?? { declaracao: "", respostas: [] };
        const preenchido = Boolean(dados.declaracao?.trim());
        const expandido = aberto === m.num;

        return (
          <div key={m.num} className="overflow-hidden rounded-xl border border-line bg-white">
            <button
              onClick={() => setAberto(expandido ? null : m.num)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div className="flex items-center gap-4">
                <span className="font-editorial text-lg italic text-wine">{m.num}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{m.titulo}</p>
                  <p className="text-xs text-ink/45">{m.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!preenchido && (
                  <span className="rounded-full bg-baby-pink-light px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-bordeaux">
                    Vazio
                  </span>
                )}
                <ChevronDown
                  size={16}
                  className={`text-ink/40 transition-transform ${expandido ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {expandido && (
              <div className="border-t border-line px-5 py-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/50">
                  Declaração de síntese
                </label>
                {readOnly ? (
                  dados.declaracao ? (
                    <p className="mb-5 rounded-lg border-l-2 border-wine bg-baby-pink-light px-4 py-3 font-editorial text-base italic text-ink">
                      &quot;{dados.declaracao}&quot;
                    </p>
                  ) : (
                    <p className="mb-5 text-sm text-ink/40">Ainda não preenchido.</p>
                  )
                ) : (
                  <textarea
                    value={dados.declaracao}
                    onChange={(e) =>
                      setRascunhos((prev) => ({
                        ...prev,
                        [m.num]: { ...dados, declaracao: e.target.value },
                      }))
                    }
                    rows={2}
                    className="mb-5 w-full resize-y rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                  />
                )}

                <div className="flex flex-col gap-4">
                  {m.perguntas.map((p, i) => {
                    const resposta = dados.respostas?.[i] ?? "";
                    return (
                      <div key={i}>
                        <p className="mb-1 text-xs text-ink/50">{p.q}</p>
                        {readOnly ? (
                          <p className="text-sm text-ink">{resposta || "—"}</p>
                        ) : (
                          <textarea
                            value={resposta}
                            onChange={(e) => {
                              const novasRespostas = [...(dados.respostas ?? [])];
                              novasRespostas[i] = e.target.value;
                              setRascunhos((prev) => ({
                                ...prev,
                                [m.num]: { ...dados, respostas: novasRespostas },
                              }));
                            }}
                            rows={2}
                            className="w-full resize-y rounded-lg border border-line bg-off-white px-3 py-2 text-sm outline-none focus:border-wine"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {!readOnly && (
                  <button
                    onClick={() => salvarModulo(m.num)}
                    disabled={salvando === m.num}
                    className="mt-5 flex items-center gap-1.5 rounded-lg border border-line bg-off-white px-4 py-2 text-sm font-medium text-ink hover:border-wine hover:text-wine disabled:opacity-50"
                  >
                    <Save size={14} />
                    {salvando === m.num ? "Salvando..." : "Salvar módulo"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
