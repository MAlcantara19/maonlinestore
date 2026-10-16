-- =====================================================================
-- ATUALIZAÇÃO 01 — APARÊNCIA PERSONALIZÁVEL DE CADA LOJA
-- Rodar UMA vez no SQL Editor. Acrescenta colunas na tabela "lojas"
-- sem apagar nada. (Guardar as atualizações numeradas ajuda a saber
-- o que já foi feito no banco.)
--
--   cor            = cor principal (já existia): banner, preços, botões
--   cor_secundaria = cor de apoio, mais clara: linha de atalhos, avisos
--   cor_fundo      = fundo da página da loja (vazio = padrão do site)
--   fonte          = estilo dos títulos: moderna | elegante | divertida
--
-- Depois, tudo isso vai ser editável pelo painel de cada loja.
-- =====================================================================
alter table lojas
  add column if not exists cor_secundaria text,
  add column if not exists cor_fundo      text,
  add column if not exists fonte          text not null default 'moderna'
    check (fonte in ('moderna', 'elegante', 'divertida'));

-- Valores iniciais (pode mudar à vontade no Table Editor)
update lojas set cor_secundaria = '#C9B3EE', cor_fundo = '#F6F3FA', fonte = 'moderna'   where slug = 'vitraforma';
update lojas set cor_secundaria = '#A9E4DF', cor_fundo = '#EDF8F7', fonte = 'elegante'  where slug = 'gallerie';
update lojas set cor_secundaria = '#F4C4B4', cor_fundo = '#FBEFE8', fonte = 'divertida' where slug = 'sonhos';
update lojas set cor_secundaria = '#CADDB4', cor_fundo = '#F1F5EC', fonte = 'elegante'  where slug = 'aromas';
update lojas set cor_secundaria = '#E2C886', cor_fundo = '#FAF1F0', fonte = 'elegante'  where slug = 'chocolate';
