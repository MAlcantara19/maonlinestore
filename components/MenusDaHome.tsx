"use client";
// =====================================================================
// MENUS LATERAIS DA PÁGINA INICIAL
//   esquerda: 🏬 as lojas  ·  direita: 🤝 os parceiros
//   - Tela grande: os dois ficam abertos, fixos dos lados
//   - Celular/tela menor: dois botões no topo abrem gavetas (uma de cada lado)
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import ImagemLogo from "@/components/ImagemLogo";

type LojaMenu = { id: string; slug: string; nome: string; cor: string | null; logo_url: string | null; logo_ajuste?: string | null; logo_zoom?: number | null; logo_fundo?: string | null; em_breve?: boolean; descricao?: string | null };
type ParceiroMenu = { id: string; slug: string; nome: string; cor?: string | null; logo_url: string | null; foto_url: string | null; categoria?: string | null; logo_ajuste?: string | null; logo_zoom?: number | null; logo_fundo?: string | null };

function Logo({ src, nome, cor, ajuste, zoom, fundo, tamanho = 40 }: { src: string | null; nome: string; cor?: string | null; ajuste?: string | null; zoom?: number | null; fundo?: string | null; tamanho?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white font-bold" style={{ width: tamanho, height: tamanho, borderColor: cor ?? "#ddd", color: cor ?? "#333" }}>
      {src ? <ImagemLogo src={src} ajuste={ajuste} zoom={zoom} fundo={fundo} /> : nome.charAt(0)}
    </span>
  );
}

export default function MenusDaHome({ lojas, parceiros }: { lojas: LojaMenu[]; parceiros: ParceiroMenu[] }) {
  const [aberto, setAberto] = useState<"lojas" | "parceiros" | null>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const listaLojas = (
    <ul className="space-y-1">
      {lojas.map((l) => (
        <li key={l.id}>
          <Link href={`/${l.slug}`} onClick={() => setAberto(null)} className="clicavel flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-black/5">
            <Logo src={l.logo_url} nome={l.nome} cor={l.cor} ajuste={l.logo_ajuste} zoom={l.logo_zoom} fundo={l.logo_fundo} />
            <span className="min-w-0">
              <b className="block truncate text-sm">{l.nome}</b>
              <span className="block truncate text-xs opacity-60">{l.em_breve ? "⏳ Em breve" : l.descricao}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const listaParceiros = (
    <ul className="space-y-2">
      {parceiros.map((p) => (
        <li key={p.id}>
          <Link href={`/parceiros/${p.slug}`} onClick={() => setAberto(null)} className="clicavel block overflow-hidden rounded-xl border bg-white hover:shadow-md">
            {/* Com banner: banner + logo por cima. Sem banner: só a logo e o nome */}
            {p.foto_url ? (
              <span className="relative block" style={{ aspectRatio: "16 / 10" }}>
                <img src={p.foto_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                <span className="absolute bottom-1.5 left-1.5"><Logo src={p.logo_url} nome={p.nome} cor={p.cor} ajuste={p.logo_ajuste} zoom={p.logo_zoom} fundo={p.logo_fundo} tamanho={34} /></span>
              </span>
            ) : null}
            <span className="flex items-center gap-2 px-2 py-2">
              {!p.foto_url && <Logo src={p.logo_url} nome={p.nome} cor={p.cor} ajuste={p.logo_ajuste} zoom={p.logo_zoom} fundo={p.logo_fundo} />}
              <span className="min-w-0">
                <b className="block truncate text-sm text-stone-900">{p.nome}</b>
                {p.categoria && <span className="block truncate text-xs text-stone-500">{p.categoria}</span>}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const painel = "rounded-2xl bg-white/90 p-3 text-stone-900 shadow-xl backdrop-blur";
  return (
    <>
      {/* ===== Tela grande: fixos dos lados ===== */}
      <aside className={`fixed left-4 top-4 z-30 hidden max-h-[calc(100vh-2rem)] w-60 overflow-y-auto 2xl:block ${painel}`}>
        <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide opacity-60">🏬 Lojas</p>
        {listaLojas}
      </aside>
      {parceiros.length > 0 && (
        <aside className={`fixed right-4 top-16 z-30 hidden max-h-[calc(100vh-5rem)] w-60 overflow-y-auto 2xl:block ${painel}`}>
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide opacity-60">🤝 Parceiros</p>
          {listaParceiros}
          <Link href="/parceiros" className="mt-2 block px-2 text-xs font-semibold underline opacity-70">Ver todos os parceiros →</Link>
        </aside>
      )}

      {/* ===== Celular / tela menor: botões que abrem as gavetas ===== */}
      <div className="fixed left-3 top-3 z-30 2xl:hidden" style={{ marginTop: "env(safe-area-inset-top)" }}>
        <button type="button" onClick={() => setAberto("lojas")} className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-stone-900 shadow-lg backdrop-blur">🏬 Lojas</button>
      </div>
      {parceiros.length > 0 && (
        <div className="fixed right-16 top-3 z-30 2xl:hidden" style={{ marginTop: "env(safe-area-inset-top)" }}>
          <button type="button" onClick={() => setAberto("parceiros")} className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-stone-900 shadow-lg backdrop-blur">🤝 Parceiros</button>
        </div>
      )}
      <div onClick={() => setAberto(null)} className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 2xl:hidden ${aberto ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-white p-4 text-stone-900 shadow-2xl transition-transform duration-300 2xl:hidden ${aberto === "lojas" ? "translate-x-0" : "-translate-x-full"}`}
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}>
        <div className="mb-3 flex items-center justify-between"><b>🏬 Lojas</b><button type="button" onClick={() => setAberto(null)} aria-label="Fechar" className="text-xl">✕</button></div>
        {listaLojas}
      </aside>
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-stone-50 p-4 text-stone-900 shadow-2xl transition-transform duration-300 2xl:hidden ${aberto === "parceiros" ? "translate-x-0" : "translate-x-full"}`}
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}>
        <div className="mb-3 flex items-center justify-between"><b>🤝 Parceiros</b><button type="button" onClick={() => setAberto(null)} aria-label="Fechar" className="text-xl">✕</button></div>
        {listaParceiros}
        <Link href="/parceiros" onClick={() => setAberto(null)} className="mt-3 block text-sm font-semibold underline">Ver todos os parceiros →</Link>
      </aside>
    </>
  );
}
