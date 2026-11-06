-- =====================================================================
-- ATUALIZAÇÃO 25 — FINANCEIRO, FRETE POR CEP, PREVISÃO E AVALIAÇÃO DO PEDIDO
-- Rodar UMA vez no SQL Editor (depois da 24). Não apaga nada.
-- =====================================================================

-- 1) FINANCEIRO: tudo que entra e sai de cada loja
create table if not exists movimentacoes (
  id               uuid primary key default gen_random_uuid(),
  loja_id          uuid not null references lojas(id) on delete cascade,
  tipo             text not null check (tipo in ('entrada', 'saida')),
  data             date not null default current_date,
  categoria        text not null default 'outro',
  descricao        text,
  valor            numeric(12,2) not null check (valor >= 0),
  forma_pagamento  text check (forma_pagamento in ('pix', 'dinheiro', 'credito', 'debito', 'transferencia', 'boleto', 'outro')),
  pedido_id        uuid references pedidos(id) on delete set null,
  pedido_numero    text,              -- número "de fora" (pedido feito fora do site, nota...)
  itens            jsonb not null default '[]'::jsonb,  -- [{ nome, quantidade, preco }]
  observacao       text,
  criado_por       text default (auth.jwt()->>'email'),
  criado_em        timestamptz not null default now()
);
create index if not exists movimentacoes_loja_data on movimentacoes (loja_id, data desc);
alter table movimentacoes enable row level security;
drop policy if exists "movimentacoes_admin" on movimentacoes;
create policy "movimentacoes_admin" on movimentacoes for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));
drop policy if exists mfa_obrigatorio on movimentacoes;
create policy mfa_obrigatorio on movimentacoes as restrictive for all to authenticated using (mfa_ok()) with check (mfa_ok());

-- 2) FRETE APROXIMADO POR CEP (regras de cada loja)
--    { "cidade": "Três Rios", "cidade_valor": 0, "uf": "RJ", "uf_valor": 20,
--      "regioes": { "sudeste": 30, "sul": 40, "centro_oeste": 45, "nordeste": 55, "norte": 65 } }
alter table lojas add column if not exists frete_cep jsonb;

-- 3) PREVISÃO DE ENTREGA e AVALIAÇÃO depois de entregue
alter table pedidos add column if not exists previsao_entrega date;
alter table pedidos add column if not exists avaliado boolean not null default false;

-- Informações extras para a página de acompanhamento do cliente
create or replace function pedido_extras(p_codigo text)
returns table (previsao_entrega date, entrega text, frete numeric, avaliado boolean)
language sql stable security definer set search_path = public
as $$
  select previsao_entrega, entrega, frete, avaliado from pedidos where codigo = upper(trim(p_codigo))
$$;
grant execute on function pedido_extras(text) to anon, authenticated;

-- O cliente avalia o pedido ENTREGUE (uma vez). A avaliação chega OCULTA:
-- a loja confere e publica na aba 💬 Avaliações.
create or replace function avaliar_pedido(p_codigo text, p_estrelas int, p_texto text, p_nome text default null)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v pedidos%rowtype;
begin
  select * into v from pedidos where codigo = upper(trim(p_codigo));
  if v.id is null or v.status <> 'entregue' or v.avaliado then return false; end if;
  if p_estrelas not between 1 and 5 or length(coalesce(trim(p_texto), '')) < 3 then return false; end if;
  insert into avaliacoes (loja_id, nome, texto, estrelas, ativo)
  values (v.loja_id, left(coalesce(nullif(trim(p_nome), ''), v.cliente_nome), 60), left(trim(p_texto), 600), p_estrelas, false);
  update pedidos set avaliado = true where id = v.id;
  return true;
end $$;
grant execute on function avaliar_pedido(text, int, text, text) to anon, authenticated;
