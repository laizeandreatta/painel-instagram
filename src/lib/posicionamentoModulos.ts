// Os 12 módulos do dossiê de Posicionamento de Valor: metadados fixos
// (título, descrição curta, roteiro de perguntas) usados tanto pela tela
// de diagnóstico/edição quanto pelo prompt de geração por IA
// (/api/posicionamento/gerar). Mudar o texto aqui muda em todo lugar.

export type PosicionamentoPergunta = {
  q: string;
  h?: string; // dica opcional, mostrada em cinza abaixo da pergunta
};

export type PosicionamentoModuloMeta = {
  num: string; // "01".."12", sempre com zero à esquerda
  titulo: string;
  desc: string;
  perguntas: PosicionamentoPergunta[];
};

export const MODULOS: PosicionamentoModuloMeta[] = [
  {
    num: "01",
    titulo: "Investigação de Posicionamento",
    desc: "Posicionamento atual, potencial e desejado.",
    perguntas: [
      { q: "Como você se descreve quando alguém pergunta o que você faz?", h: "a resposta do jeito que ele diria numa festa, sem filtro" },
      { q: "O que as pessoas dizem sobre você quando você não está por perto?", h: "algum elogio ou feedback espontâneo que ficou marcado" },
      { q: "O que ele faz do seu jeito, que ninguém mais faz exatamente assim?" },
      { q: "Se daqui a três anos as pessoas o reconhecessem por uma coisa só, qual seria?" },
      { q: "O que hoje o incomoda ou confunde na forma como é percebido?" },
    ],
  },
  {
    num: "02",
    titulo: "Capital de Marca Pessoal",
    desc: "Conhecimento, provas, ativos e diferenciais.",
    perguntas: [
      { q: "Qual a formação e quanto tempo de estrada na área?" },
      { q: "Quais resultados concretos já foram entregues?", h: "números, cases, transformações reais de clientes" },
      { q: "O que já foi construído que tem valor?", h: "audiência, comunidade, parcerias, indicações" },
      { q: "O que ele sabe fazer que é difícil de copiar?" },
      { q: "Já recebeu algum reconhecimento do mercado?", h: "prêmio, convite, menção, validação de pares" },
    ],
  },
  {
    num: "03",
    titulo: "Território de Posicionamento",
    desc: "Categoria, audiência, promessa e posição.",
    perguntas: [
      { q: "Em que categoria ou mercado ele quer ser reconhecido?" },
      { q: "Quem é a pessoa que ele mais quer servir — e por quê ela?" },
      { q: "Qual é a promessa central que ele faz para essa pessoa?" },
      { q: "Com o que ele não quer ser confundido?", h: "o que definitivamente não é" },
      { q: "Se pudesse ocupar uma posição única na cabeça desse público, qual seria?" },
    ],
  },
  {
    num: "04",
    titulo: "Posicionamento Intelectual",
    desc: "Teses, argumentos, princípios e conceitos.",
    perguntas: [
      { q: "Que crença comum do mercado ele discorda ou desafia?" },
      { q: "Se tivesse que resumir seu método em uma ou duas frases, qual seria?" },
      { q: "Quais princípios guiam o trabalho dele?", h: "as coisas em que não abre mão" },
      { q: "Existe algum termo ou conceito próprio (já usado ou a criar)?" },
    ],
  },
  {
    num: "05",
    titulo: "Narrativa de Marca",
    desc: "Trajetória, transformações e visão de futuro.",
    perguntas: [
      { q: "Teve algum momento de virada na trajetória?", h: "uma decisão, um evento, uma crise que mudou tudo" },
      { q: "De onde ele veio, e o que essa mudança trouxe?" },
      { q: "Como a transformação vivida se conecta com a que ele entrega aos clientes?" },
      { q: "Onde ele quer estar daqui a alguns anos? Qual legado quer deixar?" },
    ],
  },
  {
    num: "06",
    titulo: "Sistema Verbal",
    desc: "Tom de voz, vocabulário, códigos e pitch.",
    perguntas: [
      { q: "Que adjetivos descrevem seu jeito de falar ou escrever?" },
      { q: "Existem palavras ou expressões que já são “dele”?" },
      { q: "Que tom ele definitivamente não quer ter?" },
      { q: "Como ele se apresenta hoje, em 15 segundos?" },
    ],
  },
  {
    num: "07",
    titulo: "Arquitetura de Conteúdo",
    desc: "Pilares, temas, funções e direção editorial.",
    perguntas: [
      { q: "Quais são os 3 a 5 temas que mais domina ou gosta de falar?" },
      { q: "De cada tema, qual função cumpre?", h: "atrair, educar, provar, vender, aproximar" },
      { q: "Que formatos já domina, e quais gostaria de explorar?" },
      { q: "Qual a rotina realista de produção?" },
    ],
  },
  {
    num: "08",
    titulo: "Sistema de Associações",
    desc: "Significados ligados de forma consistente ao nome.",
    perguntas: [
      { q: "Quais 3 a 5 palavras ou imagens devem vir à cabeça ao ouvir o nome dele?" },
      { q: "Existem símbolos, cores ou referências já associadas a ele — ou a adotar?" },
      { q: "Existe alguma associação a evitar a todo custo?" },
    ],
  },
  {
    num: "09",
    titulo: "Ecossistema de Presença",
    desc: "Canais, ativos próprios e ambientes relevantes.",
    perguntas: [
      { q: "Em quais canais está ativo hoje, e qual papel cada um cumpre?" },
      { q: "Já existe algum ativo próprio — lista, comunidade, site — ou precisa ser criado?" },
      { q: "Existem ambientes, eventos ou parcerias relevantes pra circular mais?" },
    ],
  },
  {
    num: "10",
    titulo: "Estratégia de Autoridade",
    desc: "Provas públicas, validação e legitimidade.",
    perguntas: [
      { q: "Que provas públicas já existem?", h: "imprensa, palestras, parcerias, prêmios, convites" },
      { q: "Que tipo de prova buscar nos próximos 6 a 12 meses?" },
      { q: "Quem hoje valida esse trabalho?" },
    ],
  },
  {
    num: "11",
    titulo: "Arquitetura Comercial",
    desc: "Ofertas, valor percebido, demanda e receita.",
    perguntas: [
      { q: "Quais são as ofertas hoje, e o papel de cada uma na jornada?" },
      { q: "Onde está a maior demanda no momento?" },
      { q: "Onde está o gargalo?", h: "preço, oferta, demanda ou capacidade de entrega" },
      { q: "Para onde a precificação precisa caminhar?" },
    ],
  },
  {
    num: "12",
    titulo: "Plano de Circulação",
    desc: "Prioridades para consolidar, circular e legitimar.",
    perguntas: [
      { q: "Quais são as 3 prioridades mais urgentes pros próximos 90 dias?" },
      { q: "O que precisa ser consolidado antes de escalar?" },
      { q: "Como esse posicionamento deve circular?", h: "em quais espaços, com quem, com que frequência" },
    ],
  },
];

export const MODULO_NUMS = MODULOS.map((m) => m.num);

export function modulosVazios(): Record<string, { declaracao: string; respostas: string[] }> {
  const out: Record<string, { declaracao: string; respostas: string[] }> = {};
  MODULOS.forEach((m) => {
    out[m.num] = { declaracao: "", respostas: m.perguntas.map(() => "") };
  });
  return out;
}

export const STATUS_CONTEUDO_OPTS: { v: string; label: string }[] = [
  { v: "ideia", label: "Ideia" },
  { v: "producao", label: "Em produção" },
  { v: "agendado", label: "Agendado" },
  { v: "publicado", label: "Publicado" },
];

export function statusConteudoLabel(status: string): string {
  return STATUS_CONTEUDO_OPTS.find((s) => s.v === status)?.label ?? status;
}
