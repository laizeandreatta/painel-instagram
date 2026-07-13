import { AnalisePost, Post, SeguidoresSnapshot } from "./types";

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
