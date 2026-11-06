-- =====================================================================
-- ATUALIZAÇÃO 26 — PAGAMENTO DO PEDIDO, PEDIDOS MANUAIS, CUSTO DO
--                  PRODUTO E FRETE PELO MELHOR ENVIO
-- Rodar UMA vez no SQL Editor (depois da 25). Não apaga nada.
-- =====================================================================

-- 1) Pagamento de cada pedido
alter table pedidos add column if not exists pagamento_status text not null default 'pendente'
  check (pagamento_status in ('pendente', 'sinal', 'pago'));
alter table pedidos add column if not exists valor_pago numeric(12,2) not null default 0;
alter table pedidos add column if not exists pagamento_forma text;
alter table pedidos add column if not exists restante_quando text;   -- ex.: "na entrega", "20/11"
alter table pedidos add column if not exists pagamento_obs text;

-- 2) Por onde o pedido chegou: site, WhatsApp, Instagram, presencial...
alter table pedidos add column if not exists canal text not null default 'site';

-- 3) Custo do produto (para o lucro real) e peso/medidas da embalagem (frete exato)
alter table produtos add column if not exists custo numeric(12,2);
alter table produtos add column if not exists peso_g int;
alter table produtos add column if not exists altura_cm numeric(6,1);
alter table produtos add column if not exists largura_cm numeric(6,1);
alter table produtos add column if not exists comprimento_cm numeric(6,1);

-- 4) CEP de onde a loja envia (para o frete exato)
alter table lojas add column if not exists cep_origem text;
