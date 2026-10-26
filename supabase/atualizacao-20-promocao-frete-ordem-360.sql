-- =====================================================================
-- ATUALIZAÇÃO 20 — PROMOÇÃO, FRETE, ORDEM MANUAL, GIRO 360°, ESPECIAL
-- Rodar UMA vez no SQL Editor (depois da 19). Não apaga nada.
-- =====================================================================

-- 1) Produtos: ordem manual, promoção (% de desconto até uma data) e giro 360°
alter table produtos add column if not exists ordem int not null default 0;
alter table produtos add column if not exists promocao_pct int check (promocao_pct between 1 and 90);
alter table produtos add column if not exists promocao_ate timestamptz;   -- vazio = sem data para acabar
alter table produtos add column if not exists giro_360 boolean not null default false;

-- 2) Frete / entrega de cada loja: lista de opções [{ "nome": "Três Rios - Centro", "valor": 5 }]
alter table lojas add column if not exists fretes jsonb not null default '[]'::jsonb;

-- 3) Pedido guarda a entrega escolhida e o valor do frete
alter table pedidos add column if not exists entrega text;
alter table pedidos add column if not exists frete numeric;

-- 4) Faixa especial na página inicial (ex.: Natal, Páscoa, Dia das Mães)
--    Junta as coleções de TODAS as lojas cujo nome tem a palavra escolhida.
alter table site_config add column if not exists especial_ativo boolean not null default false;
alter table site_config add column if not exists especial_titulo text default '🎄 Especial de Natal';
alter table site_config add column if not exists especial_termo text default 'Natal';

-- 5) Função do pedido: agora recebe a entrega e o frete (com a mesma proteção anti-robô)
drop function if exists criar_pedido(uuid, text, text, jsonb, numeric, numeric, text, date, boolean);
create or replace function criar_pedido(
  p_loja uuid, p_tipo text, p_nome text, p_itens jsonb, p_total numeric, p_desconto numeric,
  p_cupom text, p_data date, p_urgente boolean, p_entrega text default null, p_frete numeric default null
) returns text
language plpgsql security definer set search_path = public
as $$
declare v_codigo text; v_origem text := ip_anonimo();
begin
  if not exists (select 1 from lojas where id = p_loja and ativa) then raise exception 'Loja inválida'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 100 then raise exception 'Itens inválidos'; end if;
  if (select count(*) from pedidos where origem = v_origem and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos pedidos seguidos. Espere alguns minutos, por favor.';
  end if;
  if (select count(*) from pedidos where criado_em > now() - interval '1 hour') >= 200 then
    raise exception 'Muitos pedidos agora. Tente de novo em instantes.';
  end if;
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from pedidos where codigo = v_codigo);
  end loop;
  insert into pedidos (codigo, loja_id, tipo, cliente_nome, itens, total, desconto, cupom, data_desejada, urgente, origem, entrega, frete)
  values (v_codigo, p_loja, case when p_tipo = 'orcamento' then 'orcamento' else 'pedido' end,
          left(p_nome, 80), p_itens, p_total, p_desconto, left(p_cupom, 40), p_data, coalesce(p_urgente, false), v_origem,
          left(p_entrega, 120), p_frete);
  return v_codigo;
end $$;
grant execute on function criar_pedido(uuid, text, text, jsonb, numeric, numeric, text, date, boolean, text, numeric) to anon, authenticated;
