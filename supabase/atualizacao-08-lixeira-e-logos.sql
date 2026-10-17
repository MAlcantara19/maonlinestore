-- =====================================================================
-- ATUALIZAÇÃO 08 — LIXEIRA DE PRODUTOS + AJUSTE DAS LOGOS
-- Rodar UMA vez no SQL Editor. Não apaga nada.
-- =====================================================================

-- 1) LIXEIRA: "excluir" agora só marca a data. O produto some da loja,
--    fica 15 dias na aba Lixeira do painel (dá para restaurar) e depois
--    é apagado de vez.
alter table produtos add column if not exists excluido_em timestamptz;

-- Visitante só vê produto ativo E fora da lixeira (admin vê tudo da sua loja)
drop policy if exists "produtos_ler" on produtos;
create policy "produtos_ler" on produtos for select
  using ((ativo and excluido_em is null) or pode_editar(loja_id));

-- 2) AJUSTE DAS LOGOS (lojas e parceiros), para a logo redonda não cortar:
--    logo_ajuste = 'cobrir'  → preenche o círculo (pode cortar as bordas)
--                  'inteira' → mostra a imagem inteira dentro do círculo
--    logo_zoom   = 1 é o normal; 0.8 afasta (zoom out); 1.2 aproxima
--    logo_fundo  = cor que aparece atrás da logo (quando sobra espaço)
alter table lojas add column if not exists logo_ajuste text not null default 'cobrir' check (logo_ajuste in ('cobrir', 'inteira'));
alter table lojas add column if not exists logo_zoom numeric not null default 1;
alter table lojas add column if not exists logo_fundo text not null default '#ffffff';

alter table parceiros add column if not exists logo_ajuste text not null default 'cobrir' check (logo_ajuste in ('cobrir', 'inteira'));
alter table parceiros add column if not exists logo_zoom numeric not null default 1;
alter table parceiros add column if not exists logo_fundo text not null default '#ffffff';
