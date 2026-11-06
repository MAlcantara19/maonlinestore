// =====================================================================
// PAGAMENTO — formas, situação e lançamento automático no financeiro.
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";

export const FORMAS_PAGAMENTO = [["pix", "⚡ Pix"], ["dinheiro", "💵 Dinheiro"], ["credito", "💳 Crédito"], ["debito", "💳 Débito"], ["transferencia", "🏦 Transferência"], ["boleto", "📄 Boleto"], ["outro", "Outro"]] as const;
export const CANAIS = [["site", "🌐 Site"], ["whatsapp", "💬 WhatsApp"], ["instagram", "📸 Instagram"], ["presencial", "🤝 Presencial / feira"], ["outro", "Outro"]] as const;
export const rotuloDe = (lista: readonly (readonly [string, string])[], v?: string | null) => lista.find(([k]) => k === v)?.[1] ?? v ?? "—";

// Lança uma ENTRADA no financeiro ligada ao pedido
export async function lancarNoFinanceiro(o: {
  lojaId: string; pedidoId: string; codigo: string; cliente?: string | null; valor: number; categoria: "venda" | "sinal" | "restante";
  forma: string | null; itens?: { nome: string; quantidade: number; preco: number | null; produto_id?: string | null }[]; observacao?: string | null;
}) {
  if (!(o.valor > 0)) return null;
  return supabaseNavegador().from("movimentacoes").insert({
    loja_id: o.lojaId, tipo: "entrada", categoria: o.categoria, valor: Math.round(o.valor * 100) / 100, forma_pagamento: o.forma,
    pedido_id: o.pedidoId, descricao: `Pedido #${o.codigo}${o.cliente ? ` · ${o.cliente}` : ""}${o.categoria === "sinal" ? " (sinal)" : o.categoria === "restante" ? " (restante)" : ""}`,
    itens: o.categoria === "restante" ? [] : (o.itens ?? []).map((i) => ({ nome: i.nome, quantidade: i.quantidade, preco: Number(i.preco ?? 0), produto_id: i.produto_id ?? null })),
    observacao: o.observacao ?? null,
  });
}
