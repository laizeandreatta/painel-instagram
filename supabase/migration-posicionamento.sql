-- =========================================================================
-- Migração: Posicionamento de Valor
-- Rode este arquivo (inteiro) no SQL Editor do Supabase — uma vez só.
-- Não rode o schema.sql inteiro de novo: ele já foi rodado antes e tem
-- comandos que dão erro na segunda vez (políticas duplicadas). Este
-- arquivo é seguro rodar isoladamente.
-- =========================================================================

-- Libera o novo papel "cliente" em perfis — é o login de acesso restrito
-- de cada cliente, que só enxerga o próprio dossiê de posicionamento e
-- mais nada do painel.
alter table perfis drop constraint if exists perfis_papel_check;
alter table perfis add constraint perfis_papel_check
  check (papel in ('admin', 'designer', 'editor', 'social_media', 'cliente'));

-- Um cliente por dossiê. "modulos" guarda os 12 módulos como JSON
-- ({"01": {"declaracao": "...", "respostas": ["...", ...]}, ..., "12": {...}}).
-- "cliente_user_id" só é preenchido quando você cria o login desse
-- cliente (aba "Acesso" do painel) — até lá, ninguém de fora enxerga a
-- linha.
create table if not exists posicionamento_clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null default '',
  transcricao_bruta text not null default '',
  gerado_em timestamptz,
  modulos jsonb not null default '{}'::jsonb,
  cliente_user_id uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Calendário de conteúdo por cliente (título, data, editoria, descrição,
-- status) — a mesma ideia das outras abas de conteúdo do painel, só que
-- por cliente em vez de compartilhada com a equipe toda.
create table if not exists posicionamento_conteudos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references posicionamento_clientes (id) on delete cascade,
  titulo text not null default '',
  data date,
  editoria text not null default '',
  descricao text not null default '',
  status text not null default 'ideia' check (status in ('ideia', 'producao', 'agendado', 'publicado')),
  criado_em timestamptz not null default now()
);

alter table posicionamento_clientes enable row level security;
alter table posicionamento_conteudos enable row level security;

-- Função auxiliar: true quando quem está logado é da equipe (qualquer
-- papel diferente de "cliente"). As políticas abaixo usam essa função
-- em vez de reler "perfis" direto, pra evitar problema de recursão nas
-- regras de segurança.
create or replace function is_equipe_posicionamento()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from perfis
    where id = auth.uid() and papel <> 'cliente'
  );
$$;

-- posicionamento_clientes: a equipe (qualquer papel que não seja
-- "cliente") lê e edita tudo; cada cliente só lê a própria linha (a que
-- tem cliente_user_id igual ao login dele) — e não pode editar nada,
-- por isso não existe política de update/insert/delete para "cliente".
create policy "equipe le clientes posicionamento" on posicionamento_clientes
  for select using (is_equipe_posicionamento());
create policy "equipe cria clientes posicionamento" on posicionamento_clientes
  for insert with check (is_equipe_posicionamento());
create policy "equipe edita clientes posicionamento" on posicionamento_clientes
  for update using (is_equipe_posicionamento());
create policy "equipe apaga clientes posicionamento" on posicionamento_clientes
  for delete using (is_equipe_posicionamento());
create policy "cliente le proprio posicionamento" on posicionamento_clientes
  for select using (cliente_user_id = auth.uid());

-- posicionamento_conteudos: mesma lógica — equipe lê/edita tudo, cliente
-- só lê os conteúdos do próprio cliente_id.
create policy "equipe le conteudos posicionamento" on posicionamento_conteudos
  for select using (is_equipe_posicionamento());
create policy "equipe cria conteudos posicionamento" on posicionamento_conteudos
  for insert with check (is_equipe_posicionamento());
create policy "equipe edita conteudos posicionamento" on posicionamento_conteudos
  for update using (is_equipe_posicionamento());
create policy "equipe apaga conteudos posicionamento" on posicionamento_conteudos
  for delete using (is_equipe_posicionamento());
create policy "cliente le proprios conteudos" on posicionamento_conteudos
  for select using (
    exists (
      select 1 from posicionamento_clientes c
      where c.id = posicionamento_conteudos.cliente_id
        and c.cliente_user_id = auth.uid()
    )
  );
