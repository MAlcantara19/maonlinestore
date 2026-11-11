"use client";
// =====================================================================
// 🖼️ BANNER ROTATIVO DE PROMOÇÕES (topo da loja) — troca sozinho a cada
// 5 segundos, com bolinhas e arrastar para o lado. Cadastro: Configurações
// da loja → "Banner rotativo".
// =====================================================================
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/tipos";

export default function BannerRotativo({ slides, cor }: { slides: Slide[]; cor: string }) {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const toque = useRef<number | null>(null);
  const total = slides.length;

  useEffect(() => {
    if (total < 2 || pausado) return;
    const t = setInterval(() => setAtual((a) => (a + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total, pausado]);
  if (!total) return null;
  const ir = (d: number) => setAtual((a) => (a + d + total) % total);

  return (
    <div className="relative mt-2 overflow-hidden rounded-3xl shadow-lg" style={{ aspectRatio: "16 / 6" }}
      onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (toque.current == null) return; const dx = e.changedTouches[0].clientX - toque.current; if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1); toque.current = null; }}>
      {slides.map((s, i) => {
        const conteudo = (
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === atual ? 1 : 0, pointerEvents: i === atual ? "auto" : "none" }}>
            {s.imagem ? <img src={s.imagem} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}99)` }} />}
            {(s.titulo || s.texto) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white sm:p-6">
                {s.titulo && <b className="block text-xl drop-shadow sm:text-3xl">{s.titulo}</b>}
                {s.texto && <span className="block text-sm opacity-90 sm:text-base">{s.texto}</span>}
              </div>
            )}
          </div>
        );
        return s.link ? <Link key={i} href={s.link}>{conteudo}</Link> : <div key={i}>{conteudo}</div>;
      })}
      {total > 1 && (
        <>
          <button type="button" onClick={() => ir(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-white/70 sm:block">‹</button>
          <button type="button" onClick={() => ir(1)} aria-label="Próximo" className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-white/70 sm:block">›</button>
          <div className="absolute bottom-2 right-3 flex gap-1.5">
            {slides.map((_, i) => <button key={i} type="button" onClick={() => setAtual(i)} aria-label={`Slide ${i + 1}`} className="h-2 rounded-full bg-white transition-all" style={{ width: i === atual ? 18 : 8, opacity: i === atual ? 1 : 0.6 }} />)}
          </div>
        </>
      )}
    </div>
  );
}
