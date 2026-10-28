// =====================================================================
// ESTOQUE — null = a loja não controla (sempre disponível).
// =====================================================================
import type { Produto, Variacao } from "@/lib/tipos";

// Quanto tem do produto inteiro (soma das variações controladas, ou o do produto)
export function estoqueTotal(p: Produto): number | null {
  const ativas = p.variacoes.filter((v) => v.ativa);
  if (ativas.length && ativas.every((v) => v.estoque != null)) return ativas.reduce((s, v) => s + (v.estoque ?? 0), 0);
  if (ativas.some((v) => v.estoque != null)) return null; // controle misto: não dá para afirmar
  return p.estoque ?? null;
}

// Quanto tem da opção escolhida (variação) ou do produto
export const estoqueDa = (p: Produto, v?: Variacao | null): number | null => (v ? v.estoque ?? null : p.estoque ?? null);

export const semEstoque = (n: number | null) => n === 0;

// "Últimas 2 unidades!" (só quando está acabando)
export const textoUltimas = (n: number | null, limite = 3) =>
  n != null && n > 0 && n <= limite ? (n === 1 ? "Última unidade!" : `Últimas ${n} unidades!`) : "";
