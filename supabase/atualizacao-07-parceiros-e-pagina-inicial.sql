-- =====================================================================
-- ATUALIZAÇÃO 07 — PARCEIROS PERSONALIZÁVEIS + CONFIGURAÇÃO DA PÁGINA INICIAL
-- Rodar UMA vez no SQL Editor (depois da 05 e da 06). Não apaga nada.
-- =====================================================================

-- 1) Parceiros: efeito animado, destaque e selo
--    destaque = aparece primeiro e com borda dourada
--    selo     = etiqueta no cartão (ex.: "Patrocinado", "Desconto", "Indicação")
alter table parceiros add column if not exists efeito tipo_efeito not null default 'nenhum';
alter table parceiros add column if not exists destaque boolean not null default false;
alter table parceiros add column if not exists selo text;

-- 2) Configuração da página inicial (uma linha só, id = 1)
create table if not exists site_config (
  id                 int primary key default 1 check (id = 1),
  titulo             text not null default 'MA Online Store',
  subtitulo          text default 'Escolha uma loja para ver o catálogo',
  cor                text default '#3B1260',     -- cor do topo da página inicial
  cor_secundaria     text default '#C9B3EE',     -- cor de apoio (degradê)
  banner_url         text,                       -- imagem de fundo do topo (opcional)
  efeito             tipo_efeito not null default 'nenhum',
  parceiros_na_home  int not null default 6      -- quantos parceiros mostrar (0 = todos)
);
insert into site_config (id) values (1) on conflict (id) do nothing;

alter table site_config enable row level security;
create policy "site_ler"    on site_config for select using (true);
create policy "site_gravar" on site_config for update to authenticated using (eh_master()) with check (eh_master());

-- 3) Parceiro do próprio criador do site (complete a foto no painel)
insert into parceiros (slug, nome, categoria, selo, destaque, descricao, whatsapp, instagram, cor, ordem)
values (
  'matheus-alcantara', 'Matheus Alcântara', 'Sites & Judô', 'Patrocinado', true,
  E'💻 Crio sites e lojas virtuais como esta, com a cara do seu negócio.\n🥋 Faixa preta e sensei de judô.\n\nChama no WhatsApp para conversar!',
  '5524992924519', 'm_alcantara19', '#3B1260', 0
)
on conflict (slug) do nothing;
