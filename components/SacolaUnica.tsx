"use client";
// =====================================================================
// SACOLA ÚNICA — mostra o carrinho de cada loja separado, com o botão
// "Finalizar com a loja X" (cada pedido vai para o WhatsApp certo).
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { salvarCarrinho } from "@/lib/carrinho";
import { usarTodosOsCarrinhos } from "@/lib/sacola";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco } from "@/lib/formato";

type LojaInfo = { slug: string; nome: string; cor: string | null; logo_url: string | null };

export default function SacolaUnica() {
  const carrinhos = usarTodosOsCarrinhos();
  const [lojas, setLojas] = useState<Record<string, LojaInfo>>({});

  useEffect(() => {
    const slugs = (carrinhos ?? []).map((c) => c.slug).filter((s) => !lojas[s]);
    if (!slugs.length) return;
    supabaseNavegador().from("lojas").select("slug, nome, cor, logo_url").in("slug", slugs)
      .then(({ data }: { data: LojaInfo[] | null }) => setLojas((atual) => ({ ...atual, ...Object.fromEntries((data ?? []).map((l) => [l.slug, l])) })));
  }, [carrinhos, lojas]);

  if (!carrinhos) return <p className="mt-6 opacity-60">Carregando...</p>;
  if (!carrinhos.length) {
    return (
      <div className="mt-10 text-center">
        <p className="text-5xl">🛍️</p>
        <p className="mt-2 opacity-70">Sua sacola está vazia.</p>
        <Link href="/" className="mt-3 inline-block font-semibold underline">Ver as lojas</Link>
      </div>
    );
  }

  const totalGeral = carrinhos.reduce((s, c) => s + c.itens.reduce((t, i) => t + (i.preco ?? 0) * i.quantidade, 0), 0);

  return (
    <div className="mt-4 space-y-4">
      <p className="rounded-xl bg-black/5 p-3 text-sm">
        💡 Cada loja recebe o pedido no <b>WhatsApp dela</b>. Finalize uma de cada vez: os itens das outras continuam guardados aqui.
      </p>
      {carrinhos.map(({ slug, itens }, n) => {
        const l = lojas[slug];
        const cor = l?.cor ?? "#333";
        const subtotal = itens.reduce((t, i) => t + (i.preco ?? 0) * i.quantidade, 0);
        return (
          <section key={slug} className="animar-entrada overflow-hidden rounded-2xl border bg-white/80 shadow-sm" style={{ animationDelay: `${n * 80}ms` }}>
            <header className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: cor }}>
              <span className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white">{l?.logo_url && <img src={l.logo_url} alt="" className="h-full w-full object-cover" />}</span>
              <b className="flex-1">{l?.nome ?? slug}</b>
              <span className="text-sm opacity-90">{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
            </header>
            <ul className="divide-y px-4">
              {itens.map((i) => (
                <li key={`${i.chave}${i.observacao}`} className="flex items-center gap-2 py-2 text-sm">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/5">{i.foto ? <img src={i.foto} alt="" className="h-full w-full object-cover" /> : null}</span>
                  <span className="flex-1">{i.quantidade}x <b>{i.nome}</b> <span className="opacity-60">{[i.opcao, i.tamanho, i.cor].filter(Boolean).join(" · ")}</span></span>
                  <span>{i.preco != null ? formatarPreco(i.preco * i.quantidade) : "Consulte"}</span>
                  <button type="button" aria-label="Tirar da sacola" className="px-1 text-red-600"
                    onClick={() => salvarCarrinho(slug, itens.filter((x) => !(x.chave === i.chave && x.observacao === i.observacao)))}>✕</button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
              <span className="text-sm">Subtotal: <b>{formatarPreco(subtotal)}</b></span>
              <Link href={`/${slug}/carrinho`} className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow" style={{ background: cor }}>
                Finalizar com {l?.nome ?? "a loja"} →
              </Link>
            </div>
          </section>
        );
      })}
      <p className="text-right text-lg">Total estimado de todas as lojas: <b>{formatarPreco(totalGeral)}</b></p>
    </div>
  );
}
