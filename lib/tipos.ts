// =====================================================================
// TIPOS — o "formato" dos dados que vêm do banco.
// Cada tipo espelha uma tabela do arquivo supabase/banco-loja.sql.
// Se acrescentar uma coluna no banco, acrescente aqui também.
// =====================================================================

// Efeitos animados possíveis (lojas e coleções).
export type Efeito =
  | "nenhum" | "neve" | "estrelas" | "brilhos" | "coracoes" | "confete" | "bolhas"
  | "chocolate" | "doces" | "flores" | "presentes" | "logo" | "logo_voando" | "borboletas" | "baloes";

// Tabela "lojas": uma linha por loja (VitraForma, Gallerie...).
export type Loja = {
  id: string;
  slug: string; // pedaço do endereço: /vitraforma, /chocolate...
  nome: string;
  descricao: string | null; // frase curta mostrada embaixo do círculo
  cor: string | null; // cor da marca, ex.: #3B1260
  logo_url: string | null; // endereço da logo (vazio = mostra a inicial)
  logo_ajuste?: string; // "cobrir" ou "inteira"
  logo_zoom?: number; // 1 = normal
  logo_fundo?: string; // cor atrás da logo
  whatsapp?: string | null; // número que recebe os pedidos desta loja
  aviso_pedido?: string | null; // texto "Como funciona o pedido"
  cor_secundaria?: string | null; // cor de apoio, mais clara (linha de atalhos, avisos)
  cor_fundo?: string | null; // fundo da página da loja (vazio = padrão do site)
  fonte?: "moderna" | "elegante" | "divertida"; // estilo dos títulos
  instagram?: string | null; // usuário do Instagram, sem @ (aparece no rodapé)
  efeito?: Efeito; // efeito da loja o ano todo
  em_breve?: boolean; // true = aparece "Em breve" na página inicial
  sobre?: string | null; // texto da página "Sobre nós" da loja
  unidade_tamanho?: string; // unidade padrão dos tamanhos (cm, ml, g...)
  lancamento_em?: string | null; // inauguração (contagem regressiva das lojas em breve)
  efeito_personalizado_id?: string | null;
  ativa?: boolean; // false = a loja some do site
};

// Tabela "categorias": parent_id vazio = categoria; preenchido = subcategoria.
export type Categoria = {
  id: string;
  nome: string;
  descricao: string | null;
  parent_id: string | null;
  ordem: number;
  efeito_personalizado_id?: string | null;
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
  cor?: string | null; // cor da variação que a foto mostra (vazio = todas)
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
  selo: string | null; // fitinha no canto da foto (ex.: Novo)
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
  efeito?: Efeito; // animação enquanto em destaque
  efeito_personalizado_id?: string | null;
  produtos_colecoes: { produto_id: string }[];
};

// Tabela "parceiros": locais e pessoas indicados no site.
export type Parceiro = {
  id: string;
  slug: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  horarios: string | null;
  endereco: string | null;
  whatsapp: string | null;
  instagram: string | null;
  site: string | null;
  logo_url: string | null;
  logo_ajuste?: string;
  logo_zoom?: number;
  logo_fundo?: string;
  foto_url: string | null; // foto grande (fachada, local, pessoa)
  cor: string | null;
  efeito?: Efeito;
  destaque?: boolean; // aparece primeiro, com borda dourada
  selo?: string | null; // etiqueta: "Patrocinado", "Desconto"...
  ativo?: boolean;
  ordem?: number;
};

// Tabela "site_config": configuração da página inicial (uma linha só).
export type ConfigSite = {
  titulo: string;
  subtitulo: string | null;
  cor: string | null;
  cor_secundaria: string | null;
  banner_url: string | null;
  efeito: Efeito;
  parceiros_na_home: number;
};

// Tabela "efeitos_personalizados": efeitos feitos com imagens enviadas pela loja.
export type EfeitoPersonalizado = {
  id: string;
  nome: string;
  imagens: string[];
  movimento: "cair" | "subir" | "voar" | "piscar";
  quantidade: number;
  tamanho: number;
};
