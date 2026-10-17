"use client";
// =====================================================================
// LINK QUE SOBE PARA O TOPO — se você já está na página do link (ex.:
// clicou no nome/logo da loja estando na loja), ele sobe suavemente até
// o topo em vez de recarregar. Em outra página, funciona como link normal.
// =====================================================================
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

type Props = { href: string; className?: string; style?: CSSProperties; children: ReactNode; "aria-label"?: string };

export default function LinkTopo({ href, children, ...resto }: Props) {
  const caminho = usePathname();
  return (
    <Link href={href} {...resto}
      onClick={(e) => {
        if (caminho === href) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}>
      {children}
    </Link>
  );
}
