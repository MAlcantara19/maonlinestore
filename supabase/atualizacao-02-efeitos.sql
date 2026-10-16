-- =====================================================================
-- ATUALIZAÇÃO 02 — SELOS NOS PRODUTOS E EFEITOS FESTIVOS NAS COLEÇÕES
-- Rodar UMA vez no SQL Editor. Não apaga nada.
--
--   produtos.selo    = fitinha no canto da foto (ex.: Novo, Últimas unidades,
--                      Mais vendido). Vazio = sem selo.
--   colecoes.efeito  = efeito animado na loja enquanto a coleção estiver
--                      EM DESTAQUE: nenhum | neve | coracoes | estrelas
-- =====================================================================
alter table produtos add column if not exists selo text;

alter table colecoes add column if not exists efeito text not null default 'nenhum'
  check (efeito in ('nenhum', 'neve', 'coracoes', 'estrelas'));

-- Exemplos (pode mudar à vontade no Table Editor)
update colecoes set efeito = 'neve' where nome = 'Natal';
update produtos set selo = 'Mais vendido'     where nome = 'Vaso espiral';
update produtos set selo = 'Novo'             where nome = 'Árvore de Natal articulada';
update produtos set selo = 'Últimas unidades' where nome = 'Nossa Senhora para monitor';
