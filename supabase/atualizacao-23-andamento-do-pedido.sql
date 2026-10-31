-- =====================================================================
-- ATUALIZAÇÃO 23 — ANDAMENTO DO PEDIDO COM AVISO AO CLIENTE
--   Etapas novas: "Aceito" e "Enviado / saiu para entrega"
--   WhatsApp do cliente (opcional) para receber as atualizações
-- Rodar UMA vez no SQL Editor (depois da 22). Não apaga nada.
-- =====================================================================

-- 1) Etapas do pedido (troca a regra antiga pela nova lista)
do $$
declare r record;
begin
  for r in select conname from pg_constraint
           where conrelid = 'public.pedidos'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table pedidos drop constraint %I', r.conname);
  end loop;
end $$;
alter table pedidos add constraint pedidos_status_check
  check (status in ('recebido', 'aceito', 'em_producao', 'pronto', 'enviado', 'entregue', 'cancelado'));

-- 2) WhatsApp do cliente (só para avisar o andamento do pedido)
alter table pedidos add column if not exists cliente_whatsapp text;

-- 3) Estoque: agora baixa já no "Aceito" (e continua voltando se cancelar)
create or replace function pedido_estoque() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status in ('aceito', 'em_producao', 'pronto', 'enviado', 'entregue') and not old.estoque_baixado then
    perform mexer_estoque(new.itens, 1);
    new.estoque_baixado := true;
  elsif new.status in ('cancelado', 'recebido') and old.estoque_baixado then
    perform mexer_estoque(new.itens, -1);
    new.estoque_baixado := false;
  end if;
  return new;
end $$;

-- 4) Função do pedido: agora recebe também o WhatsApp do cliente
drop function if exists criar_pedido(uuid, text, text, jsonb, numeric, numeric, text, date, boolean, text, numeric);
create or replace function criar_pedido(
  p_loja uuid, p_tipo text, p_nome text, p_itens jsonb, p_total numeric, p_desconto numeric,
  p_cupom text, p_data date, p_urgente boolean, p_entrega text default null, p_frete numeric default null,
  p_telefone text default null
) returns text
language plpgsql security definer set search_path = public
as $$
declare v_codigo text; v_origem text := ip_anonimo(); v_tel text := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '');
begin
  if not exists (select 1 from lojas where id = p_loja and ativa) then raise exception 'Loja inválida'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 100 then raise exception 'Itens inválidos'; end if;
  if (select count(*) from pedidos where origem = v_origem and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos pedidos seguidos. Espere alguns minutos, por favor.';
  end if;
  if (select count(*) from pedidos where criado_em > now() - interval '1 hour') >= 200 then
    raise exception 'Muitos pedidos agora. Tente de novo em instantes.';
  end if;
  if v_tel is not null and length(v_tel) not between 10 and 13 then v_tel := null; end if;
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from pedidos where codigo = v_codigo);
  end loop;
  insert into pedidos (codigo, loja_id, tipo, cliente_nome, itens, total, desconto, cupom, data_desejada, urgente, origem, entrega, frete, cliente_whatsapp)
  values (v_codigo, p_loja, case when p_tipo = 'orcamento' then 'orcamento' else 'pedido' end,
          left(p_nome, 80), p_itens, p_total, p_desconto, left(p_cupom, 40), p_data, coalesce(p_urgente, false), v_origem,
          left(p_entrega, 120), p_frete, v_tel);
  return v_codigo;
end $$;
grant execute on function criar_pedido(uuid, text, text, jsonb, numeric, numeric, text, date, boolean, text, numeric, text) to anon, authenticated;
