-- =====================================================================
-- PRODUTOS DE EXEMPLO DA VITRAFORMA (fictícios, só para testar a página)
-- Rodar UMA vez no SQL Editor. Depois dá para apagar tudo pelo Table Editor.
-- Cria: categorias e subcategorias, 2 coleções e 6 produtos com variações.
-- =====================================================================
do $$
declare
  v_loja uuid;
  c_brinq uuid; c_tab uuid; c_beb uuid; c_dec uuid; c_rel uuid;
  col_natal uuid; col_santos uuid;
  p uuid;
begin
  select id into v_loja from lojas where slug = 'vitraforma';

  -- Categorias (parent_id vazio) e subcategorias (parent_id = categoria "mãe")
  insert into categorias (loja_id, nome, descricao, ordem) values (v_loja, 'Brinquedos', 'Diversão impressa em 3D 🧸', 1) returning id into c_brinq;
  insert into categorias (loja_id, parent_id, nome, descricao, ordem) values (v_loja, c_brinq, 'Tabuleiro', 'Peças e jogos de tabuleiro 🎲', 1) returning id into c_tab;
  insert into categorias (loja_id, parent_id, nome, descricao, ordem) values (v_loja, c_brinq, 'Bebês', 'Para os pequenos 👶', 2) returning id into c_beb;
  insert into categorias (loja_id, nome, descricao, ordem) values (v_loja, 'Decoração', 'Para deixar a casa com a sua cara 🏡', 2) returning id into c_dec;
  insert into categorias (loja_id, nome, descricao, ordem) values (v_loja, 'Religiosos', 'Peças de fé 🙏', 3) returning id into c_rel;

  -- Coleções: Natal fica em destaque; Santos fica visível, mas sem destaque
  insert into colecoes (loja_id, nome, descricao, em_destaque, ordem) values (v_loja, 'Natal', 'Presentes e enfeites para o Natal 🎄', true, 1) returning id into col_natal;
  insert into colecoes (loja_id, nome, descricao, em_destaque, ordem) values (v_loja, 'Santos', 'Coleção católica ✝️', false, 2) returning id into col_santos;

  -- Produto com várias combinações de tamanho e cor
  insert into produtos (loja_id, categoria_id, nome, descricao, preco, destaque)
  values (v_loja, c_dec, 'Vaso espiral', 'Vaso moderno em espiral 🌀 Perfeito para suculentas 🌵', 25, true) returning id into p;
  insert into variacoes (produto_id, tamanho, cor, preco, disponibilidade, ordem) values
    (p, '10 cm', 'azul',     25,  'pronta_entrega', 1),
    (p, '15 cm', 'vermelho', 40,  'pronta_entrega', 2),
    (p, '30 cm', null,       100, 'sob_encomenda',  3);

  insert into produtos (loja_id, categoria_id, nome, descricao, preco)
  values (v_loja, c_tab, 'Dado de RPG', 'Dado de 20 lados para suas aventuras 🐉', 8);

  insert into produtos (loja_id, categoria_id, nome, descricao, preco)
  values (v_loja, c_beb, 'Chocalho', 'Chocalho leve e colorido 🌈', 22);

  insert into produtos (loja_id, categoria_id, nome, descricao, preco, destaque)
  values (v_loja, c_rel, 'Nossa Senhora para monitor', 'Delicada, em branco pérola 🤍', 8, true) returning id into p;
  insert into variacoes (produto_id, tamanho, cor, preco, disponibilidade, ordem) values
    (p, '8 cm',  'branco pérola', 8,  'pronta_entrega', 1),
    (p, '12 cm', 'branco pérola', 15, 'pronta_entrega', 2);
  insert into produtos_colecoes (produto_id, colecao_id) values (p, col_santos);

  insert into produtos (loja_id, categoria_id, nome, descricao, preco)
  values (v_loja, c_dec, 'Árvore de Natal articulada', 'Monta e desmonta em segundos 🎄✨', 35) returning id into p;
  insert into produtos_colecoes (produto_id, colecao_id) values (p, col_natal);

  insert into produtos (loja_id, categoria_id, nome, descricao, preco, disponibilidade, prazo)
  values (v_loja, c_dec, 'Peça personalizada', 'Mande sua ideia que a gente imprime 💜', null, 'sob_encomenda', '10 dias');
end $$;