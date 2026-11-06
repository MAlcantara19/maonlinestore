-- =====================================================================
-- ATUALIZAÇÃO 27 — META DO MÊS NO FINANCEIRO
-- Rodar UMA vez no SQL Editor (depois da 26).
-- =====================================================================
alter table lojas add column if not exists meta_mensal numeric(12,2);
