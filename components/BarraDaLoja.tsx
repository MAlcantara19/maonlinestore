"use client";
// =====================================================================
// AVISOS FLUTUANTES DA LOJA
//   🛒 "Você deixou X itens no carrinho" (quando volta depois de um tempo)
//   ⚖️ "Comparar (2) →" quando há produtos marcados para comparar
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { usarComparar } from "@/lib/comparar";

export default function BarraDaLoja({ slug, cor }: { slug: string; cor: string }) {
  const comparar = usarComparar(slug);
  const [esquecidos, setEsquecidos] = useState(0);

  useEffect(() => {
    try {
      const itens = JSON.parse(localStorage.getItem(`carrinho:${slug}`) ?? "[]") as unknown[];
      const ultima = Number(localStorage.getItem(`ultima-visita:${slug}`) ?? 0);
      const jaAvisou = sessionStorage.getItem(`lembrete:${slug}`);
      if (itens.length && ultima && Date.now() - ultima > 30 * 60 * 1000 && !jaAvisou) {
        setEsquecidos(itens.length);
        sessionStorage.setItem(`lembrete:${slug}`, "1");
      }
      localStorage.setItem(`ultima-visita:${slug}`, String(Date.now()));
    } catch {}
  }, [slug]);

  return (
    <>
      {esquecidos > 0 && (
        <div className="balao fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white p-3 text-sm text-stone-900 shadow-2xl">
          <span className="text-2xl">🛒</span>
          <span className="flex-1">Você deixou <b>{esquecidos} {esquecidos === 1 ? "item" : "itens"}</b> no carrinho. Quer finalizar?</span>
          <button type="button" onClick={() => { window.dispatchEvent(new Event("abrir-carrinho")); setEsquecidos(0); }}
            className="rounded-full px-3 py-1.5 font-semibold text-white" style={{ background: cor }}>Ver</button>
          <button type="button" onClick={() => setEsquecidos(0)} aria-label="Fechar" className="opacity-50">✕</button>
        </div>
      )}
      {comparar.length > 0 && (
        <Link href={`/${slug}/comparar`} className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-xl" style={{ background: cor }}>
          ⚖️ Comparar ({comparar.length}) →
        </Link>
      )}
    </>
  );
}
