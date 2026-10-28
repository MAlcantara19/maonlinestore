-- =====================================================================
-- ATUALIZAÇÃO 21 — ESTOQUE E VELOCIDADE DO BANCO
-- Rodar UMA vez no SQL Editor (depois da 20). Não apaga nada.
-- =====================================================================

-- 1) ESTOQUE: quantidade disponível (vazio = não controlar estoque)
--    Vale no produto (sem variações) ou em cada variação.
alter table produtos  add column if not exists estoque int check (estoque >= 0);
alter table variacoes add column if not exists estoque int check (estoque >= 0);
alter table pedidos   add column if not exists estoque_baixado boolean not null default false;

-- Tira (sinal 1) ou devolve (sinal -1) as quantidades de um pedido
create or replace function mexer_estoque(p_itens jsonb, p_sinal int) returns void
language plpgsql security definer set search_path = public
as $$
declare i jsonb; q int;
begin
  for i in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    q := coalesce((i->>'quantidade')::int, 0);
    continue when q <= 0;
    if (i->>'variacao_id') is not null then
      update variacoes set estoque = greatest(0, estoque - p_sinal * q) where id = (i->>'variacao_id')::uuid and estoque is not null;
    elsif (i->>'produto_id') is not null then
      update produtos set estoque = greatest(0, estoque - p_sinal * q) where id = (i->>'produto_id')::uuid and estoque is not null;
    end if;
  end loop;
end $$;

-- O estoque baixa SOZINHO quando a loja confirma o pedido (muda para
-- "Em produção", "Pronto" ou "Entregue") e VOLTA se o pedido for cancelado.
create or replace function pedido_estoque() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status in ('em_producao', 'pronto', 'entregue') and not old.estoque_baixado then
    perform mexer_estoque(new.itens, 1);
    new.estoque_baixado := true;
  elsif new.status in ('cancelado', 'recebido') and old.estoque_baixado then
    perform mexer_estoque(new.itens, -1);
    new.estoque_baixado := false;
  end if;
  return new;
end $$;
drop trigger if exists pedido_estoque on pedidos;
create trigger pedido_estoque before update of status on pedidos for each row execute function pedido_estoque();

-- 2) VELOCIDADE: "índices" são como o índice de um livro: o banco acha
--    as coisas sem ler tudo. Deixa as páginas e o painel mais rápidos.
create index if not exists produtos_loja_ativo   on produtos (loja_id, ativo, ordem) where excluido_em is null;
create index if not exists produtos_destaque     on produtos (destaque) where ativo and destaque;
create index if not exists variacoes_produto     on variacoes (produto_id);
create index if not exists midias_produto        on midias (produto_id);
create index if not exists prodcat_categoria     on produtos_categorias (categoria_id);
create index if not exists prodcol_colecao       on produtos_colecoes (colecao_id);
create index if not exists categorias_loja       on categorias (loja_id);
create index if not exists colecoes_loja         on colecoes (loja_id);
create index if not exists pedidos_loja_quando   on pedidos (loja_id, criado_em desc);
create index if not exists pedidos_origem_quando on pedidos (origem, criado_em desc);
create index if not exists eventos_origem_quando on eventos (origem, criado_em desc);
create index if not exists avaliacoes_loja       on avaliacoes (loja_id) where ativo;
