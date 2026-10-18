"use client";
// =====================================================================
// Botão flutuante da SACOLA ÚNICA (página inicial e parceiros):
// aparece quando há itens em qualquer loja, com o total de itens.
// =====================================================================
import Link from "next/link";
import { usarTodosOsCarrinhos } from "@/lib/sacola";

export default function BotaoSacola() {
  const carrinhos = usarTodosOsCarrinhos();
  const total = (carrinhos ?? []).reduce((s, c) => s + c.itens.reduce((t, i) => t + i.quantidade, 0), 0);
  if (!total) return null;
  return (
    <Link href="/sacola" aria-label={`Minha sacola: ${total} itens`}
      className="balao fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 font-semibold text-white shadow-2xl"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      🛍️ Minha sacola <span className="rounded-full bg-white px-2 text-sm text-stone-900">{total}</span>
    </Link>
  );
}
