-- =====================================================================
-- ATUALIZAÇÃO 17 — MAIS EFEITOS, BORDA DA LOGO E COR ENTRE AS LOGOS
-- Rodar UMA vez no SQL Editor (depois da 16). Não apaga nada.
-- =====================================================================

-- 1) Efeitos novos
alter type tipo_efeito add value if not exists 'natal';
alter type tipo_efeito add value if not exists 'pascoa';
alter type tipo_efeito add value if not exists 'halloween';
alter type tipo_efeito add value if not exists 'namorados';
alter type tipo_efeito add value if not exists 'maes';
alter type tipo_efeito add value if not exists 'folhas';
alter type tipo_efeito add value if not exists 'chuva';
alter type tipo_efeito add value if not exists 'nuvens';
alter type tipo_efeito add value if not exists 'fogos';
alter type tipo_efeito add value if not exists 'joias';
alter type tipo_efeito add value if not exists 'notas';
alter type tipo_efeito add value if not exists 'patinhas';
alter type tipo_efeito add value if not exists 'futebol';
alter type tipo_efeito add value if not exists 'brasil';
alter type tipo_efeito add value if not exists 'foguetes';
alter type tipo_efeito add value if not exists 'dinheiro';
alter type tipo_efeito add value if not exists 'sorvete';
alter type tipo_efeito add value if not exists 'cafe';

-- 2) Borda das logos redondas (cor e grossura em px; 0 = sem borda)
alter table lojas       add column if not exists logo_borda_cor text default '#ffffff';
alter table lojas       add column if not exists logo_borda int not null default 3 check (logo_borda between 0 and 10);
alter table site_config add column if not exists logo_borda_cor text default '#ffffff';
alter table site_config add column if not exists logo_borda int not null default 3 check (logo_borda between 0 and 10);

-- 3) Cor entre as logos do mosaico de fundo (vazio = transparente)
alter table lojas       add column if not exists fundo_cor text;
alter table site_config add column if not exists fundo_cor text;
alter table site_config add column if not exists parceiros_fundo_cor text;
