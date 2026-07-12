-- =========================================================================
-- Painel de Conteúdo do Instagram — schema do banco de dados (Supabase)
-- =========================================================================
-- Como usar: copie todo este arquivo e cole no "SQL Editor" do seu
-- projeto Supabase (menu lateral > SQL Editor > New query), depois
-- clique em "Run". Veja o passo a passo completo no README.md.
-- =========================================================================

-- Perfis da equipe (um por pessoa, ligado ao login do Supabase Auth)
create table if not exists perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  papel text not null default 'editor' check (papel in ('admin', 'designer', 'editor', 'social_media')),
  avatar_url text,
  criado_em timestamptz not null default now()
);

-- Conteúdos planejados
create table if not exists posts (
  id text primary key,
  titulo text not null,
  legenda text default '',
  hashtags text default '',
  roteiro text default '',
  categoria text check (categoria in (
    'saude_mental_bem_estar',
    'mentalidade_sucesso',
    'autoridade_presenca_feminina',
    'autoestima_autoconhecimento',
    'carreira_posicionamento',
    'produto_promocional',
    'marca_pessoal_branding',
    'financas_femininas',
    'nostalgia_comunidade'
  )),
  tipo text not null default 'feed' check (tipo in ('feed', 'stories', 'reels', 'carrossel')),
  status text not null default 'ideia' check (status in ('ideia', 'producao', 'aprovacao', 'agendado', 'publicado')),
  data_publicacao timestamptz not null,
  responsavel_id uuid references perfis (id),
  responsavel_nome text,
  designer_id uuid references perfis (id),
  designer_nome text,
  ig_media_id text,
  criado_em timestamptz not null default now()
);

-- Artes / imagens enviadas para cada post
create table if not exists artes (
  id text primary key,
  post_id text not null references posts (id) on delete cascade,
  url text not null,
  nome_arquivo text,
  enviado_por text,
  criado_em timestamptz not null default now()
);

-- Comentários / fluxo de aprovação
create table if not exists comentarios (
  id text primary key,
  post_id text not null references posts (id) on delete cascade,
  autor_id uuid,
  autor_nome text,
  texto text not null,
  criado_em timestamptz not null default now()
);

-- Resultado de desempenho de cada post, coletado 24h após publicação
create table if not exists analises_posts (
  id bigint generated always as identity primary key,
  post_id text not null references posts (id) on delete cascade,
  coletado_em timestamptz not null default now(),
  curtidas int default 0,
  comentarios int default 0,
  compartilhamentos int default 0,
  salvamentos int default 0,
  alcance int default 0,
  impressoes int default 0
);

-- Histórico de número de seguidores, para o gráfico de crescimento
create table if not exists seguidores_historico (
  id bigint generated always as identity primary key,
  data timestamptz not null default now(),
  seguidores int not null
);

-- =========================================================================
-- Segurança (Row Level Security): qualquer pessoa da equipe autenticada
-- pode ler e escrever. Ajuste depois se quiser regras mais restritas
-- (ex: só admin edita analytics).
-- =========================================================================

alter table perfis enable row level security;
alter table posts enable row level security;
alter table artes enable row level security;
alter table comentarios enable row level security;
alter table analises_posts enable row level security;
alter table seguidores_historico enable row level security;

create policy "equipe le perfis" on perfis for select using (auth.role() = 'authenticated');
create policy "equipe edita proprio perfil" on perfis for update using (auth.uid() = id);
create policy "equipe cria proprio perfil" on perfis for insert with check (auth.uid() = id);

create policy "equipe le posts" on posts for select using (auth.role() = 'authenticated');
create policy "equipe cria posts" on posts for insert with check (auth.role() = 'authenticated');
create policy "equipe edita posts" on posts for update using (auth.role() = 'authenticated');
create policy "equipe apaga posts" on posts for delete using (auth.role() = 'authenticated');

create policy "equipe le artes" on artes for select using (auth.role() = 'authenticated');
create policy "equipe cria artes" on artes for insert with check (auth.role() = 'authenticated');

create policy "equipe le comentarios" on comentarios for select using (auth.role() = 'authenticated');
create policy "equipe cria comentarios" on comentarios for insert with check (auth.role() = 'authenticated');

create policy "equipe le analises" on analises_posts for select using (auth.role() = 'authenticated');
create policy "equipe le seguidores" on seguidores_historico for select using (auth.role() = 'authenticated');

-- As tabelas analises_posts e seguidores_historico só recebem escrita pela
-- rota /api/instagram/sync, que usa a service role key (acesso total,
-- ignora RLS) — por isso não têm policy de insert para usuários comuns.

-- =========================================================================
-- Cria automaticamente um perfil na tabela "perfis" sempre que alguém
-- é convidado / cria conta no Supabase Auth.
-- =========================================================================
create or replace function public.criar_perfil_novo_usuario()
returns trigger as $$
begin
  insert into public.perfis (id, nome, email, papel)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email, 'editor')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute procedure public.criar_perfil_novo_usuario();

-- =========================================================================
-- Storage: bucket para as artes/imagens enviadas pela designer
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('artes', 'artes', true)
on conflict (id) do nothing;

create policy "leitura publica das artes" on storage.objects
  for select using (bucket_id = 'artes');

create policy "equipe envia artes" on storage.objects
  for insert with check (bucket_id = 'artes' and auth.role() = 'authenticated');

-- =========================================================================
-- Migração: adiciona os campos "roteiro" (conteúdo do carrossel/reel) e
-- "categoria" (assunto do conteúdo) em um banco que já existia antes
-- dessas colunas serem criadas. Pode rodar de novo sem problema.
-- =========================================================================
alter table posts add column if not exists roteiro text default '';
alter table posts add column if not exists categoria text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_categoria_check'
  ) then
    alter table posts add constraint posts_categoria_check check (categoria in (
      'saude_mental_bem_estar',
      'mentalidade_sucesso',
      'autoridade_presenca_feminina',
      'autoestima_autoconhecimento',
      'carreira_posicionamento',
      'produto_promocional',
      'marca_pessoal_branding',
      'financas_femininas',
      'nostalgia_comunidade'
    ));
  end if;
end $$;
