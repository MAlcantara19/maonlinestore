"use client";
// Botão "⚖️ Comparar" (página do produto)
import { alternarComparar, usarComparar } from "@/lib/comparar";

export default function BotaoComparar({ slug, produtoId, className = "" }: { slug: string; produtoId: string; className?: string }) {
  const lista = usarComparar(slug);
  const ligado = lista.includes(produtoId);
  return (
    <button type="button" onClick={() => alternarComparar(slug, produtoId)} aria-pressed={ligado} className={className}>
      {ligado ? "⚖️ Comparando ✓" : "⚖️ Comparar"}
    </button>
  );
}
