-- =====================================================================
-- ATUALIZAÇÃO 31 — BUSCA INTELIGENTE, NOTIFICAÇÕES PUSH, ASSISTENTE DE IA
--                  E "LOJA ABERTA AGORA"
-- Rodar UMA vez no SQL Editor do Supabase. Não apaga nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 🔎 BUSCA INTELIGENTE (aceita erro de digitação e falta de acento)
--    "arvori natau" acha "Árvore de Natal"; "chavero" acha "Chaveiro".
-- ---------------------------------------------------------------------
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- "Árvore DE Natal" → "arvore de natal"
create or replace function public.sem_acento(t text) returns text
language sql immutable parallel safe set search_path = public, extensions
as $$ select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, ''))) $$;

-- Índice para a busca ficar rápida mesmo com muitos produtos
create index if not exists produtos_nome_trgm on produtos using gin (public.sem_acento(nome) extensions.gin_trgm_ops);

-- p_loja vazio = busca em todas as lojas (página inicial)
create or replace function public.buscar_produtos(p_termo text, p_loja uuid default null, p_limite int default 8)
returns table (id uuid, nome text, preco numeric, foto text, loja_slug text, loja_nome text, loja_cor text, nota real)
language sql stable security invoker set search_path = public, extensions
as $$
  with b as (select public.sem_acento(trim(p_termo)) as q)
  select p.id, p.nome,
    coalesce((select min(v.preco) from variacoes v where v.produto_id = p.id and v.ativa and v.preco is not null), p.preco) as preco,
    (select m.url from midias m where m.produto_id = p.id and m.tipo = 'foto' order by m.ordem limit 1) as foto,
    l.slug, l.nome, l.cor,
    greatest(
      case when public.sem_acento(p.nome) like '%' || b.q || '%' then 1 else 0 end,
      word_similarity(b.q, public.sem_acento(p.nome)),
      word_similarity(b.q, public.sem_acento(coalesce(p.descricao, ''))) * 0.6
    )::real as nota
  from produtos p
  join lojas l on l.id = p.loja_id
  cross join b
  where length(b.q) > 0
    and p.ativo and p.excluido_em is null and l.ativa
    and (p_loja is not null or not coalesce(l.em_breve, false))
    and (p_loja is null or p.loja_id = p_loja)
    and (
      public.sem_acento(p.nome) like '%' || b.q || '%'
      or word_similarity(b.q, public.sem_acento(p.nome)) >= 0.35
      or word_similarity(b.q, public.sem_acento(coalesce(p.descricao, ''))) >= 0.5
    )
  order by nota desc, p.nome
  limit least(greatest(p_limite, 1), 30);
$$;
grant execute on function public.buscar_produtos(text, uuid, int) to anon, authenticated;
grant execute on function public.sem_acento(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) 🔔 NOTIFICAÇÕES PUSH DE VERDADE (chegam com o celular bloqueado)
--    Cada aparelho que ativar o aviso no painel ganha uma linha aqui.
-- ---------------------------------------------------------------------
create table if not exists push_inscricoes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  aparelho   text,
  criado_em  timestamptz not null default now()
);
alter table push_inscricoes enable row level security;
drop policy if exists "push_dono" on push_inscricoes;
create policy "push_dono" on push_inscricoes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Marca o pedido que já gerou aviso (não avisa duas vezes)
alter table pedidos add column if not exists push_avisado boolean not null default false;

-- ---------------------------------------------------------------------
-- 3) 🤖 ASSISTENTE DE IA — guarda só QUANDO foi usado (limite por hora,
--    para a conta da IA não subir sem querer). O texto não fica salvo.
-- ---------------------------------------------------------------------
create table if not exists ia_uso (
  id        bigserial primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  loja_id   uuid references lojas(id) on delete cascade,
  tipo      text,
  criado_em timestamptz not null default now()
);
alter table ia_uso enable row level security; -- só o servidor (chave secreta) mexe
create index if not exists ia_uso_recente on ia_uso (user_id, criado_em desc);

-- ---------------------------------------------------------------------
-- 4) 🟢 LOJA ABERTA AGORA
--    horario vazio = sempre aberta (não mostra nada).
--    Formato: {"1": ["09:00","18:00"], "2": [...], ... "0": null}
--    (0 = domingo, 1 = segunda ... 6 = sábado; null = fechado no dia)
--    pausada = "fechada por um tempo" (férias, sem estoque...) — a loja
--    continua no ar, mas mostra o aviso_fechada.
-- ---------------------------------------------------------------------
alter table lojas add column if not exists horario jsonb;
alter table lojas add column if not exists pausada boolean not null default false;
alter table lojas add column if not exists aviso_fechada text;
