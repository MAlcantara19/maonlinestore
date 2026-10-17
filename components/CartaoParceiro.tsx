// =====================================================================
// CARTÃO DE PARCEIRO
//   - Foto grande de fundo (fachada, local, pessoa) e, se tiver, a LOGO
//     redonda no meio, por cima da foto.
//   - Sem foto: fundo na cor do parceiro, com a logo ou a inicial.
//   - Selo (ex.: "Patrocinado") e borda dourada quando está em destaque.
// =====================================================================
import ImagemLogo from "@/components/ImagemLogo";
import Link from "next/link";
import type { Parceiro } from "@/lib/tipos";

export default function CartaoParceiro({ parceiro, indice = 0 }: { parceiro: Parceiro; indice?: number }) {
  const cor = parceiro.cor ?? "#1c1917";
  return (
    // Em destaque: moldura colorida girando em volta do cartão
    <div className={`animar-entrada rounded-[1.1rem] ${parceiro.destaque ? "borda-girando p-[3px]" : ""}`} style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}>
      <Link href={`/parceiros/${parceiro.slug}`}
        className="clicavel cartao group block overflow-hidden rounded-2xl border bg-white text-stone-900 shadow-sm">
        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
          {/* Foto de fundo, com um véu escuro para a logo aparecer bem */}
          {parceiro.foto_url && (
            <>
              <img src={parceiro.foto_url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              {parceiro.logo_url && <div className="absolute inset-0 bg-black/25" />}
            </>
          )}
          {/* Logo no meio (ou a inicial, se não houver foto nem logo) */}
          {parceiro.logo_url ? (
            <span className="relative block h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg transition-transform duration-500 group-hover:scale-105">
              <ImagemLogo src={parceiro.logo_url} alt={parceiro.nome} ajuste={parceiro.logo_ajuste} zoom={parceiro.logo_zoom} fundo={parceiro.logo_fundo} />
            </span>
          ) : (
            !parceiro.foto_url && <span className="text-4xl font-bold text-white">{parceiro.nome.charAt(0)}</span>
          )}

          {parceiro.categoria && (
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold" style={{ color: cor }}>
              {parceiro.categoria}
            </span>
          )}
          {parceiro.selo && (
            <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-900 shadow">
              {parceiro.selo}
            </span>
          )}
        </div>
        <div className="p-3">
          <b className="block">{parceiro.nome}</b>
          {parceiro.descricao && <p className="line-clamp-2 text-sm opacity-70">{parceiro.descricao}</p>}
        </div>
      </Link>
    </div>
  );
}
