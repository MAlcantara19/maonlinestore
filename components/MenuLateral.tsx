"use client";
// =====================================================================
// MENU LATERAL DA LOJA
//   Computador: barra na lateral esquerda, que abre e fecha
//               (lembra a escolha da pessoa na próxima visita).
//   Celular:    barra de atalhos com o botão "☰ Menu", que abre
//               uma gaveta deslizando da esquerda.
// Categorias com subcategorias têm uma setinha › para expandir.
// =====================================================================
import { linkWhatsApp } from "@/lib/whatsapp";
import { BolinhaTelefone, IconeCoracao } from "@/components/Icones";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ItemMenu } from "@/lib/menu";

type Props = { slug: string; cor: string; corSecundaria: string | null; menu: ItemMenu[]; whatsapp?: string | null };

export default function MenuLateral({ slug, cor, corSecundaria, menu, whatsapp }: Props) {
  const [aberto, setAberto] = useState(true); // barra lateral do computador
  const [gaveta, setGaveta] = useState(false); // gaveta do celular
  const [expandidos, setExpandidos] = useState<string[]>([]); // categorias abertas

  // Lembra se a pessoa deixou a barra aberta ou fechada da última vez.
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("menu-lateral-aberto");
      if (salvo !== null) setAberto(salvo === "1");
    } catch {}
  }, []);

  // O botão ☰ do cabeçalho reativo pede para abrir a gaveta (evento "abrir-menu").
  useEffect(() => {
    const abrir = () => setGaveta(true);
    window.addEventListener("abrir-menu", abrir);
    return () => window.removeEventListener("abrir-menu", abrir);
  }, []);

  // Com a gaveta aberta, a página de trás não rola.
  useEffect(() => {
    document.body.style.overflow = gaveta ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [gaveta]);

  function alternarBarra() {
    const novo = !aberto;
    setAberto(novo);
    try { localStorage.setItem("menu-lateral-aberto", novo ? "1" : "0"); } catch {}
  }

  const alternarItem = (id: string) =>
    setExpandidos((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));

  const fundo = corSecundaria ?? "#f4f4f5";

  // Atalhos fixos, embaixo das categorias
  const atalhos = (aoClicar?: () => void) => {
    const item = "clicavel flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/60";
    return (
      <div className="mt-3 border-t pt-3" style={{ borderColor: `${cor}33` }}>
        <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide opacity-60">Atalhos</p>
        <Link href={`/${slug}`} onClick={aoClicar} className={item}>🏠 Início da loja</Link>
        <button type="button" onClick={() => { aoClicar?.(); window.dispatchEvent(new Event("abrir-carrinho")); }} className={`${item} w-full text-left`}>🛒 Meu carrinho</button>
        <Link href={`/${slug}/favoritos`} onClick={aoClicar} className={item}>❤️ Meus favoritos</Link>
        {whatsapp && (
          <a href={linkWhatsApp(whatsapp.replace(/\D/g, ""))} target="_blank" rel="noopener noreferrer" className={item}><BolinhaTelefone tamanho={18} /> Falar no WhatsApp</a>
        )}
        <Link href={`/${slug}/sobre`} onClick={aoClicar} className={item}><IconeCoracao cor={cor} /> Sobre a loja</Link>
        <Link href="/parceiros" onClick={aoClicar} className={item}>🤝 Parceiros</Link>
        <Link href="/" onClick={aoClicar} className={item}>🏬 Todas as lojas</Link>
      </div>
    );
  };

  // A lista do menu, separada em grupos com título:
  //   ⭐ Destaques  ·  🗂️ Categorias  ·  ✨ Coleções
  const GRUPOS = [
    { id: "destaques", titulo: "⭐ Destaques" },
    { id: "categorias", titulo: "🗂️ Categorias" },
    { id: "colecoes", titulo: "✨ Coleções" },
  ] as const;
  const lista = (aoClicar?: () => void) => (
    <div className="space-y-3">
      {GRUPOS.map((g) => {
        const doGrupo = menu.filter((m) => (m.grupo ?? "categorias") === g.id);
        if (!doGrupo.length) return null;
        return (
          <div key={g.id}>
            <p className="mb-1 border-b px-3 pb-1 text-xs font-bold uppercase tracking-wide" style={{ color: cor, borderColor: `${cor}33` }}>{g.titulo}</p>
            {listaDe(doGrupo, aoClicar)}
          </div>
        );
      })}
    </div>
  );

  // Itens de um grupo (categorias com subcategorias que abrem e fecham)
  const listaDe = (itensDoGrupo: ItemMenu[], aoClicar?: () => void) => (
    <ul className="space-y-1">
      {itensDoGrupo.map((item) => {
        const temFilhos = (item.filhos?.length ?? 0) > 0;
        const expandido = expandidos.includes(item.id);
        return (
          <li key={item.id}>
            <div className="flex items-center gap-1">
              {/* Categoria principal: fundo de "botão" e barrinha na cor da loja; os outros itens ficam simples */}
              <Link href={`/${slug}#${item.id}`} onClick={aoClicar}
                className={`clicavel flex-1 rounded-lg px-3 py-2 text-sm hover:bg-white/60 ${item.grupo === "categorias" ? "bg-white/70 font-bold shadow-sm" : "font-medium"}`}
                style={{ color: cor, ...(item.grupo === "categorias" ? { borderLeft: `4px solid ${cor}` } : {}) }}>
                {item.rotulo}
              </Link>
              {temFilhos && (
                <button type="button" onClick={() => alternarItem(item.id)}
                  aria-label={expandido ? "Esconder subcategorias" : "Mostrar subcategorias"}
                  className="rounded-lg px-3 py-2 text-lg leading-none" style={{ color: cor }}>
                  {/* A setinha gira quando abre */}
                  <span className="inline-block transition-transform duration-300"
                    style={{ transform: expandido ? "rotate(90deg)" : "none" }}>›</span>
                </button>
              )}
            </div>
            {/* Subcategorias: abrem e fecham com animação de altura */}
            {temFilhos && (
              <div className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: expandido ? "1fr" : "0fr" }}>
                <ul className="ml-4 overflow-hidden border-l-2 pl-2" style={{ borderColor: `${cor}40` }}>
                  {item.filhos!.map((f) => (
                    <li key={f.id}>
                      <Link href={`/${slug}#${f.id}`} onClick={aoClicar}
                        className="block rounded-lg px-3 py-1.5 text-sm opacity-80 hover:bg-white/60">
                        {f.rotulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* ===== CELULAR: barra presa no topo ===== */}
      <div className="shadow-sm lg:hidden" style={{ background: fundo }}>
        <div className="flex gap-2 overflow-x-auto px-4 py-2">
          <button type="button" onClick={() => setGaveta(true)}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-white" style={{ background: cor }}>
            ☰ Menu
          </button>
          {menu.map((item) => (
            <Link key={item.id} href={`/${slug}#${item.id}`}
              className="clicavel shrink-0 rounded-full border bg-white/70 px-3 py-1.5 text-sm font-medium"
              style={{ borderColor: cor, color: cor }}>
              {item.rotulo}
            </Link>
          ))}
        </div>
      </div>

      {/* ===== CELULAR: fundo escuro + gaveta que desliza ===== */}
      <div onClick={() => setGaveta(false)}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden ${gaveta ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] overflow-y-auto p-4 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${gaveta ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: fundo, color: "#1c1917", paddingTop: "calc(1rem + env(safe-area-inset-top))" }}>
        <div className="mb-3 flex items-center justify-between">
          <b className="text-lg" style={{ color: cor }}>Categorias</b>
          <button type="button" onClick={() => setGaveta(false)} aria-label="Fechar menu"
            className="rounded-full px-3 py-1 text-lg" style={{ color: cor }}>✕</button>
        </div>
        {lista(() => setGaveta(false))}
        {atalhos(() => setGaveta(false))}
      </aside>

      {/* ===== COMPUTADOR: barra lateral que abre e fecha ===== */}
      <aside
        className="sticky top-20 mt-4 hidden max-h-[calc(100vh-6rem)] shrink-0 overflow-x-hidden overflow-y-auto rounded-2xl p-2 shadow-sm transition-[width] duration-300 ease-out lg:block"
        style={{ background: fundo, color: "#1c1917", width: aberto ? "16rem" : "3.5rem" }}>
        <button type="button" onClick={alternarBarra} aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className="mb-2 flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold"
          style={{ color: cor }}>
          <span className="text-lg">{aberto ? "«" : "☰"}</span>
          {aberto && <span>Menu</span>}
        </button>
        <div className={`w-60 transition-opacity duration-200 ${aberto ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          {lista()}
          {atalhos()}
        </div>
      </aside>
    </>
  );
}
