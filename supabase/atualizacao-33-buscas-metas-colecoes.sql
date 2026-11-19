-- =====================================================================
-- ATUALIZAÇÃO 33 — "BUSCARAM E NÃO ACHARAM", META POR PRODUTO,
-- CONTAGEM E BANNERS DA COLEÇÃO, MAIS VENDIDOS
-- Rodar UMA vez no SQL Editor (DEPOIS da 32). Não apaga nada.
-- =====================================================================

-- 1) 🔎 Guarda também QUANTOS produtos a busca achou (0 = não achou nada)
alter table buscas add column if not exists resultados int;
drop function if exists registrar_busca(text, text);
create or replace function registrar_busca(p_slug text, p_termo text, p_resultados int default null) returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare v_loja uuid; v_termo text := public.sem_acento(trim(coalesce(p_termo, ''))); v_origem text := ip_anonimo();
begin
  if length(v_termo) < 3 or length(v_termo) > 40 then return; end if;
  select id into v_loja from lojas where slug = p_slug and ativa;
  if v_loja is null then return; end if;
  if (select count(*) from buscas where origem = v_origem and criado_em > now() - interval '1 hour') >= 30 then return; end if;
  if exists (select 1 from buscas where origem = v_origem and loja_id = v_loja and termo = v_termo and criado_em > now() - interval '10 minutes') then return; end if;
  insert into buscas (loja_id, termo, origem, resultados) values (v_loja, v_termo, v_origem, p_resultados);
end $$;
grant execute on function registrar_busca(text, text, int) to anon, authenticated;

-- 2) 🎯 Meta de cada produto: lembra o mês em que já avisou
alter table produtos add column if not exists meta_avisada_mes text;

-- 3) ⏳ Contagem e 🖼️ várias imagens no banner de cada coleção
alter table colecoes add column if not exists contagem_ate timestamptz;
alter table colecoes add column if not exists contagem_texto text;
alter table colecoes add column if not exists banners jsonb not null default '[]'::jsonb;

-- 4) 🔥 MAIS VENDIDOS (últimos 60 dias, pedidos não cancelados, sem teste)
--    O site só recebe a lista de produtos campeões — nada dos pedidos.
create or replace function mais_vendidos(p_slug text, p_limite int default 6) returns table (produto_id uuid, vendidos bigint)
language sql stable security definer set search_path = public
as $$
  select (i->>'produto_id')::uuid as produto_id, sum(coalesce((i->>'quantidade')::int, 1)) as vendidos
  from pedidos p join lojas l on l.id = p.loja_id
  cross join lateral jsonb_array_elements(p.itens) i
  where l.slug = p_slug and p.tipo = 'pedido' and p.status <> 'cancelado' and not p.teste
    and p.criado_em > now() - interval '60 days'
    and coalesce(i->>'produto_id', '') ~ '^[0-9a-f-]{36}$'
  group by 1
  having sum(coalesce((i->>'quantidade')::int, 1)) >= 2
  order by vendidos desc
  limit least(greatest(p_limite, 1), 12);
$$;
grant execute on function mais_vendidos(text, int) to anon, authenticated;
