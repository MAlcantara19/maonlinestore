// =====================================================================
// 🖨️ IMPRIMIR O CARTÃO DO PEDIDO — abre uma folha com o cartãozinho
// (10 × 15 cm) com a mensagem que o cliente escreveu no carrinho.
// Na janela de impressão: escolha o papel e desmarque "Cabeçalhos e
// rodapés" para não sair data/endereço.
// =====================================================================
const escapar = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Acha a mensagem nos itens do pedido ('Cartão: "Feliz Natal!"')
export function mensagemDoCartao(itens: { observacao?: string | null }[] | null | undefined): string | null {
  for (const i of itens ?? []) {
    const m = (i.observacao ?? "").match(/Cart[ãa]o: "([\s\S]*?)"/);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

export function imprimirCartao(mensagem: string, loja: { nome: string; cor: string }) {
  const w = window.open("", "_blank", "width=720,height=560");
  if (!w) return alert("Libere as janelas (pop-ups) deste site para imprimir o cartão.");
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cartão</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap">
<style>
  @page { size: 150mm 100mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .cartao { box-sizing: border-box; width: 150mm; height: 100mm; padding: 9mm 11mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; }
  .borda { position: absolute; inset: 5mm; border: 1.2mm solid ${loja.cor}; border-radius: 6mm; }
  .borda::after { content: ""; position: absolute; inset: 1.6mm; border: 0.4mm solid ${loja.cor}66; border-radius: 4.5mm; }
  .msg { font-family: 'Dancing Script', cursive; font-size: 7.4mm; line-height: 1.35; color: #2b2b2b; white-space: pre-line; max-width: 118mm; position: relative; }
  .loja { position: absolute; bottom: 8mm; font: 600 2.6mm system-ui, sans-serif; letter-spacing: .6mm; text-transform: uppercase; color: ${loja.cor}; opacity: .8; }
  .dica { font: 13px system-ui, sans-serif; color: #666; text-align: center; margin: 10px; }
  @media print { .dica { display: none; } }
</style></head><body>
<p class="dica">🖨️ Na impressão: papel 15×10 cm (ou A6/foto) e desmarque “Cabeçalhos e rodapés”.</p>
<div class="cartao"><div class="borda"></div><div class="msg">${escapar(mensagem)}</div><div class="loja">💌 ${escapar(loja.nome)}</div></div>
</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 700);
}
