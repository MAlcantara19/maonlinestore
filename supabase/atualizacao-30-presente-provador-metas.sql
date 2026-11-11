-- =====================================================================
-- ATUALIZAÇÃO 30 — EMBALAGEM DE PRESENTE, "PESSOAS VENDO AGORA",
--                  CAIXA PADRÃO DO FRETE E META POR PRODUTO
-- Rodar UMA vez no SQL Editor (depois da 29). Não apaga nada.
-- =====================================================================

-- 1) 👀 Quantas pessoas (aparelhos diferentes) abriram o produto nos últimos 5 minutos
create or replace function vendo_agora(p_produto uuid) returns int
language sql stable security definer set search_path = public
as $$
  select count(distinct coalesce(visitante, origem))::int from eventos
   where produto_id = p_produto and tipo = 'visita_produto' and criado_em > now() - interval '5 minutes'
$$;
grant execute on function vendo_agora(uuid) to anon, authenticated;

-- 2) 🎁 Embalagem de presente da loja: { "ativo": true, "preco": 12.9, "descricao": "...", "foto": "..." }
alter table lojas add column if not exists presente jsonb;

-- 3) 📦 Caixa padrão para o frete exato (quando o produto não tem medidas)
--    { "peso_g": 300, "altura_cm": 10, "largura_cm": 15, "comprimento_cm": 20 }
alter table lojas add column if not exists pacote_padrao jsonb;

-- 4) 🎯 Meta de vendas por produto (unidades por mês)
alter table produtos add column if not exists meta_mensal int;
