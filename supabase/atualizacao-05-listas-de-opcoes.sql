-- =====================================================================
-- ATUALIZAÇÃO 05 — LISTAS DE OPÇÕES (para SELECIONAR em vez de digitar)
-- Rodar UMA vez no SQL Editor. Não apaga nada.
--
-- Transforma os campos de opção fixa em "enum" (lista fechada). Assim,
-- no Table Editor do Supabase, esses campos viram uma caixinha de
-- seleção, e ninguém digita errado.
--   efeito (lojas e coleções) · fonte · disponibilidade · tipo da mídia
-- Também acrescenta efeitos novos: chocolate 🍫, doces 🍭, flores 🌸 e
-- presentes 🎁.
--
-- Para criar uma opção nova no futuro (exemplo):
--   alter type tipo_efeito add value 'folhas';
-- =====================================================================

-- 1) As listas
create type tipo_efeito as enum
  ('nenhum', 'neve', 'estrelas', 'brilhos', 'coracoes', 'confete', 'bolhas', 'chocolate', 'doces', 'flores', 'presentes');
create type tipo_fonte as enum ('moderna', 'elegante', 'divertida');
create type tipo_disponibilidade as enum ('pronta_entrega', 'sob_encomenda', 'esgotado');
create type tipo_midia as enum ('foto', 'video');

-- 2) lojas.efeito e lojas.fonte
alter table lojas drop constraint if exists lojas_efeito_check;
alter table lojas alter column efeito drop default;
alter table lojas alter column efeito type tipo_efeito using efeito::tipo_efeito;
alter table lojas alter column efeito set default 'nenhum';

alter table lojas drop constraint if exists lojas_fonte_check;
alter table lojas alter column fonte drop default;
alter table lojas alter column fonte type tipo_fonte using fonte::tipo_fonte;
alter table lojas alter column fonte set default 'moderna';

-- 3) colecoes.efeito
alter table colecoes drop constraint if exists colecoes_efeito_check;
alter table colecoes alter column efeito drop default;
alter table colecoes alter column efeito type tipo_efeito using efeito::tipo_efeito;
alter table colecoes alter column efeito set default 'nenhum';

-- 4) disponibilidade (produtos e variações)
alter table produtos drop constraint if exists produtos_disponibilidade_check;
alter table produtos alter column disponibilidade drop default;
alter table produtos alter column disponibilidade type tipo_disponibilidade using disponibilidade::tipo_disponibilidade;
alter table produtos alter column disponibilidade set default 'pronta_entrega';

alter table variacoes drop constraint if exists variacoes_disponibilidade_check;
alter table variacoes alter column disponibilidade type tipo_disponibilidade using disponibilidade::tipo_disponibilidade;

-- 5) midias.tipo
alter table midias drop constraint if exists midias_tipo_check;
alter table midias alter column tipo type tipo_midia using tipo::tipo_midia;
