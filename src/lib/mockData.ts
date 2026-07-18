import { AnalisePost, Lead, Post, SeguidoresSnapshot } from "./types";

const hoje = new Date();
function diasA (offset: number) {
  const d = new Date(hoje);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

export const MOCK_EQUIPE = [
  { id: "u1", nome: "Laize", papel: "admin" as const },
  { id: "u2", nome: "Ana (Designer)", papel: "designer" as const },
  { id: "u3", nome: "Rafa (Social Media)", papel: "social_media" as const },
];

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    titulo: "Bastidores da coleção nova",
    legenda: "Um giro rápido pelos bastidores da nova coleção ✨",
    hashtags: "#bastidores #novacolecao #moda",
    roteiro:
      "Gancho: \"Você não faz ideia do que acontece antes de uma peça chegar até você\"...\nDesenvolvimento: mostrar bastidores, equipe, processo.\nCTA: \"Comenta qual peça você quer ver primeiro\".",
    categoria: "marca_pessoal_branding",
    tipo: "reel",
    status: "ideia",
    data_publicacao: diasA(2),
    responsavel_nome: "Laize",
    designer_nome: "Ana (Designer)",
    artes: [],
    comentarios: [],
    criado_em: diasA(-3),
    ordem: 1,
  },
  {
    id: "p2",
    titulo: "Carrossel: 5 dicas de styling",
    legenda: "Separamos 5 dicas para combinar as peças da semana.",
    hashtags: "#styling #dicas #outfit",
    roteiro:
      "Slide 1: 5 dicas de styling que você precisa saber\nSlide 2: Dica 1 — invista em peças-base\nSlide 3: Dica 2 — combine texturas\nSlide 4: Dica 3 — acessórios fazem a diferença\nSlide 5: Chamada para salvar o post",
    categoria: "autoridade_presenca_feminina",
    tipo: "carrossel",
    status: "copy_concluida",
    data_publicacao: diasA(3),
    responsavel_nome: "Rafa (Social Media)",
    designer_nome: "Ana (Designer)",
    artes: [],
    comentarios: [
      {
        id: "c1",
        post_id: "p2",
        autor_id: "u1",
        autor_nome: "Laize",
        texto: "Adorei a direção! Só ajusta a fonte do slide 3.",
        criado_em: diasA(-1),
      },
    ],
    criado_em: diasA(-5),
    ordem: 2,
  },
  {
    id: "p3",
    titulo: "Stories: enquete de sexta",
    legenda: "Enquete rápida perguntando qual peça favorita da semana.",
    hashtags: "#enquete #sexta",
    tipo: "estatico",
    status: "design_concluido",
    data_publicacao: diasA(1),
    responsavel_nome: "Rafa (Social Media)",
    designer_nome: "Ana (Designer)",
    artes: [],
    comentarios: [],
    criado_em: diasA(-2),
    ordem: 3,
  },
  {
    id: "p4",
    titulo: "Feed: lançamento cápsula verão",
    legenda: "Chegou a cápsula de verão! Confira no link da bio.",
    hashtags: "#lancamento #verao #capsula",
    tipo: "estatico",
    status: "agendado",
    data_publicacao: diasA(1),
    responsavel_nome: "Laize",
    designer_nome: "Ana (Designer)",
    artes: [],
    comentarios: [],
    criado_em: diasA(-6),
    ordem: 4,
  },
  {
    id: "p5",
    titulo: "Reels: making of ensaio",
    legenda: "Making of do último ensaio fotográfico.",
    hashtags: "#makingof #ensaio",
    tipo: "reel",
    status: "postado",
    data_publicacao: diasA(-1),
    responsavel_nome: "Rafa (Social Media)",
    designer_nome: "Ana (Designer)",
    artes: [],
    comentarios: [],
    criado_em: diasA(-8),
    ordem: 5,
  },
  {
    id: "p6",
    titulo: "Feed: cliente em destaque",
    legenda: "Uma cliente linda usando nossas peças.",
    hashtags: "#clienteemdestaque",
    tipo: "estatico",
    status: "postado",
    data_publicacao: diasA(-4),
    responsavel_nome: "Laize",
    designer_nome: "Ana (Designer)",
    artes: [],
    comentarios: [],
    criado_em: diasA(-10),
    ordem: 6,
  },
];

export const MOCK_ANALISES: AnalisePost[] = [
  {
    post_id: "p5",
    coletado_em: diasA(0),
    curtidas: 842,
    comentarios: 37,
    compartilhamentos: 58,
    salvamentos: 120,
    alcance: 9800,
    impressoes: 12400,
  },
  {
    post_id: "p6",
    coletado_em: diasA(-3),
    curtidas: 1210,
    comentarios: 64,
    compartilhamentos: 91,
    salvamentos: 205,
    alcance: 15600,
    impressoes: 19800,
  },
];

export const MOCK_LEADS: Lead[] = [
  {
    id: "l1",
    nome: "Camila Ferreira",
    telefone: "+55 11 98888-1234",
    origem: "whatsapp",
    status: "conversa_iniciada",
    notas: "",
    responsavel_nome: "Laize",
    valor_proposta: null,
    ultima_mensagem: "Oi! Vi o story de vocês, queria saber mais sobre a assessoria.",
    ultima_mensagem_em: diasA(0),
    mensagens: [
      {
        id: "m1",
        lead_id: "l1",
        direcao: "recebida",
        texto: "Oi! Vi o story de vocês, queria saber mais sobre a assessoria.",
        criado_em: diasA(0),
      },
    ],
    criado_em: diasA(0),
    atualizado_em: diasA(0),
  },
  {
    id: "l2",
    nome: "Beatriz Souza",
    telefone: "+55 21 97777-5678",
    origem: "whatsapp",
    status: "reuniao_agendada",
    notas: "Reunião marcada para quinta às 15h.",
    responsavel_nome: "Laize",
    valor_proposta: null,
    ultima_mensagem: "Perfeito, te vejo quinta então!",
    ultima_mensagem_em: diasA(-1),
    mensagens: [],
    criado_em: diasA(-3),
    atualizado_em: diasA(-1),
  },
  {
    id: "l3",
    nome: "Renata Alves",
    telefone: "+55 41 96666-4321",
    origem: "manual",
    status: "proposta_enviada",
    notas: "Enviada proposta do plano trimestral.",
    responsavel_nome: "Laize",
    valor_proposta: 4500,
    ultima_mensagem: null,
    ultima_mensagem_em: null,
    mensagens: [],
    criado_em: diasA(-6),
    atualizado_em: diasA(-2),
  },
  {
    id: "l4",
    nome: "Juliana Prado",
    telefone: "+55 31 95555-8765",
    origem: "whatsapp",
    status: "fechado",
    notas: "Fechou o plano anual.",
    responsavel_nome: "Laize",
    valor_proposta: 12000,
    ultima_mensagem: "Fechado, bora começar!",
    ultima_mensagem_em: diasA(-8),
    mensagens: [],
    criado_em: diasA(-12),
    atualizado_em: diasA(-8),
  },
  {
    id: "l5",
    nome: "Patrícia Nogueira",
    telefone: "+55 51 94444-2211",
    email: "patricia.nogueira@exemplo.com",
    origem: "hubla",
    status: "fechado",
    notas: "",
    responsavel_nome: null,
    valor_proposta: 6000,
    ultima_mensagem: "Link de agendamento enviado por WhatsApp: https://calendar.app.google/zFyfAuddQbUd7wH76",
    ultima_mensagem_em: diasA(-1),
    convite_agendamento_enviado_em: diasA(-1),
    consultoria_agendada_em: null,
    mensagens: [],
    criado_em: diasA(-1),
    atualizado_em: diasA(-1),
  },
];

export const MOCK_SEGUIDORES: SeguidoresSnapshot[] = Array.from({ length: 14 }).map(
  (_, i) => {
    const dias = -13 + i;
    const base = 8200;
    const crescimento = Math.round(dias * 12 + Math.sin(dias / 2) * 20);
    return {
      data: diasA(dias),
      seguidores: base + crescimento + i * 4,
    };
  }
);
