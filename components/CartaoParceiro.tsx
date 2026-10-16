// =====================================================================
// CARTÃO DE PARCEIRO — foto (ou logo), etiqueta da categoria, nome e
// um resumo. Leva para a página do parceiro.
// =====================================================================
import Link from "next/link";
import type { Parceiro } from "@/lib/tipos";

export default function CartaoParceiro({ parceiro, indice = 0 }: { parceiro: Parceiro; indice?: number }) {
  const cor = parceiro.cor ?? "#1c1917";
  const imagem = parceiro.foto_url ?? parceiro.logo_url;
  return (
    <div className="animar-entrada" style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}>
      <Link href={`/parceiros/${parceiro.slug}`} className="clicavel cartao group block overflow-hidden rounded-2xl border bg-white text-stone-900 shadow-sm">
        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden text-4xl font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
          {imagem ? (
            <img src={imagem} alt={parceiro.nome} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            parceiro.nome.charAt(0)
          )}
          {parceiro.categoria && (
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold" style={{ color: cor }}>
              {parceiro.categoria}
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
