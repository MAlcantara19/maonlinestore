// =====================================================================
// CABEÇALHO DA LOJA — usado na loja, no produto e no carrinho.
//   1. Banner na largura toda, na cor da loja, com efeito PARALLAX:
//      ao rolar, as bolhas do fundo e o texto andam em velocidades
//      diferentes e somem suavemente (só CSS, sem pesar o site).
//   2. Linha de atalhos (opcional) logo abaixo do banner.
//   3. Cabeçalho reativo: aparece ao rolar para cima.
// =====================================================================
import Link from "next/link";
import type { Loja } from "@/lib/tipos";
import type { ItemMenu } from "@/lib/menu";
import CabecalhoReativo from "@/components/CabecalhoReativo";
import IconeInstagram from "@/components/IconeInstagram";
import { usuarioInstagram } from "@/lib/formato";

type Props = { loja: Loja; menu: ItemMenu[]; atalhos?: boolean };

// Bolhas claras de decoração no fundo do banner (depois dá para trocar pela logo repetida).
const BOLHAS =
  "radial-gradient(circle at 12% 25%, rgb(255 255 255 / 0.18) 0 55px, transparent 56px)," +
  "radial-gradient(circle at 88% 20%, rgb(255 255 255 / 0.12) 0 90px, transparent 91px)," +
  "radial-gradient(circle at 65% 115%, rgb(255 255 255 / 0.10) 0 130px, transparent 131px)";

export default function CabecalhoDaLoja({ loja, menu, atalhos = true }: Props) {
  const cor = loja.cor ?? "#333";
  const botao = "clicavel rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25";
  const insta = usuarioInstagram(loja.instagram); // aceita @loja, loja ou o link

  return (
    <>
      <CabecalhoReativo loja={loja} menu={menu} />

      {/* 1) Banner */}
      <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
        <div aria-hidden className="parallax-fundo pointer-events-none absolute inset-0" style={{ backgroundImage: BOLHAS }} />
        <div className="parallax-conteudo relative mx-auto max-w-6xl px-4 pt-4 pb-8">
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link href="/" className={botao}>🏬 Todas as lojas</Link>
            <Link href={`/${loja.slug}`} className={botao}>🏠 Início</Link>
            <Link href={`/${loja.slug}/carrinho`} className={botao}>🛒 Carrinho</Link>
            <Link href="/parceiros" className={botao}>🤝 Parceiros</Link>
          </nav>
          <div className="mt-5 flex items-center gap-4">
            {/* Logo da loja (ou a inicial do nome, enquanto não houver logo) */}
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-2xl font-bold shadow-lg" style={{ color: cor }}>
              {loja.logo_url ? <img src={loja.logo_url} alt="" className="h-full w-full object-cover" /> : loja.nome.charAt(0)}
            </span>
            <div>
              <h1 className="text-3xl font-bold drop-shadow-sm">{loja.nome}</h1>
              {loja.descricao && <p className="text-sm opacity-90">{loja.descricao}</p>}
              {/* Instagram da loja, logo abaixo do nome */}
              {insta && (
                <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer"
                  className="clicavel mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm hover:bg-white/25">
                  <IconeInstagram /> @{insta}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2) Atalhos logo abaixo do banner (na página do produto e do carrinho) */}
      {atalhos && menu.length > 0 && (
        <nav className="shadow-sm" style={{ background: loja.cor_secundaria ?? "var(--background)" }}>
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2">
            {menu.map((item) => (
              <Link key={item.id} href={`/${loja.slug}#${item.id}`}
                className="clicavel shrink-0 rounded-full border bg-white/70 px-3 py-1.5 text-sm font-medium" style={{ borderColor: cor, color: cor }}>
                {item.rotulo}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
