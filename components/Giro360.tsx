"use client";
// =====================================================================
// GIRO 360° — as fotos do produto, tiradas girando ele em volta, viram
// um "objeto na mão": arraste para os lados e ele gira. Sozinho, gira
// devagar até a pessoa tocar.
// Como fotografar: celular parado, produto num prato/base que gira, uma
// foto a cada "pedacinho" de volta (de 12 a 36 fotos), mesma luz e fundo.
// =====================================================================
import { useEffect, useRef, useState } from "react";

export default function Giro360({ fotos, nome, cor }: { fotos: string[]; nome: string; cor: string }) {
  const [quadro, setQuadro] = useState(0);
  const [mexeu, setMexeu] = useState(false);
  const inicio = useRef<{ x: number; q: number } | null>(null);
  const total = fotos.length;

  // Carrega todas as fotos antes (o giro fica liso)
  useEffect(() => { fotos.forEach((f) => { const i = new Image(); i.src = f; }); }, [fotos]);

  // Gira sozinho, devagar, até a pessoa mexer
  useEffect(() => {
    if (mexeu) return;
    const t = setInterval(() => setQuadro((q) => (q + 1) % total), 160);
    return () => clearInterval(t);
  }, [mexeu, total]);

  return (
    <div className="select-none">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl" style={{ background: `${cor}12`, touchAction: "pan-y", cursor: "grab" }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); inicio.current = { x: e.clientX, q: quadro }; setMexeu(true); }}
        onPointerMove={(e) => {
          if (!inicio.current) return;
          const passos = Math.round((e.clientX - inicio.current.x) / 12); // 12px = 1 foto
          setQuadro((((inicio.current.q - passos) % total) + total) % total);
        }}
        onPointerUp={() => (inicio.current = null)}>
        <img src={fotos[quadro]} alt={`${nome} — giro 360°`} draggable={false} className="h-full w-full object-contain" />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">🔄 360°</span>
      </div>
      <p className="mt-1 text-center text-xs opacity-60">👆 Arraste para os lados para girar</p>
    </div>
  );
}
