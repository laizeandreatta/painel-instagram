export type PostStatus =
  | "ideia"
  | "copy_concluida"
  | "design_concluido"
  | "agendado"
  | "postado";

export type PostType = "estatico" | "reel" | "carrossel";

export type Categoria =
  | "saude_mental_bem_estar"
  | "mentalidade_sucesso"
  | "autoridade_presenca_feminina"
  | "autoestima_autoconhecimento"
  | "carreira_posicionamento"
  | "produto_promocional"
  | "marca_pessoal_branding"
  | "financas_femininas"
  | "negocios_digitais"
  | "marketing_conteudo"
  | "nostalgia_comunidade"
  | "relacionamentos_comportamento_social";

export type Profile = {
  id: string;
  nome: string;
  email: string;
  papel: "admin" | "designer" | "editor" | "social_media";
  avatar_url?: string | null;
};

export type Comentario = {
  id: string;
  post_id: string;
  autor_id: string;
  autor_nome: string;
  texto: string;
  criado_em: string;
};

export type ArteUpload = {
  id: string;
  post_id: string;
  url: string;
  nome_arquivo: string;
  enviado_por: string;
  criado_em: string;
};

export type Post = {
  id: string;
  titulo: string;
  legenda: string;
  hashtags: string;
  roteiro?: string | null;
  categoria?: Categoria | null;
  tipo: PostType;
  status: PostStatus;
  data_publicacao: string; // ISO date
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  designer_id?: string | null;
  designer_nome?: string | null;
  artes: ArteUpload[];
  comentarios: Comentario[];
  criado_em: string;
  ig_media_id?: string | null;
  ordem: number;
};

export type AnalisePost = {
  post_id: string;
  coletado_em: string;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  salvamentos: number;
  alcance: number;
  impressoes: number;
};

export type SeguidoresSnapshot = {
  data: string; // ISO date
  seguidores: number;
};

// Banco de fotos: imagens soltas (não ligadas a um post específico) que
// qualquer pessoa da equipe envia para que a designer tenha acesso direto.
export type Foto = {
  id: string;
  url: string;
  nome_arquivo: string;
  enviado_por: string;
  criado_em: string;
};

// Identidade visual: paleta de cores, tipografia e moodboard de referência.
export type CorPaleta = {
  id: string;
  nome: string;
  hex: string;
  ordem: number;
  criado_em: string;
};

export type Tipografia = {
  id: string;
  nome: string;
  uso?: string | null;
  url_referencia?: string | null;
  ordem: number;
  criado_em: string;
};

export type MoodboardImagem = {
  id: string;
  url: string;
  nome_arquivo: string;
  enviado_por: string;
  criado_em: string;
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  ideia: "Ideia",
  copy_concluida: "Copy concluída",
  design_concluido: "Design concluído",
  agendado: "Agendado",
  postado: "Postado",
};

export const STATUS_ORDER: PostStatus[] = [
  "ideia",
  "copy_concluida",
  "design_concluido",
  "agendado",
  "postado",
];

export const TIPO_LABELS: Record<PostType, string> = {
  estatico: "Estático",
  reel: "Reel",
  carrossel: "Carrossel",
};

export const TIPO_ORDER: PostType[] = ["estatico", "reel", "carrossel"];

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  saude_mental_bem_estar: "Saúde Mental & Bem-estar",
  mentalidade_sucesso: "Mentalidade & Sucesso / filosofia aplicada",
  autoridade_presenca_feminina: "Autoridade & Presença Feminina",
  autoestima_autoconhecimento: "Autoestima & Autoconhecimento / relações",
  carreira_posicionamento: "Carreira & Posicionamento Profissional",
  produto_promocional: "Produto & Promocional",
  marca_pessoal_branding: "Marca Pessoal & Branding",
  financas_femininas: "Finanças Femininas",
  negocios_digitais: "Negócios Digitais",
  marketing_conteudo: "Marketing e Conteúdo",
  nostalgia_comunidade: "Nostalgia & Comunidade / Institucional",
  relacionamentos_comportamento_social: "Relacionamentos & Comportamento Social",
};

export const CATEGORIA_ORDER: Categoria[] = [
  "saude_mental_bem_estar",
  "mentalidade_sucesso",
  "autoridade_presenca_feminina",
  "autoestima_autoconhecimento",
  "carreira_posicionamento",
  "produto_promocional",
  "marca_pessoal_branding",
  "financas_femininas",
  "negocios_digitais",
  "marketing_conteudo",
  "nostalgia_comunidade",
  "relacionamentos_comportamento_social",
];

// Tons suaves e distintos para identificar cada assunto rapidamente nos
// cards e etiquetas, mantendo a paleta editorial (vinho/off-white/rosa).
export const CATEGORIA_CORES: Record<Categoria, { bg: string; text: string }> = {
  saude_mental_bem_estar: { bg: "#E4EDE5", text: "#3F5D46" },
  mentalidade_sucesso: { bg: "#F4E9D8", text: "#7A5A24" },
  autoridade_presenca_feminina: { bg: "#F4DEE3", text: "#6D1F30" },
  autoestima_autoconhecimento: { bg: "#EAE3F4", text: "#55407A" },
  carreira_posicionamento: { bg: "#DCE7F0", text: "#2C4A66" },
  produto_promocional: { bg: "#F7E3D3", text: "#8A4A1E" },
  marca_pessoal_branding: { bg: "#F1DCE0", text: "#7A3040" },
  financas_femininas: { bg: "#D9EEE9", text: "#1F6B58" },
  negocios_digitais: { bg: "#E2E5F0", text: "#3A4470" },
  marketing_conteudo: { bg: "#F6EFD0", text: "#8A6D12" },
  nostalgia_comunidade: { bg: "#F0E6D8", text: "#6B5535" },
  relacionamentos_comportamento_social: { bg: "#F5D9D4", text: "#8C3D2E" },
};
