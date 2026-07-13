"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "./supabase";
import { MOCK_POSTS } from "./mockData";
import { Comentario, Post, PostStatus } from "./types";

/**
 * Hook central de dados dos posts.
 *
 * Em "modo demo" (sem Supabase configurado) os dados vivem em memória,
 * então dá pra testar o painel inteiro sem precisar criar conta em
 * nenhum lugar. Assim que as variáveis de ambiente do Supabase forem
 * preenchidas (veja o README), o mesmo hook passa a ler e gravar no
 * banco de dados real, compartilhado com toda a equipe.
 */
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>(isSupabaseConfigured() ? [] : MOCK_POSTS);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const demoMode = !isSupabaseConfigured();

  const carregar = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("data_publicacao", { ascending: true });

    const { data: artesData } = await supabase.from("artes").select("*");
    const { data: comentariosData } = await supabase
      .from("comentarios")
      .select("*")
      .order("criado_em", { ascending: true });

    const posts: Post[] = (postsData ?? []).map((p) => ({
      ...p,
      artes: (artesData ?? []).filter((a) => a.post_id === p.id),
      comentarios: (comentariosData ?? []).filter((c) => c.post_id === p.id),
    }));

    setPosts(posts);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const atualizarStatus = useCallback(
    async (postId: string, status: PostStatus) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status } : p))
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("posts").update({ status }).eq("id", postId);
      }
    },
    []
  );

  const criarPost = useCallback(async (novo: Partial<Post>) => {
    const id = `p-${Date.now()}`;
    const post: Post = {
      id,
      titulo: novo.titulo ?? "Novo post",
      legenda: novo.legenda ?? "",
      hashtags: novo.hashtags ?? "",
      roteiro: novo.roteiro ?? "",
      categoria: novo.categoria ?? null,
      tipo: novo.tipo ?? "estatico",
      status: novo.status ?? "ideia",
      data_publicacao: novo.data_publicacao ?? new Date().toISOString(),
      responsavel_nome: novo.responsavel_nome ?? null,
      designer_nome: novo.designer_nome ?? null,
      artes: [],
      comentarios: [],
      criado_em: new Date().toISOString(),
    };
    setPosts((prev) => [...prev, post]);

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("posts").insert({
        id,
        titulo: post.titulo,
        legenda: post.legenda,
        hashtags: post.hashtags,
        roteiro: post.roteiro,
        categoria: post.categoria,
        tipo: post.tipo,
        status: post.status,
        data_publicacao: post.data_publicacao,
      });
    }
    return post;
  }, []);

  const adicionarComentario = useCallback(
    async (postId: string, texto: string, autorNome: string, autorId: string) => {
      const comentario: Comentario = {
        id: `c-${Date.now()}`,
        post_id: postId,
        autor_id: autorId,
        autor_nome: autorNome,
        texto,
        criado_em: new Date().toISOString(),
      };
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comentarios: [...p.comentarios, comentario] }
            : p
        )
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("comentarios").insert({
          id: comentario.id,
          post_id: postId,
          autor_id: autorId,
          autor_nome: autorNome,
          texto,
        });
      }
    },
    []
  );

  const adicionarArte = useCallback(async (postId: string, url: string, nomeArquivo: string, enviadoPor: string) => {
    const arte = {
      id: `a-${Date.now()}`,
      post_id: postId,
      url,
      nome_arquivo: nomeArquivo,
      enviado_por: enviadoPor,
      criado_em: new Date().toISOString(),
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, artes: [...p.artes, arte] } : p
      )
    );
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("artes").insert(arte);
    }
  }, []);

  const atualizarIgMediaId = useCallback(
    async (postId: string, igMediaId: string) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ig_media_id: igMediaId } : p))
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from("posts")
          .update({ ig_media_id: igMediaId })
          .eq("id", postId);
      }
    },
    []
  );

  const atualizarRoteiro = useCallback(
    async (postId: string, roteiro: string) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, roteiro } : p))
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("posts").update({ roteiro }).eq("id", postId);
      }
    },
    []
  );

  const atualizarCategoria = useCallback(
    async (postId: string, categoria: Post["categoria"]) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, categoria } : p))
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("posts").update({ categoria }).eq("id", postId);
      }
    },
    []
  );

  // Atualização genérica de campos (legenda, hashtags, responsável,
  // designer etc.) — usada pelos campos editáveis da página do post.
  const atualizarCampos = useCallback(
    async (postId: string, patch: Partial<Post>) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...patch } : p))
      );
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.from("posts").update(patch).eq("id", postId);
      }
    },
    []
  );

  // Exclui um conteúdo por completo (e, por cascade no banco, suas artes
  // e comentários junto). Usado quando um conteúdo planejado deixou de
  // fazer sentido e precisa sair do painel de vez.
  const excluirPost = useCallback(async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("posts").delete().eq("id", postId);
    }
  }, []);

  return {
    posts,
    loading,
    demoMode,
    atualizarStatus,
    criarPost,
    adicionarComentario,
    adicionarArte,
    atualizarIgMediaId,
    atualizarRoteiro,
    atualizarCategoria,
    atualizarCampos,
    excluirPost,
    recarregar: carregar,
  };
}
