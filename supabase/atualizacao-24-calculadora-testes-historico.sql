-- =====================================================================
-- ATUALIZAÇÃO 24 — CALCULADORA 3D, PEDIDOS DE TESTE, HISTÓRICO DE VISITAS
-- Rodar UMA vez no SQL Editor (depois da 23). Não apaga nada.
-- =====================================================================

-- 1) Calculadora de preços de impressão 3D (aparece só nas lojas marcadas)
alter table lojas add column if not exists calculadora_3d boolean not null default false;
update lojas set calculadora_3d = true where slug = 'vitraforma';

-- 2) Pedidos de TESTE: não entram nas estatísticas (e dá para apagar)
alter table pedidos add column if not exists teste boolean not null default false;

-- 3) Histórico de visitas: código ANÔNIMO do aparelho ("Visitante #A3F2K9"),
--    tipo de aparelho e um detalhe (ex.: o pedido enviado e o nome que a
--    própria pessoa digitou no carrinho).
alter table eventos add column if not exists visitante text;
alter table eventos add column if not exists aparelho text;
alter table eventos add column if not exists detalhe text;
create index if not exists eventos_loja_visitante on eventos (loja_id, visitante, criado_em desc);
drop policy if exists "eventos_apagar" on eventos;
create policy "eventos_apagar" on eventos for delete to authenticated using (pode_editar(loja_id));

drop function if exists registrar_evento(text, text, uuid);
create or replace function registrar_evento(p_slug text, p_tipo text, p_produto uuid default null,
  p_visitante text default null, p_aparelho text default null, p_detalhe text default null) returns void
language plpgsql security definer set search_path = public
as $$
declare v_loja uuid; v_origem text := ip_anonimo();
begin
  select id into v_loja from lojas where slug = p_slug and ativa;
  if v_loja is null then return; end if;
  if (select count(*) from eventos where origem = v_origem and criado_em > now() - interval '1 hour') >= 300 then return; end if;
  insert into eventos (loja_id, produto_id, tipo, origem, visitante, aparelho, detalhe)
  values (v_loja, case when exists (select 1 from produtos where id = p_produto and loja_id = v_loja) then p_produto end,
          p_tipo, v_origem, left(p_visitante, 12), left(p_aparelho, 40), left(p_detalhe, 120));
end $$;
grant execute on function registrar_evento(text, text, uuid, text, text, text) to anon, authenticated;

-- Linha do tempo das visitas (só para quem administra a loja)
create or replace function historico_visitas(p_loja uuid, p_visitante text default null, p_limite int default 200)
returns table (criado_em timestamptz, tipo text, produto text, visitante text, aparelho text, detalhe text, nome text)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not pode_editar(p_loja) then raise exception 'Sem permissão'; end if;
  return query
    select e.criado_em, e.tipo, p.nome, e.visitante, e.aparelho, e.detalhe,
           (select split_part(x.detalhe, ' · ', 2) from eventos x
             where x.loja_id = p_loja and x.visitante = e.visitante and x.tipo in ('pedido', 'whatsapp') and x.detalhe like '% · %'
             order by x.criado_em desc limit 1)
      from eventos e left join produtos p on p.id = e.produto_id
     where e.loja_id = p_loja and (p_visitante is null or e.visitante = p_visitante)
     order by e.criado_em desc
     limit least(greatest(p_limite, 1), 1000);
end $$;
grant execute on function historico_visitas(uuid, text, int) to authenticated;

-- 4) Estatísticas sem os pedidos de teste
create or replace function estatisticas_loja(p_loja uuid, p_dias int default 30) returns json
language plpgsql stable security definer set search_path = public
as $$
declare desde timestamptz := now() - make_interval(days => greatest(1, least(p_dias, 365)));
begin
  if not pode_editar(p_loja) then raise exception 'Sem permissão'; end if;
  return json_build_object(
    'totais', coalesce((select json_object_agg(tipo, n) from (
        select tipo, count(*) n from eventos where loja_id = p_loja and criado_em > desde group by tipo) t), '{}'::json),
    'visitantes', (select count(distinct origem) from eventos where loja_id = p_loja and criado_em > desde),
    'por_dia', coalesce((select json_agg(d order by d.dia) from (
        select (criado_em at time zone 'America/Sao_Paulo')::date as dia, tipo, count(*) n
        from eventos where loja_id = p_loja and criado_em > desde group by 1, 2) d), '[]'::json),
    'top', coalesce((select json_agg(x) from (
        select e.tipo, p.nome, count(*) n from eventos e join produtos p on p.id = e.produto_id
        where e.loja_id = p_loja and e.criado_em > desde group by e.tipo, p.nome order by n desc limit 60) x), '[]'::json),
    'recentes', coalesce((select json_agg(r) from (
        select e.tipo, e.criado_em, p.nome from eventos e left join produtos p on p.id = e.produto_id
        where e.loja_id = p_loja order by e.criado_em desc limit 40) r), '[]'::json),
    'pedidos', (select count(*) from pedidos where loja_id = p_loja and criado_em > desde and not teste),
    'faturamento', coalesce((select sum(total) from pedidos where loja_id = p_loja and criado_em > desde and status <> 'cancelado' and not teste), 0)
  );
end $$;
grant execute on function estatisticas_loja(uuid, int) to authenticated;
