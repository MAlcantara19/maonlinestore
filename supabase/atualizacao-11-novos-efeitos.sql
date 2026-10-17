-- =====================================================================
-- ATUALIZAÇÃO 11 — NOVOS EFEITOS ANIMADOS
-- Rodar UMA vez no SQL Editor. Não apaga nada.
--   logo          → a logo da loja caindo, girando
--   logo_voando   → logos flutuando pela tela, em caminhos diferentes
--   borboletas 🦋 → voando pela tela
--   baloes 🎈     → subindo
-- =====================================================================
alter type tipo_efeito add value if not exists 'logo';
alter type tipo_efeito add value if not exists 'logo_voando';
alter type tipo_efeito add value if not exists 'borboletas';
alter type tipo_efeito add value if not exists 'baloes';
