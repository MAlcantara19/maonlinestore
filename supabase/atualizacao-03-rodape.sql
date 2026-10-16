-- =====================================================================
-- ATUALIZAÇÃO 03 — INSTAGRAM DE CADA LOJA
-- Rodar UMA vez no SQL Editor. Não apaga nada.
-- Aparece com o ícone do Instagram: no banner (abaixo do nome da loja),
-- no cabeçalho que aparece ao rolar e no rodapé.
-- Preencha em Table Editor > lojas > instagram. Pode escrever "@loja",
-- "loja" ou colar o link do perfil: o site entende os três.
-- =====================================================================
alter table lojas add column if not exists instagram text;
