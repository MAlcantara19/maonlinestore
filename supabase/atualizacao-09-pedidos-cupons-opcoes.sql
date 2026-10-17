-- =====================================================================
-- ATUALIZAÇÃO 09 — PEDIDOS, CUPONS, OPÇÕES DE COR/TAMANHO E "SOBRE"
-- Rodar UMA vez no SQL Editor (depois da 08). Não apaga nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) OPÇÕES DA LOJA: lista de cores e tamanhos que a loja trabalha.
--    Aparecem como lista no cadastro de produto. Cor/tamanho novo
--    digitado num produto entra aqui sozinho. Gerencie na aba "Opções".
-- ---------------------------------------------------------------------
create table if not exists opcoes_loja (
  id       uuid primary key default gen_random_uuid(),
  loja_id  uuid not null references lojas(id) on delete cascade,
  tipo     text not null check (tipo in ('cor', 'tamanho')),
  valor    text not null,
  ordem    int not null default 0,
  unique (loja_id, tipo, valor)
);
alter table opcoes_loja enable row level security;
create policy "opcoes_ler"    on opcoes_loja for select using (true);
create policy "opcoes_gravar" on opcoes_loja for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));

-- Já começa com as cores e tamanhos usados nos produtos cadastrados
insert into opcoes_loja (loja_id, tipo, valor)
  select distinct p.loja_id, 'cor', v.cor from variacoes v join produtos p on p.id = v.produto_id where v.cor is not null
  on conflict do nothing;
insert into opcoes_loja (loja_id, tipo, valor)
  select distinct p.loja_id, 'tamanho', v.tamanho from variacoes v join produtos p on p.id = v.produto_id where v.tamanho is not null
  on conflict do nothing;

-- ---------------------------------------------------------------------
-- 2) "SOBRE A LOJA": texto da página /<loja>/sobre
-- ---------------------------------------------------------------------
alter table lojas add column if not exists sobre text;

-- ---------------------------------------------------------------------
-- 3) CUPONS DE DESCONTO (cada loja tem os seus)
--    tipo 'porcentagem' (valor = 10 → 10%) ou 'valor' (valor = 15 → R$ 15)
--    Os códigos NÃO ficam visíveis para o público: o carrinho só pergunta
--    ao banco "esse cupom vale?" (função validar_cupom).
-- ---------------------------------------------------------------------
create table if not exists cupons (
  id         uuid primary key default gen_random_uuid(),
  loja_id    uuid not null references lojas(id) on delete cascade,
  codigo     text not null,
  tipo       text not null default 'porcentagem' check (tipo in ('porcentagem', 'valor')),
  valor      numeric(10,2) not null,
  minimo     numeric(10,2),          -- compra mínima (opcional)
  validade   date,                   -- último dia que vale (opcional)
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now(),
  unique (loja_id, codigo)
);
alter table cupons enable row level security;
create policy "cupons_admin" on cupons for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));

create or replace function validar_cupom(p_loja uuid, p_codigo text)
returns table (codigo text, tipo text, valor numeric, minimo numeric)
language sql stable security definer set search_path = public
as $$
  select c.codigo, c.tipo, c.valor, c.minimo from cupons c
  where c.loja_id = p_loja and upper(c.codigo) = upper(trim(p_codigo)) and c.ativo
    and (c.validade is null or c.validade >= current_date)
  limit 1
$$;
grant execute on function validar_cupom(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) PEDIDOS: cada pedido/orçamento enviado pelo WhatsApp fica salvo,
--    com um código (ex.: A3F9K2). O cliente acompanha em /pedido/A3F9K2
--    e a loja muda o andamento no painel (aba Pedidos).
-- ---------------------------------------------------------------------
create table if not exists pedidos (
  id             uuid primary key default gen_random_uuid(),
  codigo         text unique not null,
  loja_id        uuid not null references lojas(id) on delete cascade,
  tipo           text not null default 'pedido' check (tipo in ('pedido', 'orcamento')),
  cliente_nome   text,
  itens          jsonb not null,
  total          numeric(10,2),
  desconto       numeric(10,2),
  cupom          text,
  data_desejada  date,
  urgente        boolean not null default false,
  status         text not null default 'recebido'
                 check (status in ('recebido', 'em_producao', 'pronto', 'entregue', 'cancelado')),
  nota_loja      text,              -- recado da loja que o cliente vê no acompanhamento
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
alter table pedidos enable row level security;
-- Só os administradores da loja veem e mexem nos pedidos dela
create policy "pedidos_admin" on pedidos for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));

-- O site cria o pedido por esta função (o público não lê a tabela)
create or replace function criar_pedido(
  p_loja uuid, p_tipo text, p_nome text, p_itens jsonb, p_total numeric, p_desconto numeric,
  p_cupom text, p_data date, p_urgente boolean
) returns text
language plpgsql security definer set search_path = public
as $$
declare v_codigo text;
begin
  if not exists (select 1 from lojas where id = p_loja and ativa) then raise exception 'Loja inválida'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 100 then raise exception 'Itens inválidos'; end if;
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from pedidos where codigo = v_codigo);
  end loop;
  insert into pedidos (codigo, loja_id, tipo, cliente_nome, itens, total, desconto, cupom, data_desejada, urgente)
  values (v_codigo, p_loja, case when p_tipo = 'orcamento' then 'orcamento' else 'pedido' end,
          left(p_nome, 80), p_itens, p_total, p_desconto, left(p_cupom, 40), p_data, coalesce(p_urgente, false));
  return v_codigo;
end $$;
grant execute on function criar_pedido(uuid, text, text, jsonb, numeric, numeric, text, date, boolean) to anon, authenticated;

-- Acompanhamento pelo código (mostra só o necessário)
create or replace function consultar_pedido(p_codigo text)
returns table (codigo text, tipo text, status text, itens jsonb, total numeric, desconto numeric, cupom text,
               data_desejada date, urgente boolean, nota_loja text, criado_em timestamptz, atualizado_em timestamptz,
               loja_nome text, loja_slug text, loja_cor text, loja_whatsapp text)
language sql stable security definer set search_path = public
as $$
  select p.codigo, p.tipo, p.status, p.itens, p.total, p.desconto, p.cupom, p.data_desejada, p.urgente, p.nota_loja,
         p.criado_em, p.atualizado_em, l.nome, l.slug, l.cor, l.whatsapp
  from pedidos p join lojas l on l.id = p.loja_id
  where p.codigo = upper(trim(p_codigo))
$$;
grant execute on function consultar_pedido(text) to anon, authenticated;
