"use client";
// =====================================================================
// 🧭 ATALHOS RÁPIDOS NO TOPO DA LOJA — para quem não tem muita prática:
//   - Botões grandes: Novidades, Destaques, Favoritos, Ajuda no WhatsApp
//   - "Primeira vez aqui?" → como comprar em 3 passos (some quando a
//     pessoa fecha ou depois que ela já colocou algo no carrinho)
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { linkWhatsApp } from "@/lib/whatsapp";

type Props = { slug: string; cor: string; nome: string; whatsapp: string | null; temNovidades: boolean; temDestaques: boolean };

export default function AtalhosDaLoja({ slug, cor, nome, whatsapp, temNovidades, temDestaques }: Props) {
  const [guia, setGuia] = useState(false);
  useEffect(() => {
    try {
      const fechou = localStorage.getItem(`guia-fechado:${slug}`);
      const carrinho = JSON.parse(localStorage.getItem(`carrinho:${slug}`) ?? "[]") as unknown[];
      setGuia(!fechou && carrinho.length === 0);
    } catch {}
  }, [slug]);
  const fecharGuia = () => { setGuia(false); try { localStorage.setItem(`guia-fechado:${slug}`, "1"); } catch {} };
  const ir = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const botao = "clicavel flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border bg-white/90 px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm";
  return (
    <div className="mt-3">
      <nav aria-label="Atalhos" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
        {temNovidades && <button type="button" onClick={() => ir("novidades")} className={botao} style={{ borderColor: `${cor}55` }}>🆕 Novidades</button>}
        {temDestaques && <button type="button" onClick={() => ir("destaques")} className={botao} style={{ borderColor: `${cor}55` }}>⭐ Mais procurados</button>}
        <Link href={`/${slug}/favoritos`} className={botao} style={{ borderColor: `${cor}55` }}>❤️ Meus favoritos</Link>
        {whatsapp && (
          <a href={linkWhatsApp(whatsapp.replace(/\D/g, ""), `Olá! Estou no site da ${nome} e preciso de ajuda 😊`)} target="_blank" rel="noopener noreferrer"
            className={`${botao} border-transparent !bg-[#1FA855] !text-white`}>💬 Ajuda no WhatsApp</a>
        )}
      </nav>

      {guia && (
        <section className="relative mt-3 rounded-2xl border bg-white/95 p-4 text-stone-900 shadow-sm" style={{ borderColor: `${cor}55` }} aria-label="Como comprar">
          <button type="button" onClick={fecharGuia} aria-label="Fechar o guia" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-lg opacity-60 hover:opacity-100">✕</button>
          <b className="block pr-8" style={{ color: cor }}>👋 Primeira vez aqui? Comprar é fácil:</b>
          <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            {[
              ["👆", "Toque no produto que gostou para ver fotos e detalhes"],
              ["🛒", "Escolha cor/tamanho e toque em “Adicionar” (ou no ＋)"],
              ["📲", "Abra o carrinho e envie o pedido — a gente responde no WhatsApp"],
            ].map(([i, t], n) => (
              <li key={t} className="flex items-start gap-2 rounded-xl p-2" style={{ background: `${cor}10` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: cor }}>{n + 1}</span>
                <span><span aria-hidden>{i} </span>{t}</span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={fecharGuia} className="mt-3 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: cor }}>Entendi 👍</button>
        </section>
      )}
    </div>
  );
}
