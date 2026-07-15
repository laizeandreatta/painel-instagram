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
    'negocios_digitais',
    'nostalgia_comunidade',
    'relacionamentos_comportamento_social'
  )),
  tipo text not null default 'estatico' check (tipo in ('estatico', 'reel', 'carrossel')),
  status text not null default 'ideia' check (status in ('ideia', 'copy_concluida', 'design_concluido', 'agendado', 'postado')),
  data_publicacao timestamptz not null,
  responsavel_id uuid references perfis (id),
  responsavel_nome text,
  designer_id uuid references perfis (id),
  designer_nome text,
  ig_media_id text,
  ordem double precision not null default 0,
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

-- =========================================================================
-- Migração: novas colunas do quadro Kanban. Antes tínhamos "Ideia",
-- "Em produção", "Em aprovação", "Agendado", "Publicado" — agora ficou
-- "Ideia", "Copy concluída", "Design concluído", "Agendado", "Postado".
-- Primeiro remove a regra antiga (senão os updates abaixo são barrados
-- por ela), remapeia os posts que já existem para os novos valores, e
-- só então recria a regra já com os novos valores permitidos.
-- =========================================================================
alter table posts drop constraint if exists posts_status_check;

update posts set status = 'copy_concluida' where status = 'producao';
update posts set status = 'design_concluido' where status = 'aprovacao';
update posts set status = 'postado' where status = 'publicado';

alter table posts add constraint posts_status_check check (status in (
  'ideia', 'copy_concluida', 'design_concluido', 'agendado', 'postado'
));
alter table posts alter column status set default 'ideia';

-- =========================================================================
-- Migração: novo formato de tipos de conteúdo. Antes tínhamos "Feed",
-- "Stories", "Reels" e "Carrossel" — agora ficou só "Estático", "Reel" e
-- "Carrossel" (Stories foi removido). Remapeia os posts que já existem:
-- "feed" e "stories" viram "estatico", "reels" vira "reel".
-- =========================================================================
alter table posts drop constraint if exists posts_tipo_check;

update posts set tipo = 'estatico' where tipo = 'feed';
update posts set tipo = 'estatico' where tipo = 'stories';
update posts set tipo = 'reel' where tipo = 'reels';

alter table posts add constraint posts_tipo_check check (tipo in (
  'estatico', 'reel', 'carrossel'
));
alter table posts alter column tipo set default 'estatico';

-- =========================================================================
-- Migração: nova editoria "Relacionamentos & Comportamento Social" nos
-- assuntos possíveis de um conteúdo. Não remapeia nada (é só uma opção
-- nova), só amplia a regra de valores permitidos.
-- =========================================================================
alter table posts drop constraint if exists posts_categoria_check;

alter table posts add constraint posts_categoria_check check (categoria in (
  'saude_mental_bem_estar',
  'mentalidade_sucesso',
  'autoridade_presenca_feminina',
  'autoestima_autoconhecimento',
  'carreira_posicionamento',
  'produto_promocional',
  'marca_pessoal_branding',
  'financas_femininas',
  'nostalgia_comunidade',
  'relacionamentos_comportamento_social'
));

-- =========================================================================
-- Novidade: banco de fotos (soltas, não ligadas a um post) para a
-- designer ter acesso direto ao que a equipe sobe, e identidade visual
-- (paleta de cores, tipografia, moodboard) editável pelo painel.
-- =========================================================================

-- Banco de fotos
create table if not exists fotos (
  id text primary key,
  url text not null,
  nome_arquivo text,
  enviado_por text,
  criado_em timestamptz not null default now()
);

alter table fotos enable row level security;
create policy "equipe le fotos" on fotos for select using (auth.role() = 'authenticated');
create policy "equipe envia fotos" on fotos for insert with check (auth.role() = 'authenticated');
create policy "equipe apaga fotos" on fotos for delete using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

create policy "leitura publica das fotos" on storage.objects
  for select using (bucket_id = 'fotos');
create policy "equipe envia arquivos de fotos" on storage.objects
  for insert with check (bucket_id = 'fotos' and auth.role() = 'authenticated');
create policy "equipe apaga arquivos de fotos" on storage.objects
  for delete using (bucket_id = 'fotos' and auth.role() = 'authenticated');

-- Identidade visual: paleta de cores
create table if not exists paleta_cores (
  id text primary key,
  nome text not null,
  hex text not null,
  ordem bigint not null default 0,
  criado_em timestamptz not null default now()
);

alter table paleta_cores enable row level security;
create policy "equipe le paleta" on paleta_cores for select using (auth.role() = 'authenticated');
create policy "equipe cria cores" on paleta_cores for insert with check (auth.role() = 'authenticated');
create policy "equipe apaga cores" on paleta_cores for delete using (auth.role() = 'authenticated');

-- Identidade visual: tipografia
create table if not exists tipografias (
  id text primary key,
  nome text not null,
  uso text,
  url_referencia text,
  ordem bigint not null default 0,
  criado_em timestamptz not null default now()
);

alter table tipografias enable row level security;
create policy "equipe le tipografias" on tipografias for select using (auth.role() = 'authenticated');
create policy "equipe cria tipografias" on tipografias for insert with check (auth.role() = 'authenticated');
create policy "equipe apaga tipografias" on tipografias for delete using (auth.role() = 'authenticated');

-- Identidade visual: moodboard (imagens de referência)
create table if not exists moodboard_imagens (
  id text primary key,
  url text not null,
  nome_arquivo text,
  enviado_por text,
  criado_em timestamptz not null default now()
);

alter table moodboard_imagens enable row level security;
create policy "equipe le moodboard" on moodboard_imagens for select using (auth.role() = 'authenticated');
create policy "equipe envia moodboard" on moodboard_imagens for insert with check (auth.role() = 'authenticated');
create policy "equipe apaga moodboard" on moodboard_imagens for delete using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('moodboard', 'moodboard', true)
on conflict (id) do nothing;

create policy "leitura publica do moodboard" on storage.objects
  for select using (bucket_id = 'moodboard');
create policy "equipe envia arquivos do moodboard" on storage.objects
  for insert with check (bucket_id = 'moodboard' and auth.role() = 'authenticated');
create policy "equipe apaga arquivos do moodboard" on storage.objects
  for delete using (bucket_id = 'moodboard' and auth.role() = 'authenticated');

-- =========================================================================
-- Migração: permite excluir artes individuais de um post (a tabela e o
-- bucket de storage já existiam, mas faltava a policy de delete).
-- =========================================================================
create policy "equipe apaga artes" on artes for delete using (auth.role() = 'authenticated');

create policy "equipe apaga arquivos de artes" on storage.objects
  for delete using (bucket_id = 'artes' and auth.role() = 'authenticated');

-- =========================================================================
-- Migração: nova editoria "Negócios Digitais" + ordenação manual dos
-- conteúdos (arrastar e soltar na Tabela).
-- =========================================================================
alter table posts drop constraint if exists posts_categoria_check;
alter table posts add constraint posts_categoria_check check (categoria in (
  'saude_mental_bem_estar',
  'mentalidade_sucesso',
  'autoridade_presenca_feminina',
  'autoestima_autoconhecimento',
  'carreira_posicionamento',
  'produto_promocional',
  'marca_pessoal_branding',
  'financas_femininas',
  'negocios_digitais',
  'nostalgia_comunidade',
  'relacionamentos_comportamento_social'
));

alter table posts add column if not exists ordem double precision not null default 0;

-- Preenche a ordem dos conteúdos já existentes seguindo a data de
-- publicação atual, para que a lista comece organizada do mesmo jeito
-- que já estava.
with numerados as (
  select id, row_number() over (order by data_publicacao asc) as rn
  from posts
)
update posts set ordem = numerados.rn
from numerados
where posts.id = numerados.id and posts.ordem = 0;
