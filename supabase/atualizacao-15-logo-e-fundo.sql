-- =====================================================================
-- ATUALIZAÇÃO 15 — LOGO DA MA ONLINE STORE E FUNDO DA PÁGINA
-- Rodar UMA vez no SQL Editor. Não apaga nada.
--
-- fundo_tipo: 'nenhum' | 'imagem' (foto cobrindo a página)
--             'mosaico' (a logo repetida, pequenininha, como papel de parede)
--             'video'  (vídeo curto rodando em looping, sem som)
-- fundo_opacidade: de 3 a 100 (%). Quanto menor, mais "marca d'água".
-- =====================================================================
alter table site_config add column if not exists logo_url text;
alter table site_config add column if not exists fundo_tipo text not null default 'nenhum' check (fundo_tipo in ('nenhum', 'imagem', 'mosaico', 'video'));
alter table site_config add column if not exists fundo_url text;
alter table site_config add column if not exists fundo_opacidade int not null default 15 check (fundo_opacidade between 3 and 100);

alter table lojas add column if not exists fundo_tipo text not null default 'nenhum' check (fundo_tipo in ('nenhum', 'imagem', 'mosaico', 'video'));
alter table lojas add column if not exists fundo_url text;
alter table lojas add column if not exists fundo_opacidade int not null default 15 check (fundo_opacidade between 3 and 100);
