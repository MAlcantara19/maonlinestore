"use client";
// =====================================================================
// BARRA "VER CARRINHO" — fica presa no rodapé da tela quando há itens.
// Aparece na página da loja e na página do produto.
// =====================================================================
import Link from "next/link";
import { usarCarrinho } from "@/lib/carrinho";

export default function BotaoCarrinho({ slug, cor }: { slug: string; cor: string }) {
  const itens = usarCarrinho(slug);
  const total = itens.reduce((soma, i) => soma + i.quantidade, 0);
  if (total === 0) return null; // carrinho vazio: não mostra nada

  return (
    <div className="fixed inset-x-0 bottom-0 p-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
      <Link
        href={`/${slug}/carrinho`}
        className="clicavel mx-auto block max-w-3xl rounded-xl p-4 text-center font-semibold text-white shadow-lg"
        style={{ background: cor }}
      >
        🛒 Ver carrinho ({total} {total === 1 ? "item" : "itens"})
      </Link>
    </div>
  );
}