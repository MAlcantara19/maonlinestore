"use client";
// =====================================================================
// EFEITO MAGNÉTICO — o botão de dentro é "puxado" de leve na direção do
// mouse quando ele chega perto (só no computador).
// =====================================================================
import { useRef, type ReactNode } from "react";

export default function Magnetico({ children, forca = 0.25, className = "" }: { children: ReactNode; forca?: number; className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  return (
    <div ref={caixa} className={className} style={{ transition: "transform 0.2s ease-out" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !caixa.current) return;
        const r = caixa.current.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * forca;
        const y = (e.clientY - (r.top + r.height / 2)) * forca;
        caixa.current.style.transform = `translate(${x}px, ${y}px)`;
      }}
      onPointerLeave={() => { if (caixa.current) caixa.current.style.transform = ""; }}>
      {children}
    </div>
  );
}
