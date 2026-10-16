-- =====================================================================
-- ATUALIZAÇÃO 04 — MAIS EFEITOS E LOJAS "EM BREVE"
-- Rodar UMA vez no SQL Editor. Não apaga nada.
--
-- Efeitos disponíveis (coleções e lojas):
--   nenhum | neve | estrelas | brilhos | coracoes | confete | bolhas
--   neve/estrelas/confete caem balançando · coracoes/bolhas sobem ·
--   brilhos piscam parados pela tela
--
-- lojas.efeito   = efeito da loja o ano todo (vale quando nenhuma coleção
--                  em destaque tiver efeito próprio)
-- lojas.em_breve = true: o círculo aparece na página inicial apagadinho,
--                  com "Em breve", sem clicar. Pelo link direto a loja
--                  continua abrindo (bom para vocês testarem).
-- lojas.ativa    = false (já existia): a loja some de tudo.
-- =====================================================================

-- Coleções: troca a lista de efeitos permitidos pela nova
alter table colecoes drop constraint if exists colecoes_efeito_check;
alter table colecoes add constraint colecoes_efeito_check
  check (efeito in ('nenhum', 'neve', 'estrelas', 'brilhos', 'coracoes', 'confete', 'bolhas'));

-- Lojas: efeito próprio e "em breve"
alter table lojas add column if not exists efeito text not null default 'nenhum'
  check (efeito in ('nenhum', 'neve', 'estrelas', 'brilhos', 'coracoes', 'confete', 'bolhas'));
alter table lojas add column if not exists em_breve boolean not null default false;
