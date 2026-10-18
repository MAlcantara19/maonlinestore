-- =====================================================================
-- ATUALIZAÇÃO 18 — BANNER DAS LOJAS, DADOS LEGAIS (CNPJ) E SEGURANÇA
-- Rodar UMA vez no SQL Editor (depois da 17). Não apaga nada.
-- =====================================================================

-- 1) BANNER DA LOJA: imagem no topo da loja + quanto "escurecer" com a cor
alter table lojas add column if not exists banner_url text;
alter table lojas add column if not exists banner_escurecer int not null default 45 check (banner_escurecer between 0 and 90);

-- 2) DADOS LEGAIS DE CADA LOJA
--    A lei do comércio eletrônico (Decreto 7.962/2013) pede que quem vende
--    pela internet mostre nome/razão social, CNPJ ou CPF, endereço e contato.
alter table lojas add column if not exists razao_social text;
alter table lojas add column if not exists documento text;          -- CNPJ ou CPF (só números)
alter table lojas add column if not exists endereco text;
alter table lojas add column if not exists email_contato text;
alter table lojas add column if not exists responsavel text;        -- nome do(a) responsável
alter table lojas add column if not exists termos_aceitos_em timestamptz;
alter table lojas add column if not exists termos_aceitos_por text; -- e-mail de quem aceitou

-- 3) LIMITES NO ARMAZENAMENTO DE FOTOS: só imagens e vídeos, até 20 MB
update storage.buckets
   set file_size_limit = 20971520,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime']
 where id = 'produtos';

-- 4) CONFERÊNCIA: lista tabelas SEM proteção (RLS). O resultado deve vir VAZIO.
--    Se aparecer alguma, me mande o nome.
select c.relname as tabela_sem_protecao
  from pg_class c
 where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity;
