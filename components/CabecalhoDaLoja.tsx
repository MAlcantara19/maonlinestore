// =====================================================================
// CABEÇALHO DA LOJA — usado na loja, no produto e no carrinho.
//   1. Banner na cor da loja, com parallax:
//      - botões: Todas as lojas · Início · Carrinho · Parceiros
//      - LOGO + NOME clicáveis (voltam para o início da loja)
//      - Instagram e a BUSCA de produtos
//   2. Cabeçalho reativo: aparece ao rolar para cima.
// =====================================================================
import LinkTopo from "@/components/LinkTopo";
import BotaoTema from "@/components/BotaoTema";
import NavDeslizante from "@/components/NavDeslizante";
import ParallaxMouse from "@/components/ParallaxMouse";
import ImagemLogo from "@/components/ImagemLogo";
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

      <header className="relative text-white" style={{ background: loja.banner_url ? "#000" : `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
        {/* Imagem do banner (opcional) + a cor da loja por cima, para o texto ficar legível */}
        {loja.banner_url && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src={loja.banner_url} alt="" className="parallax-fundo h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}aa)`, opacity: (loja.banner_escurecer ?? 45) / 100 }} />
          </div>
        )}
        {/* Bolhas com parallax, recortadas dentro do banner */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="parallax-fundo absolute inset-0">
            {/* As bolhas se mexem com o mouse / giro do celular */}
            <ParallaxMouse forca={26} className="absolute -inset-10"><div className="absolute inset-0" style={{ backgroundImage: BOLHAS }} /></ParallaxMouse>
          </div>
        </div>
        <div className="relative mx-auto max-w-[90rem] px-4 pt-4 pb-6">
          <div className="flex items-start justify-between gap-2">
            {/* Menu com a linha que desliza de um botão para o outro */}
            <NavDeslizante classeItem={botao} itens={[
              { href: "/", rotulo: "🏬 Todas as lojas" },
              { href: `/${loja.slug}`, rotulo: "🏠 Início" },
              { href: `/${loja.slug}/carrinho`, rotulo: "🛒 Carrinho" },
              { href: "/parceiros", rotulo: "🤝 Parceiros" },
            ]} />
            <BotaoTema className="clicavel shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" />
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Logo + nome: levam para o início da loja */}
              <LinkTopo href={`/${loja.slug}`} className="clicavel flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-3xl font-bold shadow-xl sm:h-28 sm:w-28 sm:text-4xl"
                style={{ color: cor, border: `${loja.logo_borda ?? 3}px solid ${loja.logo_borda_cor ?? "#ffffff"}` }} aria-label={`Início da ${loja.nome}`}>
                {loja.logo_url ? <ImagemLogo src={loja.logo_url} ajuste={loja.logo_ajuste} zoom={loja.logo_zoom} fundo={loja.logo_fundo} /> : loja.nome.charAt(0)}
              </LinkTopo>
              <div>
                <LinkTopo href={`/${loja.slug}`} className="hover:underline"><h1 className="text-3xl font-bold drop-shadow-sm sm:text-4xl">{loja.nome}</h1></LinkTopo>
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
