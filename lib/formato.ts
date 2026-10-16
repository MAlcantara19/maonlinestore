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

// Limpa o Instagram digitado: aceita "@loja", "loja" ou o link inteiro
// ("https://instagram.com/loja/") e devolve só "loja".
export function usuarioInstagram(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpo = valor.trim().replace(/\/+$/, "").split("/").pop()?.replace("@", "").split("?")[0] ?? "";
  return limpo || null;
}

// "5524992924519" -> "(24) 99292-4519"
export function telefoneBonito(numero: string): string {
  const d = numero.replace(/\D/g, "").replace(/^55/, "");
  if (d.length < 10) return numero;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  return `(${ddd}) ${resto.slice(0, resto.length - 4)}-${resto.slice(-4)}`;
}
