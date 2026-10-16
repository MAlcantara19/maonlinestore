// =====================================================================
// CABEÇALHO DA LOJA — usado na loja, no produto e no carrinho.
//   1. Banner na largura toda, na cor da loja, com logo, nome e descrição
//      e os botões: Todas as lojas · Início (da loja) · Carrinho
//   2. Linha de atalhos (menu rápido) que fica PRESA no topo ao rolar
// =====================================================================
import Link from "next/link";
import type { Loja } from "@/lib/tipos";
import type { ItemMenu } from "@/lib/menu";

export default function CabecalhoDaLoja({ loja, menu }: { loja: Loja; menu: ItemMenu[] }) {
  const cor = loja.cor ?? "#333";
  const botao = "clicavel rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25";

  return (
    <>
      {/* 1) Banner */}
      <header className="text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-6">
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link href="/" className={botao}>🏬 Todas as lojas</Link>
            <Link href={`/${loja.slug}`} className={botao}>🏠 Início</Link>
            <Link href={`/${loja.slug}/carrinho`} className={botao}>🛒 Carrinho</Link>
          </nav>
          <div className="mt-5 flex items-center gap-4">
            {loja.logo_url && (
              <img src={loja.logo_url} alt="" className="h-16 w-16 shrink-0 rounded-full bg-white object-cover" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{loja.nome}</h1>
              {loja.descricao && <p className="text-sm opacity-90">{loja.descricao}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* 2) Menu rápido: rola para o lado no celular; fica preso no topo (sticky) */}
      {menu.length > 0 && (
        <nav className="sticky top-0 z-10 shadow-sm" style={{ background: loja.cor_secundaria ?? "var(--background)" }}>
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2">
            {menu.map((item) => (
              <Link key={item.id} href={`/${loja.slug}#${item.id}`}
                className="clicavel shrink-0 rounded-full border bg-white/70 px-3 py-1.5 text-sm font-medium"
                style={{ borderColor: cor, color: cor }}>
                {item.rotulo}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}