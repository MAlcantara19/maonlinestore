"use client";
// =====================================================================
// GALERIA DO PRODUTO — fotos e vídeos lado a lado.
//   - Celular: arrasta com o dedo (com um leve "borrão de movimento")
//   - Computador: zoom ao passar o mouse
//   - Clicou na foto: abre em TELA CHEIA, crescendo, com fundo escuro
//   - Bolinhas "líquidas": a atual se estica com efeito elástico
// =====================================================================
import { useEffect, useRef, useState } from "react";
import type { Midia } from "@/lib/tipos";

export default function Galeria({ midias, nome, cor, produtoId }: { midias: Midia[]; nome: string; cor: string; produtoId?: string }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [rolando, setRolando] = useState(false);
  const [telaCheia, setTelaCheia] = useState<number | null>(null);
  const parar = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Ao arrastar: descobre a foto do centro e liga o borrão por um instante
  const aoRolar = () => {
    const el = trilho.current;
    if (!el) return;
    setAtual(Math.round(el.scrollLeft / el.clientWidth));
    setRolando(true);
    clearTimeout(parar.current);
    parar.current = setTimeout(() => setRolando(false), 120);
  };
  const irPara = (i: number) => {
    const el = trilho.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Escolheu uma cor (evento vindo da escolha do produto)? Pula para a foto daquela cor
  useEffect(() => {
    const aoEscolher = (e: Event) => {
      const { produto, cor: escolhida } = (e as CustomEvent<{ produto: string; cor: string | null }>).detail;
      if (produto !== produtoId || !escolhida) return;
      const i = midias.findIndex((m) => m.cor && m.cor.toLowerCase().trim() === escolhida.toLowerCase().trim());
      const el = trilho.current;
      if (i >= 0 && el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    };
    window.addEventListener("cor-escolhida", aoEscolher);
    return () => window.removeEventListener("cor-escolhida", aoEscolher);
  }, [midias, produtoId]);

  // Tela cheia: Esc fecha, setas trocam a foto
  useEffect(() => {
    if (telaCheia === null) return;
    document.body.style.overflow = "hidden";
    const teclas = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTelaCheia(null);
      if (e.key === "ArrowRight") setTelaCheia((i) => (i === null ? i : (i + 1) % midias.length));
      if (e.key === "ArrowLeft") setTelaCheia((i) => (i === null ? i : (i - 1 + midias.length) % midias.length));
    };
    window.addEventListener("keydown", teclas);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", teclas); };
  }, [telaCheia, midias.length]);

  if (midias.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl text-sm opacity-80 md:aspect-square" style={{ background: `${cor}22` }}>
        sem foto
      </div>
    );
  }

  const naTela = telaCheia !== null ? midias[telaCheia] : null;

  return (
    <div>
      <div ref={trilho} onScroll={aoRolar} className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none]"
        style={{ filter: rolando ? "blur(1.5px)" : "none", transition: "filter .15s" }}>
        {midias.map((m, i) => (
          <div key={m.id} className="relative flex aspect-[4/5] w-full shrink-0 snap-center items-center justify-center overflow-hidden bg-black/5 md:aspect-square">
            {/* Fundo desfocado (preenche as sobras sem cortar a foto) */}
            {m.tipo === "foto" && <img src={m.url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />}
            {m.tipo === "video" ? (
              // Vídeo curto em loop, sem som, rodando sozinho (ex.: produto girando 360)
              <video src={m.url} autoPlay muted loop playsInline className="relative h-full w-full object-contain" />
            ) : (
              <button type="button" onClick={() => setTelaCheia(i)} className="relative h-full w-full cursor-zoom-in" aria-label="Ver foto em tela cheia">
                <img src={m.url} alt={nome} className="h-full w-full object-contain transition-transform duration-500 hover:scale-105" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bolinhas "líquidas": a atual estica com efeito elástico */}
      {midias.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {midias.map((m, i) => (
            <button key={m.id} type="button" onClick={() => irPara(i)} aria-label={`Ver foto ${i + 1}`}
              className="h-2.5 rounded-full"
              style={{ width: i === atual ? 28 : 10, background: i === atual ? cor : "#0003", transition: "all .45s cubic-bezier(.68,-0.55,.27,1.55)" }} />
          ))}
        </div>
      )}

      {/* TELA CHEIA */}
      {naTela && (
        <div className="surgir fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setTelaCheia(null)} role="dialog" aria-modal="true">
          <img key={naTela.url} src={naTela.url} alt={nome} className="ampliar max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setTelaCheia(null)} aria-label="Fechar" className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-xl text-white">✕</button>
          {midias.length > 1 && (
            <>
              <button type="button" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setTelaCheia((telaCheia! - 1 + midias.length) % midias.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-2xl text-white">‹</button>
              <button type="button" aria-label="Próxima" onClick={(e) => { e.stopPropagation(); setTelaCheia((telaCheia! + 1) % midias.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-2xl text-white">›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
