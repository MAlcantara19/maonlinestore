-- =====================================================================
-- ATUALIZAÇÃO 14 — SEGURANÇA, ESTATÍSTICAS, AVALIAÇÕES E EFEITO DO PAINEL
-- Rodar UMA vez no SQL Editor (depois da 13). Não apaga nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) "Impressão digital" anônima de quem acessa: o IP vira um código
--    embaralhado (não dá para saber quem é). Serve só para limitar abusos.
-- ---------------------------------------------------------------------
create or replace function ip_anonimo() returns text
language sql stable
as $$
  select md5(coalesce(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), 'sem-ip') || 'ma-online-store')
$$;

-- ---------------------------------------------------------------------
-- 1) PROTEÇÃO CONTRA PEDIDOS FALSOS (robôs enchendo a aba Pedidos)
--    Máximo de 5 pedidos a cada 10 minutos por aparelho/rede,
--    e 200 por hora no site todo.
-- ---------------------------------------------------------------------
alter table pedidos add column if not exists origem text;

create or replace function criar_pedido(
  p_loja uuid, p_tipo text, p_nome text, p_itens jsonb, p_total numeric, p_desconto numeric,
  p_cupom text, p_data date, p_urgente boolean
) returns text
language plpgsql security definer set search_path = public
as $$
declare v_codigo text; v_origem text := ip_anonimo();
begin
  if not exists (select 1 from lojas where id = p_loja and ativa) then raise exception 'Loja inválida'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 100 then raise exception 'Itens inválidos'; end if;
  if (select count(*) from pedidos where origem = v_origem and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos pedidos seguidos. Espere alguns minutos, por favor.';
  end if;
  if (select count(*) from pedidos where criado_em > now() - interval '1 hour') >= 200 then
    raise exception 'Muitos pedidos agora. Tente de novo em instantes.';
  end if;
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from pedidos where codigo = v_codigo);
  end loop;
  insert into pedidos (codigo, loja_id, tipo, cliente_nome, itens, total, desconto, cupom, data_desejada, urgente, origem)
  values (v_codigo, p_loja, case when p_tipo = 'orcamento' then 'orcamento' else 'pedido' end,
          left(p_nome, 80), p_itens, p_total, p_desconto, left(p_cupom, 40), p_data, coalesce(p_urgente, false), v_origem);
  return v_codigo;
end $$;

-- ---------------------------------------------------------------------
-- 2) ESTATÍSTICAS: cada visita, produto aberto, item no carrinho,
--    item tirado do carrinho, favorito e clique no WhatsApp vira um
--    "evento" ANÔNIMO. O painel de cada loja mostra gráficos e o que
--    aconteceu agora há pouco.
-- ---------------------------------------------------------------------
create table if not exists eventos (
  id          bigserial primary key,
  loja_id     uuid not null references lojas(id) on delete cascade,
  produto_id  uuid references produtos(id) on delete set null,
  tipo        text not null check (tipo in ('visita_loja', 'visita_produto', 'carrinho_add', 'carrinho_remove', 'favorito', 'pedido', 'whatsapp')),
  origem      text,
  criado_em   timestamptz not null default now()
);
create index if not exists eventos_loja_quando on eventos (loja_id, criado_em desc);
alter table eventos enable row level security;
create policy "eventos_admin" on eventos for select to authenticated using (pode_editar(loja_id));

-- O site registra pelo endereço da loja (slug). Limite: 300 eventos/hora por aparelho.
create or replace function registrar_evento(p_slug text, p_tipo text, p_produto uuid default null) returns void
language plpgsql security definer set search_path = public
as $$
declare v_loja uuid; v_origem text := ip_anonimo();
begin
  select id into v_loja from lojas where slug = p_slug and ativa;
  if v_loja is null then return; end if;
  if (select count(*) from eventos where origem = v_origem and criado_em > now() - interval '1 hour') >= 300 then return; end if;
  insert into eventos (loja_id, produto_id, tipo, origem)
  values (v_loja, case when exists (select 1 from produtos where id = p_produto and loja_id = v_loja) then p_produto end, p_tipo, v_origem);
end $$;
grant execute on function registrar_evento(text, text, uuid) to anon, authenticated;

-- Resumo para o painel (só quem administra a loja consegue ver)
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
    'pedidos', (select count(*) from pedidos where loja_id = p_loja and criado_em > desde),
    'faturamento', coalesce((select sum(total) from pedidos where loja_id = p_loja and criado_em > desde and status <> 'cancelado'), 0)
  );
end $$;
grant execute on function estatisticas_loja(uuid, int) to authenticated;

-- ---------------------------------------------------------------------
-- 3) AVALIAÇÕES DE CLIENTES (vocês cadastram: nome, texto, estrelas, foto)
-- ---------------------------------------------------------------------
create table if not exists avaliacoes (
  id          uuid primary key default gen_random_uuid(),
  loja_id     uuid not null references lojas(id) on delete cascade,
  produto_id  uuid references produtos(id) on delete set null,  -- vazio = avaliação da loja
  nome        text,
  texto       text not null,
  foto_url    text,
  estrelas    int not null default 5 check (estrelas between 1 and 5),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);
alter table avaliacoes enable row level security;
create policy "avaliacoes_ler"    on avaliacoes for select using (ativo or pode_editar(loja_id));
create policy "avaliacoes_gravar" on avaliacoes for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));

-- ---------------------------------------------------------------------
-- 4) EFEITO ANIMADO NO PAINEL DE ADMINISTRAÇÃO (escolhido pelo master)
-- ---------------------------------------------------------------------
alter table site_config add column if not exists efeito_painel tipo_efeito not null default 'nenhum';
