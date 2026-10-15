// =====================================================================
// TIPOS — o "formato" dos dados que vêm do banco.
// Cada tipo espelha uma tabela do arquivo supabase/banco-loja.sql.
// Se acrescentar uma coluna no banco, acrescente aqui também.
// =====================================================================

// Tabela "lojas": uma linha por loja (VitraForma, Gallerie...).
export type Loja = {
  id: string;
  slug: string; // pedaço do endereço: /vitraforma, /chocolate...
  nome: string;
  descricao: string | null; // frase curta mostrada embaixo do círculo
  cor: string | null; // cor da marca, ex.: #3B1260
  logo_url: string | null; // endereço da logo (vazio = mostra a inicial)
  whatsapp?: string | null; // número que recebe os pedidos desta loja
  aviso_pedido?: string | null; // texto "Como funciona o pedido"
};

// Tabela "categorias": parent_id vazio = categoria; preenchido = subcategoria.
export type Categoria = {
  id: string;
  nome: string;
  descricao: string | null;
  parent_id: string | null;
  ordem: number;
};

// Situação do produto ou da variação.
export type Disponibilidade = "pronta_entrega" | "sob_encomenda" | "esgotado";

// Tabela "variacoes": cada combinação de tamanho + cor com seu preço.
export type Variacao = {
  id: string;
  tamanho: string | null; // vazio = tamanho único
  cor: string | null; // vazio = todas as cores
  preco: number | null;
  disponibilidade: Disponibilidade | null; // vazio = vale a do produto
  prazo: string | null;
  ativa: boolean;
  ordem: number;
};

// Tabela "midias": fotos e vídeos de um produto.
export type Midia = {
  id: string;
  tipo: "foto" | "video";
  url: string;
  ordem: number;
};

// Tabela "produtos", já com as variações e mídias junto.
export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  restricoes: string | null;
  preco: number | null; // preço "a partir de" (vazio = sob consulta)
  disponibilidade: Disponibilidade;
  prazo: string | null;
  destaque: boolean;
  categoria_id: string | null;
  variacoes: Variacao[];
  midias: Midia[];
};

// Tabela "colecoes", com a lista de produtos que fazem parte dela.
export type Colecao = {
  id: string;
  nome: string;
  descricao: string | null;
  em_destaque: boolean;
  produtos_colecoes: { produto_id: string }[];
};