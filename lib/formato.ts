// =====================================================================
// FUNÇÕES DE FORMATO — usadas em várias telas (servidor e navegador).
// =====================================================================
import type { Produto } from "@/lib/tipos";

// 25 -> "R$ 25,00"
export function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Menor preço do produto: entre as variações ativas; se não tiver, o preço do produto.
// Devolve null quando é "sob consulta".
export function precoMinimo(produto: Produto): number | null {
  const precos = produto.variacoes.filter((v) => v.ativa && v.preco != null).map((v) => Number(v.preco));
  if (precos.length) return Math.min(...precos);
  return produto.preco != null ? Number(produto.preco) : null;
}

// Código do banco -> texto que o cliente vê.
export function textoDisponibilidade(d: Produto["disponibilidade"]) {
  if (d === "sob_encomenda") return "Sob encomenda";
  if (d === "esgotado") return "Esgotado";
  return "Pronta entrega";
}
