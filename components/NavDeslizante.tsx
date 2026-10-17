"use client";
// =====================================================================
// MENU COM "BORDA SEGUIDORA" — uma linha embaixo dos botões que desliza
// e estica de um para o outro conforme o mouse passa.
// =====================================================================
import Link from "next/link";
import { useRef, useState } from "react";

type Item = { href: string; rotulo: string };

export default function NavDeslizante({ itens, classeItem }: { itens: Item[]; classeItem: string }) {
  const nav = useRef<HTMLElement>(null);
  const [linha, setLinha] = useState<{ x: number; largura: number; visivel: boolean }>({ x: 0, largura: 0, visivel: false });

  const seguir = (alvo: HTMLElement) => {
    const base = nav.current?.getBoundingClientRect();
    const r = alvo.getBoundingClientRect();
    if (base) setLinha({ x: r.left - base.left, largura: r.width, visivel: true });
  };

  return (
    <nav ref={nav} className="relative flex flex-wrap gap-2 pb-1.5 text-sm" onMouseLeave={() => setLinha((l) => ({ ...l, visivel: false }))}>
      {itens.map((i) => (
        <Link key={i.href} href={i.href} className={classeItem} onMouseEnter={(e) => seguir(e.currentTarget)} onFocus={(e) => seguir(e.currentTarget)}>
          {i.rotulo}
        </Link>
      ))}
      <span aria-hidden className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-white transition-all duration-300 ease-out"
        style={{ left: linha.x, width: linha.largura, opacity: linha.visivel ? 1 : 0 }} />
    </nav>
  );
}
