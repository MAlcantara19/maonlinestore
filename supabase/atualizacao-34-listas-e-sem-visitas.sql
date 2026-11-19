-- =====================================================================
-- ATUALIZAÇÃO 34 — LISTA DE NATAL COM CONTADOR + PRODUTOS QUE NINGUÉM VÊ
-- Rodar UMA vez no SQL Editor (DEPOIS da 33). Não apaga nada.
-- =====================================================================

-- 1) 🎄 LISTAS DE PRESENTES (Lista de Natal, aniversário, amigo secreto...)
--    O cliente monta a lista nos favoritos e manda o link. Quem abre
--    toca em "🎁 Vou dar este" e todo mundo vê o que já foi garantido
--    (assim ninguém dá o mesmo presente). Ninguém é identificado.
create table if not exists listas_presentes (
  id         uuid primary key default gen_random_uuid(),
  loja_id    uuid not null references lojas(id) on delete cascade,
  codigo     text not null unique,            -- vai no link: /vitraforma/lista/AB12CD
  nome       text,                             -- "Ana"
  titulo     text,                             -- "Minha lista de Natal 🎄"
  produtos   uuid[] not null default '{}',
  origem     text,
  criado_em  timestamptz not null default now()
);
create index if not exists listas_presentes_loja on listas_presentes (loja_id, criado_em desc);
alter table listas_presentes enable row level security;
drop policy if exists "listas_admin" on listas_presentes;
create policy "listas_admin" on listas_presentes for select to authenticated using (pode_editar(loja_id));

create table if not exists listas_presentes_marcas (
  lista_id   uuid not null references listas_presentes(id) on delete cascade,
  produto_id uuid not null,
  origem     text not null,
  criado_em  timestamptz not null default now(),
  primary key (lista_id, produto_id, origem)
);
alter table listas_presentes_marcas enable row level security; -- só pelas funções abaixo

-- Cria a lista e devolve o código do link
create or replace function criar_lista_presentes(p_slug text, p_nome text, p_titulo text, p_produtos uuid[]) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare v_loja uuid; v_origem text := ip_anonimo(); v_codigo text; v_ids uuid[];
begin
  select id into v_loja from lojas where slug = p_slug and ativa;
  if v_loja is null then raise exception 'Loja não encontrada'; end if;
  if (select count(*) from listas_presentes where origem = v_origem and criado_em > now() - interval '1 hour') >= 10 then
    raise exception 'Muitas listas em pouco tempo. Tente daqui a pouco.';
  end if;
  select coalesce(array_agg(p.id order by u.ord), '{}') into v_ids
    from unnest(p_produtos[1:60]) with ordinality u(id, ord) join produtos p on p.id = u.id and p.loja_id = v_loja;
  if coalesce(array_length(v_ids, 1), 0) = 0 then raise exception 'A lista está vazia'; end if;
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));
    exit when not exists (select 1 from listas_presentes where codigo = v_codigo);
  end loop;
  insert into listas_presentes (loja_id, codigo, nome, titulo, produtos, origem)
    values (v_loja, v_codigo, left(nullif(trim(p_nome), ''), 30), left(nullif(trim(p_titulo), ''), 40), v_ids, v_origem);
  return v_codigo;
end $$;
grant execute on function criar_lista_presentes(text, text, text, uuid[]) to anon, authenticated;

-- Abre a lista: nome, título, produtos e quantas pessoas marcaram cada um
create or replace function ver_lista_presentes(p_codigo text) returns json
language sql stable security definer set search_path = public
as $$
  select json_build_object(
    'nome', l.nome, 'titulo', l.titulo, 'produtos', l.produtos, 'slug', lj.slug, 'criado_em', l.criado_em,
    'marcas', coalesce((select json_object_agg(m.produto_id, m.n) from (
        select produto_id, count(*) n from listas_presentes_marcas where lista_id = l.id group by produto_id) m), '{}'::json),
    'pessoas', (select count(distinct origem) from listas_presentes_marcas where lista_id = l.id)
  )
  from listas_presentes l join lojas lj on lj.id = l.loja_id
  where l.codigo = upper(trim(p_codigo)) and lj.ativa;
$$;
grant execute on function ver_lista_presentes(text) to anon, authenticated;

-- "🎁 Vou dar este" (p_desfazer = true para desmarcar)
create or replace function marcar_presente(p_codigo text, p_produto uuid, p_desfazer boolean default false) returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare v_lista uuid; v_origem text := ip_anonimo();
begin
  select id into v_lista from listas_presentes where codigo = upper(trim(p_codigo)) and p_produto = any(produtos);
  if v_lista is null then return; end if;
  if p_desfazer then
    delete from listas_presentes_marcas where lista_id = v_lista and produto_id = p_produto and origem = v_origem;
  else
    if (select count(*) from listas_presentes_marcas where origem = v_origem and criado_em > now() - interval '1 hour') >= 30 then return; end if;
    insert into listas_presentes_marcas (lista_id, produto_id, origem) values (v_lista, p_produto, v_origem) on conflict do nothing;
  end if;
end $$;
grant execute on function marcar_presente(text, uuid, boolean) to anon, authenticated;

-- 2) 👀 PRODUTOS QUE NINGUÉM VÊ — quantas vezes cada produto foi aberto
--    (e colocado no carrinho) nos últimos X dias. Só o dono da loja vê.
create or replace function visitas_por_produto(p_loja uuid, p_dias int default 30)
returns table (produto_id uuid, vistas bigint, carrinho bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not pode_editar(p_loja) then return; end if;
  return query
    select e.produto_id,
           count(*) filter (where e.tipo = 'visita_produto'),
           count(*) filter (where e.tipo = 'carrinho_add')
    from eventos e
    where e.loja_id = p_loja and e.produto_id is not null
      and e.criado_em > now() - make_interval(days => least(greatest(p_dias, 1), 365))
    group by e.produto_id;
end $$;
grant execute on function visitas_por_produto(uuid, int) to authenticated;
