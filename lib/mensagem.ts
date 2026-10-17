// =====================================================================
// MENSAGEM DO WHATSAPP — monta o texto do pedido, bem organizado e com
// emojis. *texto* fica em negrito no WhatsApp.
// =====================================================================
import { formatarPreco } from "@/lib/formato";
import type { ItemCarrinho } from "@/lib/carrinho";

const NUMEROS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
const LINHA = "━━━━━━━━━━━━━━━";

export type DadosMensagem = {
  tipo: "pedido" | "orcamento";
  loja: string;
  codigo: string | null; // número do pedido (se foi salvo)
  nome: string;
  itens: ItemCarrinho[];
  subtotal: number;
  desconto: number;
  cupom: string | null;
  total: number;
  temSobConsulta: boolean;
  data: string; // AAAA-MM-DD (vazio = sem data)
  urgente: boolean;
  linkAcompanhar: string | null;
};

// "2026-12-20" -> "20/12/2026"
const dataBR = (iso: string) => iso.split("-").reverse().join("/");

export function montarMensagem(d: DadosMensagem): string {
  const titulo = d.tipo === "orcamento" ? "📝 *PEDIDO DE ORÇAMENTO*" : "🛒 *NOVO PEDIDO*";
  const partes: string[] = [];

  partes.push(`${titulo} · ${d.loja}`);
  if (d.codigo) partes.push(`🧾 Pedido *#${d.codigo}*`);
  if (d.nome.trim()) partes.push(`👤 ${d.nome.trim()}`);
  if (d.urgente) partes.push("⚡ *URGENTE*");
  if (d.data) partes.push(`📅 Para: *${dataBR(d.data)}*`);
  partes.push(LINHA, "📦 *Itens*", "");

  d.itens.forEach((i, n) => {
    const detalhes = [i.tamanho && `📏 ${i.tamanho}`, i.cor && `🎨 ${i.cor}`].filter(Boolean).join(" · ");
    const preco = i.preco != null
      ? `💰 ${formatarPreco(i.preco)} cada${i.quantidade > 1 ? ` · ${formatarPreco(i.preco * i.quantidade)}` : ""}`
      : "💬 sob consulta";
    partes.push(`${NUMEROS[n] ?? "▪️"} *${i.nome}* — ${i.quantidade}x`);
    if (detalhes) partes.push(`    ${detalhes}`);
    partes.push(`    ${preco}`);
    if (i.observacao) partes.push(`    ✏️ ${i.observacao}`);
    partes.push("");
  });

  partes.push(LINHA);
  if (d.desconto > 0) {
    partes.push(`💵 Subtotal: ${formatarPreco(d.subtotal)}`);
    partes.push(`🏷️ Cupom *${d.cupom}*: − ${formatarPreco(d.desconto)}`);
  }
  partes.push(`✅ *Total estimado: ${formatarPreco(d.total)}*${d.temSobConsulta ? " + itens sob consulta" : ""}`);
  partes.push("_(valor final confirmado na conversa)_");
  if (d.linkAcompanhar) partes.push("", `🔗 Acompanhe o pedido: ${d.linkAcompanhar}`);
  partes.push("", d.tipo === "orcamento" ? "Pode me passar o orçamento? 😊" : "Quero finalizar este pedido! 😊");

  return partes.join("\n");
}
