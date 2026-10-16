// =====================================================================
// CABEÇALHO DA LOJA — usado na loja, no produto e no carrinho.
//   1. Banner na cor da loja, com parallax:
//      - botões: Todas as lojas · Início · Carrinho · Parceiros
//      - LOGO + NOME clicáveis (voltam para o início da loja)
//      - Instagram e a BUSCA de produtos
//   2. Cabeçalho reativo: aparece ao rolar para cima.
// =====================================================================
import Link from "next/link";
import type { Loja } from "@/lib/tipos";
import type { ItemMenu } from "@/lib/menu";
import CabecalhoReativo from "@/components/CabecalhoReativo";
import IconeInstagram from "@/components/IconeInstagram";
import BuscaNoBanner from "@/components/BuscaNoBanner";
import { usuarioInstagram } from "@/lib/formato";

// Bolhas claras de decoração no fundo do banner
const BOLHAS =
  "radial-gradient(circle at 12% 25%, rgb(255 255 255 / 0.18) 0 55px, transparent 56px)," +
  "radial-gradient(circle at 88% 20%, rgb(255 255 255 / 0.12) 0 90px, transparent 91px)," +
  "radial-gradient(circle at 65% 115%, rgb(255 255 255 / 0.10) 0 130px, transparent 131px)";

export default function CabecalhoDaLoja({ loja, menu }: { loja: Loja; menu: ItemMenu[] }) {
  const cor = loja.cor ?? "#333";
  const botao = "clicavel rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25";
  const insta = usuarioInstagram(loja.instagram);

  return (
    <>
      <CabecalhoReativo loja={loja} menu={menu} />

      <header className="relative text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
        {/* Bolhas com parallax, recortadas dentro do banner */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="parallax-fundo absolute inset-0" style={{ backgroundImage: BOLHAS }} />
        </div>
        <div className="relative mx-auto max-w-[90rem] px-4 pt-4 pb-6">
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link href="/" className={botao}>🏬 Todas as lojas</Link>
            <Link href={`/${loja.slug}`} className={botao}>🏠 Início</Link>
            <Link href={`/${loja.slug}/carrinho`} className={botao}>🛒 Carrinho</Link>
            <Link href="/parceiros" className={botao}>🤝 Parceiros</Link>
          </nav>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Logo + nome: levam para o início da loja */}
              <Link href={`/${loja.slug}`} className="clicavel flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-2xl font-bold shadow-lg" style={{ color: cor }} aria-label={`Início da ${loja.nome}`}>
                {loja.logo_url ? <img src={loja.logo_url} alt="" className="h-full w-full object-cover" /> : loja.nome.charAt(0)}
              </Link>
              <div>
                <Link href={`/${loja.slug}`} className="hover:underline"><h1 className="text-3xl font-bold drop-shadow-sm">{loja.nome}</h1></Link>
                {loja.descricao && <p className="text-sm opacity-90">{loja.descricao}</p>}
                {insta && (
                  <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer"
                    className="clicavel mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm hover:bg-white/25">
                    <IconeInstagram /> @{insta}
                  </a>
                )}
              </div>
            </div>
            {/* Busca de produtos */}
            <BuscaNoBanner slug={loja.slug} lojaId={loja.id} />
          </div>
        </div>
      </header>
    </>
  );
}
