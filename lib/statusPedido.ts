// =====================================================================
// ETAPAS DO PEDIDO — um lugar só (painel, acompanhamento e avisos).
// =====================================================================
export const ETAPAS_PEDIDO = [
  { valor: "recebido", rotulo: "Recebido", icone: "📥", cor: "#64748b", aviso: "recebemos seu pedido e já vamos conferir tudo" },
  { valor: "aceito", rotulo: "Aceito", icone: "👍", cor: "#0891b2", aviso: "seu pedido foi *aceito*! 🎉" },
  { valor: "em_producao", rotulo: "Em produção", icone: "🛠️", cor: "#d97706", aviso: "seu pedido está *em produção* — já estamos fazendo! 🛠️" },
  { valor: "pronto", rotulo: "Pronto", icone: "🎁", cor: "#2563eb", aviso: "seu pedido está *pronto*! 🎁" },
  { valor: "enviado", rotulo: "Enviado", icone: "🚚", cor: "#7c3aed", aviso: "seu pedido foi *enviado / saiu para entrega*! 🚚" },
  { valor: "entregue", rotulo: "Entregue", icone: "✅", cor: "#16a34a", aviso: "seu pedido foi *entregue*. Obrigado pela confiança! 💜" },
  { valor: "cancelado", rotulo: "Cancelado", icone: "❌", cor: "#dc2626", aviso: "seu pedido foi *cancelado*. Qualquer dúvida, é só chamar." },
] as const;

export const etapaDo = (status: string) => ETAPAS_PEDIDO.find((e) => e.valor === status);

// Mensagem pronta para o cliente
export function mensagemDeAndamento(p: { codigo: string; status: string; cliente_nome?: string | null; nota_loja?: string | null; previsao_entrega?: string | null }, origem: string, loja?: string) {
  const etapa = etapaDo(p.status);
  return `Oi${p.cliente_nome ? `, ${p.cliente_nome}` : ""}! 😊` +
    `\n${etapa?.icone ?? "📦"} Pedido *#${p.codigo}*${loja ? ` (${loja})` : ""}: ${etapa?.aviso ?? p.status}` +
    (p.previsao_entrega && !["entregue", "cancelado"].includes(p.status) ? `\n📅 Previsão de entrega: ${p.previsao_entrega.split("-").reverse().join("/")}` : "") +
    (p.nota_loja ? `\n💬 ${p.nota_loja}` : "") +
    `\n🔗 Acompanhe: ${origem}/pedido/${p.codigo}`;
}
