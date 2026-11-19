-- =====================================================================
-- ATUALIZAÇÃO 32 — CONTAGEM DE NATAL, BANNER DA COLEÇÃO, AVISOS PARA O
-- CLIENTE, ESTOQUE BAIXO / META BATIDA, SINÔNIMOS E "MAIS BUSCADOS"
-- Rodar UMA vez no SQL Editor (DEPOIS da 31). Não apaga nada.
-- =====================================================================

-- 1) ⏳ Contagem regressiva ("Pedidos de Natal até 15/12")
alter table lojas add column if not exists contagem_ate timestamptz;
alter table lojas add column if not exists contagem_texto text;

-- 2) 🔎 Sinônimos da busca, um grupo por linha: "caneca = xícara, copo"
alter table lojas add column if not exists sinonimos text;

-- 3) ⚠️ Aviso de estoque baixo (avisa quando sobrar isto ou menos) e 🎯 meta
alter table lojas add column if not exists estoque_alerta int not null default 2;
alter table lojas add column if not exists meta_avisada_mes text; -- "2026-12" = já avisou em dezembro
alter table pedidos add column if not exists push_estoque boolean not null default false;

-- 4) 🖼️ Banner próprio de cada coleção
alter table colecoes add column if not exists banner_url text;

-- ---------------------------------------------------------------------
-- 5) 🔔 Avisos para o CLIENTE ("seu pedido saiu para entrega 🚚")
--    O cliente ativa na página de acompanhamento do pedido.
-- ---------------------------------------------------------------------
create table if not exists push_pedidos (
  id         uuid primary key default gen_random_uuid(),
  pedido_id  uuid not null references pedidos(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  criado_em  timestamptz not null default now(),
  unique (pedido_id, endpoint)
);
alter table push_pedidos enable row level security; -- ninguém lê direto; só o servidor

create or replace function inscrever_push_pedido(p_codigo text, p_endpoint text, p_p256dh text, p_auth text) returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_pedido uuid;
begin
  select id into v_pedido from pedidos where codigo = upper(trim(p_codigo));
  if v_pedido is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then return false; end if;
  if (select count(*) from push_pedidos where pedido_id = v_pedido) >= 5 then return false; end if;
  insert into push_pedidos (pedido_id, endpoint, p256dh, auth) values (v_pedido, p_endpoint, left(p_p256dh, 200), left(p_auth, 100))
  on conflict (pedido_id, endpoint) do nothing;
  return true;
end $$;
grant execute on function inscrever_push_pedido(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6) 🔥 MAIS BUSCADOS — guarda o que os clientes digitam na busca
--    (só a palavra, sem saber quem foi) e mostra os campeões na loja.
--    Só aparecem termos que combinam com algum produto (evita besteira).
-- ---------------------------------------------------------------------
create table if not exists buscas (
  id        bigserial primary key,
  loja_id   uuid not null references lojas(id) on delete cascade,
  termo     text not null,
  origem    text,
  criado_em timestamptz not null default now()
);
alter table buscas enable row level security;
drop policy if exists "buscas_admin" on buscas;
create policy "buscas_admin" on buscas for select to authenticated using (pode_editar(loja_id));
create index if not exists buscas_loja_data on buscas (loja_id, criado_em desc);

create or replace function registrar_busca(p_slug text, p_termo text) returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare v_loja uuid; v_termo text := public.sem_acento(trim(coalesce(p_termo, ''))); v_origem text := ip_anonimo();
begin
  if length(v_termo) < 3 or length(v_termo) > 40 then return; end if;
  select id into v_loja from lojas where slug = p_slug and ativa;
  if v_loja is null then return; end if;
  -- no máximo 30 buscas por hora de cada aparelho, e não repete o mesmo termo em 10 min
  if (select count(*) from buscas where origem = v_origem and criado_em > now() - interval '1 hour') >= 30 then return; end if;
  if exists (select 1 from buscas where origem = v_origem and loja_id = v_loja and termo = v_termo and criado_em > now() - interval '10 minutes') then return; end if;
  insert into buscas (loja_id, termo, origem) values (v_loja, v_termo, v_origem);
end $$;
grant execute on function registrar_busca(text, text) to anon, authenticated;

create or replace function mais_buscados(p_slug text, p_dias int default 30) returns table (termo text, vezes bigint)
language sql stable security definer set search_path = public, extensions
as $$
  select b.termo, count(*) as vezes
  from buscas b join lojas l on l.id = b.loja_id
  where l.slug = p_slug and b.criado_em > now() - make_interval(days => least(greatest(p_dias, 1), 365))
    and exists (select 1 from produtos p where p.loja_id = l.id and p.ativo and p.excluido_em is null
                and (public.sem_acento(p.nome) like '%' || b.termo || '%' or word_similarity(b.termo, public.sem_acento(p.nome)) >= 0.4))
  group by b.termo
  having count(*) >= 2
  order by vezes desc, b.termo
  limit 8;
$$;
grant execute on function mais_buscados(text, int) to anon, authenticated;
