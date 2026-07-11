export type PostStatus =
  | "ideia"
  | "producao"
  | "aprovacao"
  | "agendado"
  | "publicado";

export type PostType = "feed" | "stories" | "reels" | "carrossel";

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

export const STATUS_LABELS: Record<PostStatus, string> = {
  ideia: "Ideia",
  producao: "Em produção",
  aprovacao: "Em aprovação",
  agendado: "Agendado",
  publicado: "Publicado",
};

export const STATUS_ORDER: PostStatus[] = [
  "ideia",
  "producao",
  "aprovacao",
  "agendado",
  "publicado",
];

export const TIPO_LABELS: Record<PostType, string> = {
  feed: "Feed",
  stories: "Stories",
  reels: "Reels",
  carrossel: "Carrossel",
};
