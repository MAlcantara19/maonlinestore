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
};