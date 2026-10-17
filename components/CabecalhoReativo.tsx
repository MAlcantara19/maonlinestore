"use client";
// =====================================================================
// CABEÇALHO REATIVO — barra compacta que fica presa no topo, mas só
// aparece quando a pessoa ROLA PARA CIMA (quer navegar) e se esconde
// quando ROLA PARA BAIXO (quer ver os produtos).
// No celular traz o botão "☰" e a linha de atalhos.
// =====================================================================
import BotaoTema from "@/components/BotaoTema";
import ImagemLogo from "@/components/ImagemLogo";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Loja } from "@/lib/tipos";
import type { ItemMenu } from "@/lib/menu";
import IconeInstagram from "@/components/IconeInstagram";
import { usuarioInstagram } from "@/lib/formato";

export default function CabecalhoReativo({ loja, menu }: { loja: Loja; menu: ItemMenu[] }) {
  const cor = loja.cor ?? "#333";
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ultimo = window.scrollY;
    const aoRolar = () => {
      const y = window.scrollY;
      if (y < 250) setVisivel(false); // ainda vendo o banner: não precisa
      else if (y < ultimo - 6) setVisivel(true); // subindo
      else if (y > ultimo + 6) setVisivel(false); // descendo
      ultimo = y;
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  const abrirMenu = () => window.dispatchEvent(new Event("abrir-menu"));
  const insta = usuarioInstagram(loja.instagram);

  return (
    // Efeito "vidro fosco": cor da loja semi-transparente + desfoque do que passa por trás
    <div className="fixed inset-x-0 top-0 z-30 text-white shadow-lg backdrop-blur-md transition-transform duration-300 ease-out"
      style={{ background: `${cor}cc`, transform: visivel ? "translateY(0)" : "translateY(-110%)", paddingTop: "env(safe-area-inset-top)" }}
      aria-hidden={!visivel}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        {menu.length > 0 && (
          <button type="button" onClick={abrirMenu} aria-label="Abrir menu" className="rounded-full bg-white/15 px-3 py-1.5 lg:hidden">☰</button>
        )}
        {/* Logo + nome: sempre mostram em qual loja a pessoa está */}
        <Link href={`/${loja.slug}`} className="flex min-w-0 flex-1 items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white font-bold shadow" style={{ color: cor }}>
            {loja.logo_url ? <ImagemLogo src={loja.logo_url} ajuste={loja.logo_ajuste} zoom={loja.logo_zoom} fundo={loja.logo_fundo} /> : loja.nome.charAt(0)}
          </span>
          <span className="truncate font-bold">{loja.nome}</span>
        </Link>
        {insta && (
          <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer" aria-label={`Instagram @${insta}`}
            className="clicavel rounded-full bg-white/15 p-2"><IconeInstagram /></a>
        )}
        <BotaoTema className="clicavel rounded-full bg-white/15 px-2.5 py-1.5 text-sm" />
        <Link href="/" className="clicavel rounded-full bg-white/15 px-3 py-1.5 text-sm">🏬 Lojas</Link>
      </div>

      {/* Atalhos (só no celular; no computador já existe o menu lateral) */}
      {menu.length > 0 && (
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
          {menu.map((item) => (
            <Link key={item.id} href={`/${loja.slug}#${item.id}`} className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm">
              {item.rotulo}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
