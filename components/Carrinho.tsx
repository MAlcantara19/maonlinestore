"use client";
// =====================================================================
// CARRINHO — lista os itens, deixa mudar quantidade/remover, mostra o
// "Como funciona o pedido" e monta a mensagem para o WhatsApp da loja.
// =====================================================================
import Link from "next/link";
import { formatarPreco, salvarCarrinho, usarCarrinho, type ItemCarrinho } from "@/lib/carrinho";
import type { Loja } from "@/lib/tipos";

export default function Carrinho({ loja }: { loja: Loja }) {
  const itens = usarCarrinho(loja.slug);
  const cor = loja.cor ?? "#333";

  // Muda a quantidade de um item; se chegar a zero, remove.
  function mudarQuantidade(indice: number, delta: number) {
    const novos = [...itens];
    novos[indice] = { ...novos[indice], quantidade: novos[indice].quantidade + delta };
    salvarCarrinho(loja.slug, novos.filter((i) => i.quantidade > 0));
  }

  // Total só dos itens com preço; os "sob consulta" ficam de fora.
  const total = itens.reduce((s, i) => s + (i.preco ?? 0) * i.quantidade, 0);
  const temSobConsulta = itens.some((i) => i.preco == null);

  // Descrição de um item na mensagem: "2x Vaso espiral (15 cm, vermelho) — R$ 40,00 cada"
  const linha = (i: ItemCarrinho) => {
    const detalhes = [i.tamanho, i.cor].filter(Boolean).join(", ");
    const preco = i.preco != null ? ` — ${formatarPreco(i.preco)} cada` : " — sob consulta";
    const obs = i.observacao ? `\n   Obs.: ${i.observacao}` : "";
    return `• ${i.quantidade}x ${i.nome}${detalhes ? ` (${detalhes})` : ""}${preco}${obs}`;
  };

  function enviarWhatsApp() {
    const mensagem =
      `Olá! Gostaria de fazer um pedido na ${loja.nome} 😊\n\n` +
      itens.map(linha).join("\n") +
      `\n\nTotal estimado: ${formatarPreco(total)}${temSobConsulta ? " + itens sob consulta" : ""}` +
      `\n(valor final a confirmar)`;
    const numero = (loja.whatsapp ?? "").replace(/\D/g, ""); // só os números
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  if (itens.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="opacity-70">Seu carrinho está vazio.</p>
        <Link href={`/${loja.slug}`} className="mt-3 inline-block font-semibold underline">Ver produtos</Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Itens */}
      {itens.map((i, indice) => (
        <div key={`${i.chave}-${i.observacao}`} className="flex items-start justify-between gap-3 border-b py-3">
          <div>
            <b>{i.nome}</b>
            <p className="text-sm opacity-70">
              {[i.tamanho, i.cor].filter(Boolean).join(" · ")}
              {i.preco != null ? ` · ${formatarPreco(i.preco)}` : " · sob consulta"}
            </p>
            {i.observacao && <p className="text-xs opacity-70">Obs.: {i.observacao}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="h-8 w-8 rounded border" onClick={() => mudarQuantidade(indice, -1)}>−</button>
            <span>{i.quantidade}</span>
            <button className="h-8 w-8 rounded border" onClick={() => mudarQuantidade(indice, 1)}>+</button>
          </div>
        </div>
      ))}

      <p className="mt-4 text-lg font-bold">
        Total estimado: {formatarPreco(total)}
        {temSobConsulta && <span className="block text-sm font-normal opacity-70">+ itens sob consulta</span>}
      </p>

      {/* Como funciona o pedido: aparece logo antes de enviar */}
      {loja.aviso_pedido && (
        <div className="mt-4 whitespace-pre-line rounded-xl border p-4 text-sm" style={{ borderColor: cor }}>
          <b className="mb-1 block">Antes de enviar, fique atento:</b>
          {loja.aviso_pedido}
        </div>
      )}

      <button onClick={enviarWhatsApp} className="mt-4 w-full rounded-xl bg-[#1FA855] p-4 font-semibold text-white">
        Enviar pedido no WhatsApp
      </button>
      <button onClick={() => salvarCarrinho(loja.slug, [])} className="mt-3 w-full text-sm underline opacity-70">
        Esvaziar carrinho
      </button>
    </div>
  );
}