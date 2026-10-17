"use client";
// =====================================================================
// NÚMERO QUE "CONTA" ATÉ O VALOR quando aparece na tela (0 → 128)
// =====================================================================
import { useEffect, useRef, useState } from "react";

export default function ContadorAnimado({ valor }: { valor: number }) {
  const caixa = useRef<HTMLSpanElement>(null);
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const inicio = performance.now();
      const passo = (t: number) => {
        const p = Math.min(1, (t - inicio) / 1400);
        setMostrado(Math.round(valor * (1 - Math.pow(1 - p, 3)))); // desacelera no fim
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [valor]);

  return <span ref={caixa}>{mostrado.toLocaleString("pt-BR")}</span>;
}
