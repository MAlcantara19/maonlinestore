-- =====================================================================
-- ATUALIZAÇÃO 28 — PIX À VISTA, CUPOM DE PRIMEIRA COMPRA, FIDELIDADE,
--                  PRÉVIA DE COR E LINK DO PEDIDO COM A CARA DA LOJA
-- Rodar UMA vez no SQL Editor (depois da 27). Não apaga nada.
-- =====================================================================

-- 1) Configurações novas de cada loja
alter table lojas add column if not exists desconto_pix int check (desconto_pix between 1 and 50);        -- ex.: 10 (%)
alter table lojas add column if not exists boas_vindas_pct int check (boas_vindas_pct between 1 and 50);  -- 1ª compra, ex.: 5 (%)
alter table lojas add column if not exists fidelidade_a_cada numeric(10,2);                               -- ex.: 100 (R$ gastos)
alter table lojas add column if not exists fidelidade_premio_pct int check (fidelidade_premio_pct between 1 and 50); -- ex.: 10 (%)

-- 2) Prévia de cor na foto do produto
alter table produtos add column if not exists previa_cor boolean not null default false;

-- 3) É a primeira compra deste WhatsApp nesta loja? (o site só recebe sim/não)
create or replace function primeira_compra(p_slug text, p_telefone text) returns boolean
language sql stable security definer set search_path = public
as $$
  select length(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')) >= 10
     and not exists (
       select 1 from pedidos pe join lojas l on l.id = pe.loja_id
        where l.slug = p_slug and pe.status <> 'cancelado' and not pe.teste
          and right(pe.cliente_whatsapp, 9) = right(regexp_replace(p_telefone, '\D', '', 'g'), 9))
$$;
grant execute on function primeira_compra(text, text) to anon, authenticated;

-- 4) Fidelidade: prêmios (cupons) já entregues a cada cliente
create table if not exists fidelidade_premios (
  id            uuid primary key default gen_random_uuid(),
  loja_id       uuid not null references lojas(id) on delete cascade,
  cliente_chave text not null,     -- WhatsApp (últimos 9 números) ou nome
  cupom         text not null,
  criado_em     timestamptz not null default now()
);
alter table fidelidade_premios enable row level security;
drop policy if exists "fidelidade_admin" on fidelidade_premios;
create policy "fidelidade_admin" on fidelidade_premios for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));
drop policy if exists mfa_obrigatorio on fidelidade_premios;
create policy mfa_obrigatorio on fidelidade_premios as restrictive for all to authenticated using (mfa_ok()) with check (mfa_ok());

-- 5) Acompanhamento: agora também devolve a loja (nome e logo na prévia do link)
drop function if exists pedido_extras(text);
create or replace function pedido_extras(p_codigo text)
returns table (previsao_entrega date, entrega text, frete numeric, avaliado boolean, loja_slug text, loja_nome text, loja_logo text, loja_cor text)
language sql stable security definer set search_path = public
as $$
  select p.previsao_entrega, p.entrega, p.frete, p.avaliado, l.slug, l.nome, l.logo_url, l.cor
    from pedidos p join lojas l on l.id = p.loja_id
   where p.codigo = upper(trim(p_codigo))
$$;
grant execute on function pedido_extras(text) to anon, authenticated;

-- 6) Fidelidade: o cliente vê só o PROGRESSO (%) até o próximo prêmio
create or replace function fidelidade_progresso(p_slug text, p_telefone text) returns table (progresso int, a_cada numeric, premio int)
language plpgsql stable security definer set search_path = public
as $$
declare v_loja lojas%rowtype; v_fone text := right(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), 9); v_gasto numeric; v_premios int;
begin
  select * into v_loja from lojas where slug = p_slug and ativa;
  if v_loja.id is null or coalesce(v_loja.fidelidade_a_cada, 0) <= 0 or v_loja.fidelidade_premio_pct is null or length(v_fone) < 9 then return; end if;
  select coalesce(sum(valor_pago), 0) into v_gasto from pedidos
   where loja_id = v_loja.id and not teste and status <> 'cancelado' and right(cliente_whatsapp, 9) = v_fone;
  select count(*) into v_premios from fidelidade_premios where loja_id = v_loja.id and cliente_chave = v_fone;
  return query select least(100, greatest(0, floor(((v_gasto - v_premios * v_loja.fidelidade_a_cada) / v_loja.fidelidade_a_cada) * 100)))::int,
                      v_loja.fidelidade_a_cada, v_loja.fidelidade_premio_pct;
end $$;
grant execute on function fidelidade_progresso(text, text) to anon, authenticated;

-- 7) Contas a pagar (saídas que ainda vão vencer)
alter table movimentacoes add column if not exists pago boolean not null default true;
alter table movimentacoes add column if not exists vencimento date;

-- 8) Página "Quem somos" da MA Online Store
alter table site_config add column if not exists quem_somos_titulo text default 'Quem somos';
alter table site_config add column if not exists quem_somos_texto text;
alter table site_config add column if not exists quem_somos_foto text;
