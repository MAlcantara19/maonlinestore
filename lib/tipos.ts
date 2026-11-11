// =====================================================================
// TIPOS — o "formato" dos dados que vêm do banco.
// Cada tipo espelha uma tabela do arquivo supabase/banco-loja.sql.
// Se acrescentar uma coluna no banco, acrescente aqui também.
// =====================================================================

// Efeitos animados possíveis (lojas e coleções).
export type Efeito =
  | "nenhum" | "neve" | "estrelas" | "brilhos" | "coracoes" | "confete" | "bolhas"
  | "chocolate" | "doces" | "flores" | "presentes" | "logo" | "logo_voando" | "borboletas" | "baloes"
  | "natal" | "pascoa" | "halloween" | "namorados" | "maes" | "folhas" | "chuva" | "nuvens" | "fogos" | "joias" | "notas" | "patinhas" | "futebol" | "brasil" | "foguetes" | "dinheiro" | "sorvete" | "cafe";

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
  fonte?: string; // estilo dos títulos (veja lib/fontes.ts)
  instagram?: string | null; // usuário do Instagram, sem @ (aparece no rodapé)
  efeito?: Efeito; // efeito da loja o ano todo
  em_breve?: boolean; // true = aparece "Em breve" na página inicial
  sobre?: string | null; // texto da página "Sobre nós" da loja
  unidade_tamanho?: string; // unidade padrão dos tamanhos (cm, ml, g...)
  prazo_padrao?: string | null; // prazo que já vem no cadastro de produto
  banner_url?: string | null; // imagem do topo da loja
  fretes?: { nome: string; valor: number }[]; // opções de entrega
  frete_cep?: import("@/lib/frete").RegrasFrete | null; // frete aproximado por CEP
  cep_origem?: string | null; // CEP de onde a loja envia (frete exato)
  desconto_pix?: number | null; // % no Pix / à vista
  boas_vindas_pct?: number | null; // % na primeira compra (pelo WhatsApp)
  fidelidade_a_cada?: number | null; // a cada R$ X gastos...
  fidelidade_premio_pct?: number | null; // ...ganha X% (cupom)
  aniversario_pct?: number | null; // 🎂 cupom no mês do aniversário
  indicacao_pct?: number | null; // 🤝 prêmio por indicar amigo
  comissao_pct?: number | null; // repasse para a MA (%)
  slides?: Slide[]; // banner rotativo de promoções
  presente?: { ativo: boolean; preco: number; descricao?: string | null; foto?: string | null } | null; // 🎁 embalagem de presente
  pacote_padrao?: { peso_g?: number; altura_cm?: number; largura_cm?: number; comprimento_cm?: number } | null; // 📦 caixa padrão (frete)
  banner_escurecer?: number; // 0 a 90: quanto a cor da loja cobre a imagem
  razao_social?: string | null; // dados legais (aparecem no rodapé)
  documento?: string | null; // CNPJ ou CPF
  endereco?: string | null;
  email_contato?: string | null;
  responsavel?: string | null;
  termos_aceitos_em?: string | null;
  termos_aceitos_por?: string | null;
  fundo_tipo?: TipoFundo; // fundo da página da loja
  fundo_url?: string | null;
  fundo_opacidade?: number;
  fundo_animacao?: AnimacaoFundo;
  fundo_cor?: string | null; // cor entre as logos do mosaico
  logo_borda_cor?: string | null; // borda da logo redonda
  logo_borda?: number; // grossura da borda (px)
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
  tipo?: "unidade" | "kit"; // venda por unidade ou kit
  nome?: string | null; // opção/modelo (ex.: "Clipes de coração")
  descricao?: string | null; // texto da opção (ex.: "3 de cada modelo")
  estoque?: number | null; // quantidade desta opção (vazio = não controla)
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
  produtos_categorias?: { categoria_id: string }[]; // todas as categorias do produto
  ordem?: number; // ordem manual na loja
  promocao_pct?: number | null; // % de desconto
  promocao_ate?: string | null; // fim da promoção
  giro_360?: boolean; // fotos formam um giro 360°
  estoque?: number | null; // quantidade (vazio = não controla)
  previa_cor?: boolean; // mostra a prévia da cor na foto
  personalizacao?: Personalizacao | null; // ✍️ texto na foto (prévia)
  tempo_min?: number | null; // minutos de impressão por unidade
  meta_mensal?: number | null; // 🎯 meta de vendas (unidades/mês)
  custo?: number | null; // custo de produção
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
  fonte?: string | null; // fonte própria do título da coleção
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
  efeito_painel?: Efeito; // efeito animado do painel de administração
  logo_url?: string | null; // logo da MA Online Store (topo da página inicial)
  fundo_tipo?: TipoFundo;
  fundo_url?: string | null;
  fundo_opacidade?: number;
  fundo_animacao?: AnimacaoFundo;
  fundo_cor?: string | null; // cor entre as logos do mosaico
  logo_borda_cor?: string | null; // borda da logo redonda
  logo_borda?: number; // grossura da borda (px)
  parceiros_titulo?: string | null;
  parceiros_subtitulo?: string | null;
  parceiros_fundo_tipo?: TipoFundo;
  parceiros_fundo_url?: string | null;
  parceiros_fundo_opacidade?: number;
  parceiros_fundo_animacao?: AnimacaoFundo;
  parceiros_efeito?: Efeito;
  parceiros_fundo_cor?: string | null;
  especial_ativo?: boolean; // faixa especial (Natal, Páscoa...)
  especial_titulo?: string | null;
  especial_termo?: string | null;
  quem_somos_titulo?: string | null; // página Quem somos
  quem_somos_texto?: string | null;
  quem_somos_foto?: string | null;
};

export type AnimacaoFundo = "nenhuma" | "respirar" | "zoom_lento" | "deslizar";

// Fundo da página inteira: nada, foto, logo repetida ou vídeo em looping
export type TipoFundo = "nenhum" | "imagem" | "mosaico" | "video";

// Tabela "efeitos_personalizados": efeitos feitos com imagens enviadas pela loja.
export type EfeitoPersonalizado = {
  id: string;
  nome: string;
  imagens: string[];
  movimento: "cair" | "subir" | "voar" | "piscar";
  quantidade: number;
  tamanho: number;
};

// ✍️ Personalização com prévia: onde e como o texto aparece na foto
export type Personalizacao = { rotulo: string; x: number; y: number; cor: string; tamanho: number; fonte?: string | null; max: number; contorno?: boolean };

// 🖼️ Slide do banner rotativo da loja
export type Slide = { imagem: string | null; titulo: string; texto?: string | null; link?: string | null };
