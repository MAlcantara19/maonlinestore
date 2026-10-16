-- =====================================================================
-- ATUALIZAÇÃO 06 — PARCEIROS
-- Rodar UMA vez no SQL Editor. Não apaga nada.
--
-- Uma linha por parceiro indicado no site (academia, escola, nutricionista...).
-- Aparece em: página inicial (faixa "Parceiros"), /parceiros e
-- /parceiros/<slug> (página do parceiro, com mapa).
-- Campos vazios simplesmente não aparecem.
-- =====================================================================
create table parceiros (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,          -- endereço: /parceiros/judo-clube-denis
  nome       text not null,
  categoria  text,                          -- etiqueta: "Judô", "Escola", "Nutrição"...
  descricao  text,                          -- texto explicativo (pode ter emojis e várias linhas)
  horarios   text,                          -- ex.: "Seg e Qua · 18h às 20h" (várias linhas)
  endereco   text,                          -- endereço completo: gera o mapa sozinho
  whatsapp   text,                          -- 55 + DDD + número
  instagram  text,                          -- @usuario, usuario ou link
  site       text,                          -- link completo, se tiver
  logo_url   text,
  foto_url   text,                          -- foto grande do local/pessoa
  cor        text default '#1c1917',        -- cor do cartão/banner do parceiro
  ativo      boolean not null default true,
  ordem      int not null default 0
);

-- Segurança: todo mundo LÊ os ativos; só o master cria/edita/apaga.
alter table parceiros enable row level security;
create policy "parceiros_ler"    on parceiros for select using (ativo or eh_master());
create policy "parceiros_gravar" on parceiros for all to authenticated using (eh_master()) with check (eh_master());

-- Exemplos para começar: complete no Table Editor > parceiros
-- (endereço, horários, WhatsApp, Instagram, fotos). ⚠️ Peça autorização
-- a cada parceiro antes de publicar os dados e as fotos deles.
insert into parceiros (slug, nome, categoria, descricao, cor, ordem) values
  ('judo-clube-denis', 'Judô Clube Denis', 'Judô', 'Aulas de judô para crianças e adultos 🥋', '#1d4ed8', 1),
  ('colegio-santa-clara', 'Colégio Santa Clara', 'Escola', 'Escola parceira, com judô na grade de atividades 📚', '#047857', 2),
  ('nutricionista', 'Nutricionista (nome a definir)', 'Nutrição', 'Acompanhamento nutricional 🥗', '#65a30d', 3);
