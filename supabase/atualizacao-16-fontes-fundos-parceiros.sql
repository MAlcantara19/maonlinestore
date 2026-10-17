-- =====================================================================
-- ATUALIZAÇÃO 16 — MAIS FONTES, ANIMAÇÃO DO FUNDO, FONTE POR COLEÇÃO
--                  E PERSONALIZAÇÃO DA PÁGINA DE PARCEIROS
-- Rodar UMA vez no SQL Editor (depois da 15). Não apaga nada.
-- =====================================================================

-- 1) Fontes novas para os títulos
alter type tipo_fonte add value if not exists 'cursiva';      -- Great Vibes (bem desenhada)
alter type tipo_fonte add value if not exists 'manuscrita';   -- Dancing Script
alter type tipo_fonte add value if not exists 'classica';     -- Cinzel (elegante, maiúsculas)
alter type tipo_fonte add value if not exists 'arredondada';  -- Fredoka
alter type tipo_fonte add value if not exists 'retro';        -- Righteous
alter type tipo_fonte add value if not exists 'marcante';     -- Bebas Neue

-- 2) Fonte própria por coleção (vazio = a da loja)
alter table colecoes add column if not exists fonte text;

-- 3) Animação da foto/mosaico de fundo
--    nenhuma | respirar (pulsa de leve) | zoom_lento (aproxima devagar) | deslizar (passeia para o lado)
alter table site_config add column if not exists fundo_animacao text not null default 'nenhuma' check (fundo_animacao in ('nenhuma', 'respirar', 'zoom_lento', 'deslizar'));
alter table lojas       add column if not exists fundo_animacao text not null default 'nenhuma' check (fundo_animacao in ('nenhuma', 'respirar', 'zoom_lento', 'deslizar'));

-- 4) Página de parceiros personalizável (título, fundo e efeito)
alter table site_config add column if not exists parceiros_titulo text default '🤝 Parceiros';
alter table site_config add column if not exists parceiros_subtitulo text default 'Gente e lugares que a gente conhece, confia e indica.';
alter table site_config add column if not exists parceiros_fundo_tipo text not null default 'nenhum' check (parceiros_fundo_tipo in ('nenhum', 'imagem', 'mosaico', 'video'));
alter table site_config add column if not exists parceiros_fundo_url text;
alter table site_config add column if not exists parceiros_fundo_opacidade int not null default 15;
alter table site_config add column if not exists parceiros_fundo_animacao text not null default 'nenhuma';
alter table site_config add column if not exists parceiros_efeito tipo_efeito not null default 'nenhum';
