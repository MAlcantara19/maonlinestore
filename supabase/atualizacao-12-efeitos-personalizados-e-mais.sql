-- =====================================================================
-- ATUALIZAÇÃO 12 — EFEITOS PERSONALIZADOS, FOTO POR COR, LANÇAMENTOS
-- Rodar UMA vez no SQL Editor (depois da 11). Não apaga nada.
-- =====================================================================

-- 1) FOTO POR COR: cada foto pode dizer qual cor ela mostra.
--    Na loja, escolheu "azul" → a galeria pula para a foto azul.
alter table midias add column if not exists cor text;

-- 2) CONTAGEM REGRESSIVA das lojas "em breve" (data e hora da inauguração)
alter table lojas add column if not exists lancamento_em timestamptz;

-- 3) EFEITOS PERSONALIZADOS: vocês sobem as imagens (PNG de preferência,
--    com fundo transparente) e escolhem o movimento. Dá para usar na loja
--    inteira, numa categoria/subcategoria (liga quando o cliente chega
--    naquela parte da página) ou numa coleção.
create table if not exists efeitos_personalizados (
  id          uuid primary key default gen_random_uuid(),
  loja_id     uuid references lojas(id) on delete cascade,
  nome        text not null,
  imagens     text[] not null default '{}',
  movimento   text not null default 'cair' check (movimento in ('cair', 'subir', 'voar', 'piscar')),
  quantidade  int not null default 14 check (quantidade between 3 and 40),
  tamanho     int not null default 40 check (tamanho between 12 and 120),
  criado_em   timestamptz not null default now()
);
alter table efeitos_personalizados enable row level security;
create policy "efeitos_ler"    on efeitos_personalizados for select using (true);
create policy "efeitos_gravar" on efeitos_personalizados for all to authenticated
  using (pode_editar(loja_id)) with check (pode_editar(loja_id));

alter table lojas      add column if not exists efeito_personalizado_id uuid references efeitos_personalizados(id) on delete set null;
alter table categorias add column if not exists efeito_personalizado_id uuid references efeitos_personalizados(id) on delete set null;
alter table colecoes   add column if not exists efeito_personalizado_id uuid references efeitos_personalizados(id) on delete set null;

-- 4) NÚMEROS DO SITE (para a seção de números da página inicial)
create or replace function estatisticas_publicas()
returns table (lojas bigint, parceiros bigint, produtos bigint, pedidos bigint)
language sql stable security definer set search_path = public
as $$
  select (select count(*) from lojas where ativa and not em_breve),
         (select count(*) from parceiros where ativo),
         (select count(*) from produtos where ativo and excluido_em is null),
         (select count(*) from pedidos)
$$;
grant execute on function estatisticas_publicas() to anon, authenticated;
