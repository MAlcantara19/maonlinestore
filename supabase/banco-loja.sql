-- =====================================================================
-- BANCO DE DADOS DAS LOJAS (Supabase / PostgreSQL)
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run.
-- Pode rodar uma vez só. Cada bloco abaixo tem a explicação do que faz.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) LOJAS
-- Uma linha por loja (VitraForma, Gallerie, etc.).
-- "slug" é o pedaço do endereço: /vitraforma, /chocolate...
-- "whatsapp" é o número que recebe os pedidos DESSA loja (com 55 + DDD).
-- ---------------------------------------------------------------------
create table lojas (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  nome       text not null,
  descricao  text,                      -- frase curta mostrada no círculo da página inicial
  cor        text,                      -- cor principal da marca, ex.: #3B1260
  whatsapp   text,
  logo_url   text,
  aviso_pedido text,                   -- "Como funciona o pedido": prazo, entrega, frete. Aparece na loja e no carrinho.
  ativa      boolean not null default true,   -- false = loja some do site
  ordem      int not null default 0           -- ordem dos círculos na página inicial
);


-- ---------------------------------------------------------------------
-- 2) CATEGORIAS E SUBCATEGORIAS
-- Mesma tabela para as duas coisas:
--   parent_id vazio    = é uma CATEGORIA (ex.: Brinquedos)
--   parent_id preenchido = é uma SUBCATEGORIA (ex.: Tabuleiro, dentro de Brinquedos)
-- Cada uma tem a sua própria descrição.
-- ---------------------------------------------------------------------
create table categorias (
  id         uuid primary key default gen_random_uuid(),
  loja_id    uuid not null references lojas(id) on delete cascade,
  parent_id  uuid references categorias(id) on delete cascade,
  nome       text not null,
  descricao  text,
  ordem      int not null default 0
);


-- ---------------------------------------------------------------------
-- 3) PRODUTOS
-- "preco" = preço "a partir de" mostrado no card (vazio = "sob consulta").
-- O preço de cada tamanho/versão fica na tabela "variacoes" (logo abaixo).
-- "disponibilidade" = pronta entrega, sob encomenda ou esgotado; "prazo" = texto livre, ex.: "3 a 5 dias".
-- "destaque" = aparece na frente da loja.
-- "ativo" = false esconde o produto sem apagar (bom para produto esgotado).
-- ---------------------------------------------------------------------
create table produtos (
  id            uuid primary key default gen_random_uuid(),
  loja_id       uuid not null references lojas(id) on delete cascade,
  categoria_id  uuid references categorias(id) on delete set null,
  nome          text not null,
  descricao     text,
  restricoes    text,                 -- avisos do produto (ex.: prazo, cores disponíveis, limite de tamanho)
  preco         numeric(10,2),
  disponibilidade text not null default 'pronta_entrega'
                  check (disponibilidade in ('pronta_entrega', 'sob_encomenda', 'esgotado')),
  prazo         text,
  destaque      boolean not null default false,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 4) MÍDIAS (fotos e vídeos de cada produto)
-- Sem limite de quantidade: cada foto/vídeo é uma linha.
-- "url" é o endereço do arquivo guardado no Storage (bloco 8).
-- ---------------------------------------------------------------------
create table midias (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references produtos(id) on delete cascade,
  tipo        text not null check (tipo in ('foto', 'video')),
  url         text not null,
  ordem       int not null default 0
);


-- ---------------------------------------------------------------------
-- 4A) VARIAÇÕES (cada combinação de tamanho + cor, com preço e disponibilidade próprios)
-- Cada linha é UMA opção que o cliente pode escolher. Exemplo de uma peça:
--   15 cm | azul     | R$ 40  | pronta entrega
--   20 cm | vermelho | R$ 55  | pronta entrega
--   5 cm  | (vazio)  | R$ 20  | sob encomenda   <- cor vazia = "todas as cores, cliente escolhe"
-- Na loja, o cliente escolhe o tamanho e só aparecem as cores daquele tamanho.
-- Se a variação não tiver disponibilidade/prazo próprios, vale o do produto.
-- Produto sem variação (ex.: um sabonete) simplesmente não tem linhas aqui.
-- ---------------------------------------------------------------------
create table variacoes (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references produtos(id) on delete cascade,
  tamanho     text,                    -- ex.: 15 cm, 250 ml, P/M/G (vazio = tamanho único)
  cor         text,                    -- ex.: azul (vazio = todas as cores)
  preco       numeric(10,2),
  disponibilidade text check (disponibilidade in ('pronta_entrega', 'sob_encomenda', 'esgotado')),
  prazo       text,
  ativa       boolean not null default true,
  ordem       int not null default 0
);


-- ---------------------------------------------------------------------
-- 4B) COLEÇÕES (Natal, Ano Novo, etc.)
-- Grupos de produtos que aparecem em destaque na frente da loja.
-- "ativa" = a coleção continua visível na loja (mesmo as antigas, como Dia das Crianças).
-- "em_destaque" = aparece na frente da loja agora (ex.: Natal). Dá para ter várias.
-- Um produto pode estar em várias coleções (tabela produtos_colecoes).
-- ---------------------------------------------------------------------
create table colecoes (
  id         uuid primary key default gen_random_uuid(),
  loja_id    uuid not null references lojas(id) on delete cascade,
  nome       text not null,
  descricao  text,
  ativa      boolean not null default true,
  em_destaque boolean not null default false,
  ordem      int not null default 0
);

create table produtos_colecoes (
  produto_id  uuid not null references produtos(id) on delete cascade,
  colecao_id  uuid not null references colecoes(id) on delete cascade,
  primary key (produto_id, colecao_id)
);


-- ---------------------------------------------------------------------
-- 5) QUEM PODE MEXER (administradores)
-- master_admins: pode mexer em TUDO (você).
-- loja_admins:   pode mexer só nas lojas listadas para ele
--                (ex.: sua mãe em chocolate e aromas).
-- "user_id" é o id do usuário criado em Supabase > Authentication.
-- ---------------------------------------------------------------------
create table master_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table loja_admins (
  user_id  uuid not null references auth.users(id) on delete cascade,
  loja_id  uuid not null references lojas(id) on delete cascade,
  primary key (user_id, loja_id)
);


-- ---------------------------------------------------------------------
-- 6) FUNÇÃO AUXILIAR
-- Responde: "quem está logado agora pode editar esta loja?"
-- É usada nas regras de segurança logo abaixo.
-- ---------------------------------------------------------------------
create or replace function pode_editar(p_loja uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    exists (select 1 from master_admins where user_id = auth.uid())
    or exists (select 1 from loja_admins where user_id = auth.uid() and loja_id = p_loja)
$$;

create or replace function eh_master()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from master_admins where user_id = auth.uid())
$$;


-- ---------------------------------------------------------------------
-- 7) REGRAS DE SEGURANÇA (RLS)
-- Sem isso, qualquer visitante poderia apagar produtos.
-- Regra geral:
--   - qualquer visitante pode LER lojas, categorias, produtos ativos e mídias;
--   - só administradores podem CRIAR, ALTERAR e APAGAR, e só na sua loja.
-- ---------------------------------------------------------------------
alter table lojas          enable row level security;
alter table categorias     enable row level security;
alter table produtos       enable row level security;
alter table midias         enable row level security;
alter table master_admins  enable row level security;
alter table loja_admins    enable row level security;

-- Lojas: todos leem as ativas; só master cria/apaga; admin da loja edita a sua.
create policy "lojas_ler"      on lojas for select using (ativa or pode_editar(id));
create policy "lojas_criar"    on lojas for insert to authenticated with check (eh_master());
create policy "lojas_editar"   on lojas for update to authenticated using (pode_editar(id)) with check (pode_editar(id));
create policy "lojas_apagar"   on lojas for delete to authenticated using (eh_master());

-- Categorias
create policy "categorias_ler"    on categorias for select using (true);
create policy "categorias_gravar" on categorias for all to authenticated
  using (pode_editar(loja_id)) with check (pode_editar(loja_id));

-- Produtos: visitante só vê os ativos; admin vê todos da sua loja.
create policy "produtos_ler"    on produtos for select using (ativo or pode_editar(loja_id));
create policy "produtos_gravar" on produtos for all to authenticated
  using (pode_editar(loja_id)) with check (pode_editar(loja_id));

-- Mídias: herdam a permissão do produto a que pertencem.
create policy "midias_ler"    on midias for select using (true);
create policy "midias_gravar" on midias for all to authenticated
  using (pode_editar((select loja_id from produtos where id = produto_id)))
  with check (pode_editar((select loja_id from produtos where id = produto_id)));

-- Variações: herdam a permissão do produto.
alter table variacoes enable row level security;
create policy "variacoes_ler"    on variacoes for select using (true);
create policy "variacoes_gravar" on variacoes for all to authenticated
  using (pode_editar((select loja_id from produtos where id = produto_id)))
  with check (pode_editar((select loja_id from produtos where id = produto_id)));

-- Coleções: visitante vê as ativas; admin da loja gerencia as suas.
alter table colecoes          enable row level security;
alter table produtos_colecoes enable row level security;

create policy "colecoes_ler"    on colecoes for select using (ativa or pode_editar(loja_id));
create policy "colecoes_gravar" on colecoes for all to authenticated
  using (pode_editar(loja_id)) with check (pode_editar(loja_id));

create policy "prodcol_ler"    on produtos_colecoes for select using (true);
create policy "prodcol_gravar" on produtos_colecoes for all to authenticated
  using (pode_editar((select loja_id from produtos where id = produto_id)))
  with check (pode_editar((select loja_id from produtos where id = produto_id)));

-- Cada admin só enxerga as próprias linhas das tabelas de permissão.
create policy "master_ver_proprio" on master_admins for select to authenticated using (user_id = auth.uid());
create policy "lojaadm_ver_proprio" on loja_admins   for select to authenticated using (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 8) ARMAZENAMENTO DE FOTOS E VÍDEOS (Storage)
-- Cria uma "pasta" pública chamada "produtos". Qualquer um vê os arquivos;
-- só quem é administrador consegue enviar, trocar ou apagar.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

create policy "produtos_enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and (eh_master() or exists (select 1 from loja_admins where user_id = auth.uid())));
create policy "produtos_trocar" on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and (eh_master() or exists (select 1 from loja_admins where user_id = auth.uid())));
create policy "produtos_remover" on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and (eh_master() or exists (select 1 from loja_admins where user_id = auth.uid())));


-- ---------------------------------------------------------------------
-- 9) AS LOJAS INICIAIS
-- Por enquanto TODAS as lojas usam o número de teste do Matheus: troque pelos reais depois
-- (pode ser direto na tabela, em Table Editor > lojas).
-- ---------------------------------------------------------------------
insert into lojas (slug, nome, descricao, cor, whatsapp, ordem) values
  ('vitraforma', 'VitraForma',           'Impressão 3D sob medida',          '#3B1260', '5524992924519', 1),
  ('gallerie',   'Gallerie',             'Joias e acessórios',               '#0B7F7B', '5524992924519', 2),
  ('sonhos',     'Sonhos de Açúcar',     'Doces e salgados por encomenda',   '#B85446', '5524992924519', 3),
  ('aromas',     'Paixão por Aromas',    'Sabonetes, incensos e perfumaria', '#4F6B3A', '5524992924519', 4),
  ('chocolate',  'Paixão por Chocolate', 'Chocotones, bombons e kits',       '#6E1423', '5524992924519', 5);


-- ---------------------------------------------------------------------
-- Texto de exemplo do "Como funciona o pedido" da VitraForma (edite pelo painel depois).
update lojas set aviso_pedido =
  '🛠️ Produção em até 10 dias.' || chr(10) ||
  '📍 Entrega na cidade em até 3 dias após a produção.' || chr(10) ||
  '🚚 Outras cidades: frete combinado pelo WhatsApp.' || chr(10) ||
  '💬 O valor final é confirmado na conversa.'
where slug = 'vitraforma';


-- ---------------------------------------------------------------------
-- 10) COMO DAR PERMISSÃO A UMA PESSOA (rodar DEPOIS de criar o usuário
--     em Supabase > Authentication > Users > Add user)
-- Troque o id pelo "User UID" que aparece na lista de usuários.
-- Estas linhas estão comentadas (com --) de propósito: tire o -- só quando usar.
-- ---------------------------------------------------------------------

-- Você (acesso a tudo):
-- insert into master_admins (user_id) values ('COLE-AQUI-O-UID-DO-SEU-USUARIO');

-- Sua mãe (só chocolate e aromas):
-- insert into loja_admins (user_id, loja_id)
-- select 'COLE-AQUI-O-UID-DA-SUA-MAE', id from lojas where slug in ('chocolate', 'aromas');

-- Sócia (VitraForma, Gallerie e Sonhos):
-- insert into loja_admins (user_id, loja_id)
-- select 'COLE-AQUI-O-UID-DA-SOCIA', id from lojas where slug in ('vitraforma', 'gallerie', 'sonhos');
