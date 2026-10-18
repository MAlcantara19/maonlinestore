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

// CNPJ/CPF com pontinhos: "12345678000190" → "12.345.678/0001-90"
export function documentoBonito(doc?: string | null): string {
  const d = (doc ?? "").replace(/\D/g, "");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return doc ?? "";
}

// Confere os dígitos verificadores do CNPJ (14) ou CPF (11)
export function documentoValido(doc?: string | null): boolean {
  const d = (doc ?? "").replace(/\D/g, "");
  if (!/^(\d{11}|\d{14})$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const digito = (base: string, pesos: number[]) => {
    const soma = base.split("").reduce((s, n, i) => s + Number(n) * pesos[i], 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  if (d.length === 11) {
    const p1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    const d1 = digito(d.slice(0, 9), p1);
    const d2 = digito(d.slice(0, 9) + d1, [11, ...p1]);
    return d.endsWith(`${d1}${d2}`);
  }
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = digito(d.slice(0, 12), p1);
  const d2 = digito(d.slice(0, 12) + d1, [6, ...p1]);
  return d.endsWith(`${d1}${d2}`);
}
