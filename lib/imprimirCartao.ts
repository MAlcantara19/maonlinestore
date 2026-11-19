// =====================================================================
// 🖨️ IMPRIMIR O CARTÃO DO PEDIDO — abre uma folha com o cartãozinho
// (10 × 15 cm) com a mensagem que o cliente escreveu no carrinho.
// 🎟️ Com cupom: sai junto um segundo cartão "10% na próxima compra"
// (o cupom é escolhido no topo da tela de Pedidos).
// Na janela de impressão: escolha o papel e desmarque "Cabeçalhos e
// rodapés" para não sair data/endereço.
// =====================================================================
const escapar = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export type CupomImpresso = { codigo: string; tipo: "porcentagem" | "valor"; valor: number; minimo?: number | null; validade?: string | null };

// "10% OFF" ou "R$ 15 OFF"
export function textoDoCupom(c: CupomImpresso) {
  return c.tipo === "porcentagem" ? `${Number(c.valor)}% OFF` : `${Number(c.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} OFF`;
}

// Acha a mensagem nos itens do pedido ('Cartão: "Feliz Natal!"')
export function mensagemDoCartao(itens: { observacao?: string | null }[] | null | undefined): string | null {
  for (const i of itens ?? []) {
    const m = (i.observacao ?? "").match(/Cart[ãa]o: "([\s\S]*?)"/);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

export function imprimirCartao(mensagem: string | null, loja: { nome: string; cor: string; link?: string }, cupom?: CupomImpresso | null) {
  if (!mensagem && !cupom) return;
  const w = window.open("", "_blank", "width=720,height=560");
  if (!w) return alert("Libere as janelas (pop-ups) deste site para imprimir o cartão.");
  const validade = cupom?.validade ? `Válido até ${new Date(`${cupom.validade}T12:00:00`).toLocaleDateString("pt-BR")}` : "";
  const minimo = cupom?.minimo ? `Compras a partir de ${Number(cupom.minimo).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "";
  const regras = [minimo, validade].filter(Boolean).join(" · ");
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cartão</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap">
<style>
  @page { size: 150mm 100mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .cartao { box-sizing: border-box; width: 150mm; height: 100mm; padding: 9mm 11mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; page-break-after: always; break-after: page; }
  .cartao:last-child { page-break-after: auto; break-after: auto; }
  .borda { position: absolute; inset: 5mm; border: 1.2mm solid ${loja.cor}; border-radius: 6mm; }
  .borda::after { content: ""; position: absolute; inset: 1.6mm; border: 0.4mm solid ${loja.cor}66; border-radius: 4.5mm; }
  .msg { font-family: 'Dancing Script', cursive; font-size: 7.4mm; line-height: 1.35; color: #2b2b2b; white-space: pre-line; max-width: 118mm; position: relative; }
  .loja { position: absolute; bottom: 8mm; font: 600 2.6mm system-ui, sans-serif; letter-spacing: .6mm; text-transform: uppercase; color: ${loja.cor}; opacity: .8; }
  .cupom .borda { border-style: dashed; }
  .cupom .topo { font: 700 3.6mm system-ui, sans-serif; color: #444; position: relative; }
  .cupom .valor { font: 900 17mm/1 system-ui, sans-serif; color: ${loja.cor}; margin: 3mm 0 2mm; position: relative; }
  .cupom .codigo { font: 800 5.4mm ui-monospace, monospace; letter-spacing: 1mm; border: 0.5mm dashed ${loja.cor}; border-radius: 2mm; padding: 1.5mm 5mm; position: relative; }
  .cupom .regras { font: 500 2.8mm system-ui, sans-serif; color: #666; margin-top: 3mm; position: relative; }
  .dica { font: 13px system-ui, sans-serif; color: #666; text-align: center; margin: 10px; }
  @media print { .dica { display: none; } }
</style></head><body>
<p class="dica">🖨️ Na impressão: papel 15×10 cm (ou A6/foto) e desmarque “Cabeçalhos e rodapés”.${mensagem && cupom ? " Saem 2 cartões: a mensagem e o cupom." : ""}</p>
${mensagem ? `<div class="cartao"><div class="borda"></div><div class="msg">${escapar(mensagem)}</div><div class="loja">💌 ${escapar(loja.nome)}</div></div>` : ""}
${cupom ? `<div class="cartao cupom"><div class="borda"></div>
  <div class="topo">🎁 Um presente para a sua próxima compra</div>
  <div class="valor">${escapar(textoDoCupom(cupom))}</div>
  <div class="codigo">${escapar(cupom.codigo)}</div>
  <div class="regras">Use o cupom ao finalizar o pedido${loja.link ? ` em ${escapar(loja.link.replace(/^https?:\/\//, ""))}` : ""}${regras ? `<br>${escapar(regras)}` : ""}</div>
  <div class="loja">💜 ${escapar(loja.nome)} · obrigado pela compra!</div></div>` : ""}
</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 700);
}
