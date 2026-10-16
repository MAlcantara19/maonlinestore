"use client";
// =====================================================================
// GALERIA DO PRODUTO — fotos e vídeos lado a lado.
// Celular: arrasta com o dedo. Computador: zoom ao passar o mouse.
// As bolinhas embaixo mostram qual foto está aparecendo (e dá para clicar).
// =====================================================================
import { useRef, useState } from "react";
import type { Midia } from "@/lib/tipos";

export default function Galeria({ midias, nome, cor }: { midias: Midia[]; nome: string; cor: string }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  // Ao arrastar, descobre qual foto está no centro.
  const aoRolar = () => {
    const el = trilho.current;
    if (el) setAtual(Math.round(el.scrollLeft / el.clientWidth));
  };
  const irPara = (i: number) => {
    const el = trilho.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (midias.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl text-sm opacity-80" style={{ background: `${cor}22` }}>
        sem foto
      </div>
    );
  }

  return (
    <div>
      <div ref={trilho} onScroll={aoRolar} className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none]">
        {midias.map((m) => (
          <div key={m.id} className="aspect-square w-full shrink-0 snap-center overflow-hidden">
            {m.tipo === "video" ? (
              // Vídeo curto em loop, sem som, rodando sozinho (ex.: produto girando 360)
              <video src={m.url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={m.url} alt={nome} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
            )}
          </div>
        ))}
      </div>

      {/* Bolinhas: a atual fica comprida e na cor da loja */}
      {midias.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {midias.map((m, i) => (
            <button key={m.id} type="button" onClick={() => irPara(i)} aria-label={`Ver foto ${i + 1}`}
              className="h-2.5 rounded-full transition-all duration-300"
              style={{ width: i === atual ? 24 : 10, background: i === atual ? cor : "#0003" }} />
          ))}
        </div>
      )}
    </div>
  );
}
