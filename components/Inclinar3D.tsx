"use client";
// =====================================================================
// INCLINAÇÃO 3D — o cartão "deita" de leve acompanhando o mouse, com um
// brilho que segue o cursor. Só no computador (no celular, nada muda).
// =====================================================================
import { useRef, type ReactNode } from "react";

export default function Inclinar3D({ children, graus = 8, className = "" }: { children: ReactNode; graus?: number; className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const brilho = useRef<HTMLDivElement>(null);
  return (
    <div className={`relative ${className}`} style={{ perspective: 800 }}>
      <div ref={caixa} style={{ transition: "transform .25s ease-out", transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || !caixa.current) return;
          const r = caixa.current.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          caixa.current.style.transform = `rotateY(${x * graus * 2}deg) rotateX(${-y * graus * 2}deg)`;
          if (brilho.current) {
            brilho.current.style.opacity = "1";
            brilho.current.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgb(255 255 255 / .35), transparent 55%)`;
          }
        }}
        onPointerLeave={() => {
          if (caixa.current) caixa.current.style.transform = "";
          if (brilho.current) brilho.current.style.opacity = "0";
        }}>
        {children}
        <div ref={brilho} aria-hidden className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300" />
      </div>
    </div>
  );
}
