-- =====================================================================
-- ATUALIZAÇÃO 13 — VARIAÇÕES COM NOME E KITS, VÁRIAS CATEGORIAS,
--                  PRAZO PADRÃO E CORES COM LETRA MAIÚSCULA
-- Rodar UMA vez no SQL Editor (depois da 12). Não apaga nada.
-- =====================================================================

-- 1) UM PRODUTO EM VÁRIAS CATEGORIAS (ex.: Brinquedos E Decoração)
create table if not exists produtos_categorias (
  produto_id    uuid not null references produtos(id) on delete cascade,
  categoria_id  uuid not null references categorias(id) on delete cascade,
  primary key (produto_id, categoria_id)
);
alter table produtos_categorias enable row level security;
create policy "prodcat_ler"    on produtos_categorias for select using (true);
create policy "prodcat_gravar" on produtos_categorias for all to authenticated
  using (pode_editar((select loja_id from produtos where id = produto_id)))
  with check (pode_editar((select loja_id from produtos where id = produto_id)));
-- A categoria que cada produto já tinha entra na lista nova
insert into produtos_categorias (produto_id, categoria_id)
  select id, categoria_id from produtos where categoria_id is not null
  on conflict do nothing;

-- 2) VARIAÇÕES MAIS COMPLETAS
--    tipo      = 'unidade' ou 'kit' (o cliente escolhe "Unidade" ou "Kit")
--    nome      = a opção/modelo (ex.: "Clipes de coração", "Kit 9 sortidos")
--    descricao = texto da opção (ex.: "3 corações + 3 estrelas + 3 nuvens")
alter table variacoes add column if not exists tipo text not null default 'unidade' check (tipo in ('unidade', 'kit'));
alter table variacoes add column if not exists nome text;
alter table variacoes add column if not exists descricao text;

-- 3) PRAZO PADRÃO de cada loja (já vem preenchido no cadastro de produto)
alter table lojas add column if not exists prazo_padrao text default '10 dias';

-- 4) CORES COMEÇANDO COM LETRA MAIÚSCULA ("azul" → "Azul")
--    (primeiro tira repetidas que só mudam maiúscula/minúscula)
delete from opcoes_loja a using opcoes_loja b
  where a.tipo = 'cor' and b.tipo = 'cor' and a.loja_id = b.loja_id
    and lower(a.valor) = lower(b.valor) and a.id > b.id;
update opcoes_loja set valor = upper(left(valor, 1)) || substr(valor, 2) where tipo = 'cor';
update variacoes  set cor = upper(left(cor, 1)) || substr(cor, 2) where cor is not null;
update midias     set cor = upper(left(cor, 1)) || substr(cor, 2) where cor is not null;

-- 5) COR "A ESCOLHER": antes, cor vazia numa variação de produto que tem
--    outras cores queria dizer "o cliente escolhe". Agora isso é escrito
--    como "A escolher" (cor vazia = produto sem cor).
update variacoes v set cor = 'A escolher'
  where v.cor is null
    and exists (select 1 from variacoes o where o.produto_id = v.produto_id and o.cor is not null and o.cor <> 'A escolher');
