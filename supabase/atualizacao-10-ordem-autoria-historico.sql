-- =====================================================================
-- ATUALIZAÇÃO 10 — UNIDADE DOS TAMANHOS, AUTORIA E HISTÓRICO
-- Rodar UMA vez no SQL Editor (depois da 09). Não apaga nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) UNIDADE PADRÃO DOS TAMANHOS: digitou só "20" → vira "20 cm"
--    (cada loja tem a sua: cm, ml, g, un.; vazio = sem unidade)
-- ---------------------------------------------------------------------
alter table lojas add column if not exists unidade_tamanho text not null default 'cm';
update lojas set unidade_tamanho = 'un.' where slug = 'sonhos';
update lojas set unidade_tamanho = 'g'   where slug = 'chocolate';
update lojas set unidade_tamanho = 'ml'  where slug = 'aromas';
update lojas set unidade_tamanho = ''    where slug = 'gallerie';

-- ---------------------------------------------------------------------
-- 2) AUTORIA: quem criou e quem alterou por último (e quando).
--    Preenchido SOZINHO pelo banco, com o e-mail de quem está logado.
-- ---------------------------------------------------------------------
alter table produtos   add column if not exists criado_por text, add column if not exists atualizado_por text, add column if not exists atualizado_em timestamptz;
alter table categorias add column if not exists criado_em timestamptz default now(), add column if not exists criado_por text, add column if not exists atualizado_por text, add column if not exists atualizado_em timestamptz;
alter table colecoes   add column if not exists criado_em timestamptz default now(), add column if not exists criado_por text, add column if not exists atualizado_por text, add column if not exists atualizado_em timestamptz;
alter table cupons     add column if not exists criado_por text, add column if not exists atualizado_por text, add column if not exists atualizado_em timestamptz;
alter table parceiros  add column if not exists criado_em timestamptz default now(), add column if not exists criado_por text, add column if not exists atualizado_por text, add column if not exists atualizado_em timestamptz;

create or replace function email_logado() returns text
language sql stable security definer set search_path = public, auth
as $$ select coalesce((select email from auth.users where id = auth.uid()), 'sistema') $$;

create or replace function registrar_autoria() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_por := email_logado();
    new.criado_em := coalesce(new.criado_em, now());
  end if;
  new.atualizado_por := email_logado();
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists autoria on produtos;   create trigger autoria before insert or update on produtos   for each row execute function registrar_autoria();
drop trigger if exists autoria on categorias; create trigger autoria before insert or update on categorias for each row execute function registrar_autoria();
drop trigger if exists autoria on colecoes;   create trigger autoria before insert or update on colecoes   for each row execute function registrar_autoria();
drop trigger if exists autoria on cupons;     create trigger autoria before insert or update on cupons     for each row execute function registrar_autoria();
drop trigger if exists autoria on parceiros;  create trigger autoria before insert or update on parceiros  for each row execute function registrar_autoria();

-- ---------------------------------------------------------------------
-- 3) HISTÓRICO: um "diário" de tudo que foi criado, alterado ou apagado
--    (aba Histórico no painel). Bom para achar quem mexeu e quando.
-- ---------------------------------------------------------------------
create table if not exists historico (
  id           bigserial primary key,
  loja_id      uuid,                 -- vazio = coisa geral (parceiros)
  tabela       text not null,
  acao         text not null,
  registro_id  uuid,
  nome         text,
  email        text,
  quando       timestamptz not null default now()
);
create index if not exists historico_loja_quando on historico (loja_id, quando desc);
alter table historico enable row level security;
drop policy if exists "historico_ler" on historico;
create policy "historico_ler" on historico for select to authenticated
  using (eh_master() or (loja_id is not null and pode_editar(loja_id)));

create or replace function registrar_historico() returns trigger
language plpgsql security definer set search_path = public
as $$
declare r jsonb; v_acao text;
begin
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;
  v_acao := case tg_op when 'INSERT' then 'criou' when 'DELETE' then 'apagou' else 'alterou' end;
  -- Produtos: lixeira e restauração aparecem com o nome certo
  if tg_table_name = 'produtos' and tg_op = 'UPDATE' then
    if old.excluido_em is null and new.excluido_em is not null then v_acao := 'mandou para a lixeira'; end if;
    if old.excluido_em is not null and new.excluido_em is null then v_acao := 'restaurou'; end if;
  end if;
  insert into historico (loja_id, tabela, acao, registro_id, nome, email)
  values (
    case when tg_table_name = 'lojas' then (r->>'id')::uuid else nullif(r->>'loja_id', '')::uuid end,
    tg_table_name, v_acao, (r->>'id')::uuid, coalesce(r->>'nome', r->>'codigo'), email_logado()
  );
  return null;
end $$;

drop trigger if exists historico on produtos;   create trigger historico after insert or update or delete on produtos   for each row execute function registrar_historico();
drop trigger if exists historico on categorias; create trigger historico after insert or update or delete on categorias for each row execute function registrar_historico();
drop trigger if exists historico on colecoes;   create trigger historico after insert or update or delete on colecoes   for each row execute function registrar_historico();
drop trigger if exists historico on cupons;     create trigger historico after insert or update or delete on cupons     for each row execute function registrar_historico();
drop trigger if exists historico on lojas;      create trigger historico after update on lojas                          for each row execute function registrar_historico();
drop trigger if exists historico on parceiros;  create trigger historico after insert or update or delete on parceiros  for each row execute function registrar_historico();
