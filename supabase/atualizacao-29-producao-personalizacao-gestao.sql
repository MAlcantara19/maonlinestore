-- =====================================================================
-- ATUALIZAÇÃO 29 — FOTO DA PRODUÇÃO, PERSONALIZAÇÃO COM PRÉVIA, TEMPO DE
-- IMPRESSÃO, MATERIAIS, DESPESAS FIXAS, COMISSÃO, HISTÓRICO DE PREÇOS,
-- ANIVERSÁRIO, INDIQUE UM AMIGO E BANNER ROTATIVO
-- Rodar UMA vez no SQL Editor (depois da 28). Não apaga nada.
-- =====================================================================

-- 1) Fotos da produção no pedido (o cliente vê no acompanhamento)
alter table pedidos add column if not exists fotos_producao text[] not null default '{}';
alter table pedidos add column if not exists avaliacao_pedida_em timestamptz;  -- lembrete de avaliação já enviado
drop function if exists pedido_extras(text);
create or replace function pedido_extras(p_codigo text)
returns table (previsao_entrega date, entrega text, frete numeric, avaliado boolean, loja_slug text, loja_nome text, loja_logo text, loja_cor text, fotos_producao text[])
language sql stable security definer set search_path = public
as $$
  select p.previsao_entrega, p.entrega, p.frete, p.avaliado, l.slug, l.nome, l.logo_url, l.cor, p.fotos_producao
    from pedidos p join lojas l on l.id = p.loja_id
   where p.codigo = upper(trim(p_codigo))
$$;
grant execute on function pedido_extras(text) to anon, authenticated;

-- 2) Personalização com prévia (texto na foto) e tempo de impressão
--    personalizacao: { "rotulo": "Nome", "x": 50, "y": 70, "cor": "#ffffff", "tamanho": 8, "fonte": "cursiva", "max": 20 }
alter table produtos add column if not exists personalizacao jsonb;
alter table produtos add column if not exists tempo_min int;   -- minutos de impressão por unidade

-- 3) Estoque de MATERIAL (filamento, embalagens...) em gramas/unidades
create table if not exists materiais (
  id          uuid primary key default gen_random_uuid(),
  loja_id     uuid not null references lojas(id) on delete cascade,
  nome        text not null,           -- ex.: "PLA Roxo"
  cor         text,                    -- cor da bolinha
  unidade     text not null default 'g' check (unidade in ('g', 'un', 'm')),
  quantidade  numeric(12,1) not null default 0,
  minimo      numeric(12,1),           -- avisar quando ficar abaixo
  custo_kg    numeric(10,2),
  criado_em   timestamptz not null default now()
);
alter table materiais enable row level security;
drop policy if exists "materiais_admin" on materiais;
create policy "materiais_admin" on materiais for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));
drop policy if exists mfa_obrigatorio on materiais;
create policy mfa_obrigatorio on materiais as restrictive for all to authenticated using (mfa_ok()) with check (mfa_ok());

-- 4) Despesas FIXAS que se repetem todo mês (viram "contas a pagar" sozinhas)
create table if not exists despesas_fixas (
  id          uuid primary key default gen_random_uuid(),
  loja_id     uuid not null references lojas(id) on delete cascade,
  descricao   text not null,
  valor       numeric(12,2) not null,
  dia         int not null default 10 check (dia between 1 and 28),
  categoria   text not null default 'taxas',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);
alter table despesas_fixas enable row level security;
drop policy if exists "despesas_admin" on despesas_fixas;
create policy "despesas_admin" on despesas_fixas for all to authenticated using (pode_editar(loja_id)) with check (pode_editar(loja_id));
alter table movimentacoes add column if not exists recorrente_id uuid references despesas_fixas(id) on delete set null;

-- 5) Comissão / repasse da MA por loja (%)
alter table lojas add column if not exists comissao_pct numeric(5,2);

-- 6) Histórico de preços (o banco anota sozinho toda mudança de preço)
create table if not exists precos_historico (
  id           bigserial primary key,
  produto_id   uuid not null references produtos(id) on delete cascade,
  preco_antigo numeric(10,2),
  preco_novo   numeric(10,2),
  quem         text default (auth.jwt()->>'email'),
  criado_em    timestamptz not null default now()
);
alter table precos_historico enable row level security;
drop policy if exists "precos_ler" on precos_historico;
create policy "precos_ler" on precos_historico for select to authenticated
  using (pode_editar((select loja_id from produtos where id = produto_id)));
create or replace function anotar_preco() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.preco is distinct from old.preco then
    insert into precos_historico (produto_id, preco_antigo, preco_novo) values (new.id, old.preco, new.preco);
  end if;
  return new;
end $$;
drop trigger if exists anotar_preco on produtos;
create trigger anotar_preco after update of preco on produtos for each row execute function anotar_preco();

-- 7) Aniversário e "Indique um amigo"
alter table pedidos add column if not exists cliente_aniversario date;
alter table pedidos add column if not exists indicado_por text;          -- WhatsApp (9 últimos) de quem indicou
alter table lojas add column if not exists aniversario_pct int check (aniversario_pct between 1 and 50);
alter table lojas add column if not exists indicacao_pct int check (indicacao_pct between 1 and 50);
alter table fidelidade_premios add column if not exists motivo text not null default 'fidelidade';

-- A fidelidade conta só os prêmios de fidelidade (não os de aniversário/indicação)
create or replace function fidelidade_progresso(p_slug text, p_telefone text) returns table (progresso int, a_cada numeric, premio int)
language plpgsql stable security definer set search_path = public
as $$
declare v_loja lojas%rowtype; v_fone text := right(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), 9); v_gasto numeric; v_premios int;
begin
  select * into v_loja from lojas where slug = p_slug and ativa;
  if v_loja.id is null or coalesce(v_loja.fidelidade_a_cada, 0) <= 0 or v_loja.fidelidade_premio_pct is null or length(v_fone) < 9 then return; end if;
  select coalesce(sum(valor_pago), 0) into v_gasto from pedidos
   where loja_id = v_loja.id and not teste and status <> 'cancelado' and right(cliente_whatsapp, 9) = v_fone;
  select count(*) into v_premios from fidelidade_premios where loja_id = v_loja.id and cliente_chave = v_fone and motivo = 'fidelidade';
  return query select least(100, greatest(0, floor(((v_gasto - v_premios * v_loja.fidelidade_a_cada) / v_loja.fidelidade_a_cada) * 100)))::int,
                      v_loja.fidelidade_a_cada, v_loja.fidelidade_premio_pct;
end $$;

-- Função do pedido: agora guarda aniversário e quem indicou
drop function if exists criar_pedido(uuid, text, text, jsonb, numeric, numeric, text, date, boolean, text, numeric, text);
create or replace function criar_pedido(
  p_loja uuid, p_tipo text, p_nome text, p_itens jsonb, p_total numeric, p_desconto numeric,
  p_cupom text, p_data date, p_urgente boolean, p_entrega text default null, p_frete numeric default null,
  p_telefone text default null, p_aniversario date default null, p_indicado_por text default null
) returns text
language plpgsql security definer set search_path = public
as $$
declare v_codigo text; v_origem text := ip_anonimo(); v_tel text := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '');
        v_ind text := nullif(right(regexp_replace(coalesce(p_indicado_por, ''), '\D', '', 'g'), 9), '');
begin
  if not exists (select 1 from lojas where id = p_loja and ativa) then raise exception 'Loja inválida'; end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 100 then raise exception 'Itens inválidos'; end if;
  if (select count(*) from pedidos where origem = v_origem and criado_em > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos pedidos seguidos. Espere alguns minutos, por favor.';
  end if;
  if (select count(*) from pedidos where criado_em > now() - interval '1 hour') >= 200 then
    raise exception 'Muitos pedidos agora. Tente de novo em instantes.';
  end if;
  if v_tel is not null and length(v_tel) not between 10 and 13 then v_tel := null; end if;
  if v_ind is not null and (length(v_ind) < 9 or v_ind = right(coalesce(v_tel, ''), 9)) then v_ind := null; end if; -- não vale indicar a si mesmo
  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from pedidos where codigo = v_codigo);
  end loop;
  insert into pedidos (codigo, loja_id, tipo, cliente_nome, itens, total, desconto, cupom, data_desejada, urgente, origem, entrega, frete,
                       cliente_whatsapp, cliente_aniversario, indicado_por)
  values (v_codigo, p_loja, case when p_tipo = 'orcamento' then 'orcamento' else 'pedido' end,
          left(p_nome, 80), p_itens, p_total, p_desconto, left(p_cupom, 40), p_data, coalesce(p_urgente, false), v_origem,
          left(p_entrega, 120), p_frete, v_tel, p_aniversario, v_ind);
  return v_codigo;
end $$;
grant execute on function criar_pedido(uuid, text, text, jsonb, numeric, numeric, text, date, boolean, text, numeric, text, date, text) to anon, authenticated;

-- 8) Banner rotativo de promoções no topo da loja
--    slides: [{ "imagem": "...", "titulo": "Natal com 10%", "texto": "...", "link": "/vitraforma#colecao-..." }]
alter table lojas add column if not exists slides jsonb not null default '[]'::jsonb;
