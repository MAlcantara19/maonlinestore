-- =====================================================================
-- ATUALIZAÇÃO 22 — CRIAR LOJAS NOVAS PELO PAINEL + LOJA "CAIS TROPICAL"
-- Rodar UMA vez no SQL Editor (depois da 21).
-- =====================================================================

-- 1) Função para o master criar uma loja nova pelo painel (botão "➕ Nova loja")
--    A loja nasce "Em breve" (não aparece aberta até você terminar de montar).
create or replace function criar_loja(p_nome text, p_slug text, p_cor text default '#3B1260', p_whatsapp text default null, p_descricao text default null)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_slug text := lower(trim(p_slug));
begin
  if not eh_master() or not mfa_ok() then raise exception 'Só o administrador master pode criar lojas.'; end if;
  if coalesce(trim(p_nome), '') = '' then raise exception 'Dê um nome para a loja.'; end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Endereço inválido: use letras minúsculas, números e hífen (ex.: cais-tropical).'; end if;
  if v_slug in ('admin', 'api', 'parceiros', 'pedido', 'privacidade', 'termos', 'sacola', 'meus-pedidos') then raise exception 'Esse endereço é reservado pelo site.'; end if;
  if exists (select 1 from lojas where slug = v_slug) then raise exception 'Já existe uma loja com esse endereço.'; end if;
  insert into lojas (nome, slug, cor, whatsapp, descricao, ativa, em_breve, ordem)
  values (trim(p_nome), v_slug, coalesce(p_cor, '#3B1260'), nullif(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g'), ''),
          nullif(trim(coalesce(p_descricao, '')), ''), true, true, coalesce((select max(ordem) from lojas), 0) + 1);
  return v_slug;
end $$;
grant execute on function criar_loja(text, text, text, text, text) to authenticated;

-- 2) Já cria a CAIS TROPICAL (ecobags pintadas à mão), começando "Em breve".
--    Depois: painel → Cais Tropical → coloque o WhatsApp, a logo e as cores.
insert into lojas (nome, slug, cor, cor_secundaria, descricao, ativa, em_breve, ordem)
select 'Cais Tropical', 'cais-tropical', '#0E7C7B', '#FFD6A5', 'Ecobags pintadas à mão 🌴', true, true, coalesce(max(ordem), 0) + 1
from lojas
where not exists (select 1 from lojas where slug = 'cais-tropical');
