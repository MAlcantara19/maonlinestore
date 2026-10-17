"use client";
// =====================================================================
// VISUALIZADOR 3D DA FOTO — arraste para "girar" a foto em 3D, use a
// rodinha do mouse ou os botões para dar zoom, duplo clique volta ao
// normal. Fica "flutuando" de leve quando ninguém está mexendo.
// =====================================================================
import { useRef, useState } from "react";

export default function Visualizador3D({ src, alt, cor }: { src: string; alt: string; cor: string }) {
  const [giro, setGiro] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [mexendo, setMexendo] = useState(false);
  const inicio = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const limitar = (v: number, max: number) => Math.max(-max, Math.min(max, v));
  const mudarZoom = (d: number) => setZoom((z) => Math.max(1, Math.min(3, +(z + d).toFixed(2))));

  return (
    <div className="relative select-none">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-black/5"
        style={{ perspective: 900, touchAction: "none", cursor: mexendo ? "grabbing" : "grab" }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); inicio.current = { px: e.clientX, py: e.clientY, ...giro }; setMexendo(true); }}
        onPointerMove={(e) => {
          if (!inicio.current) return;
          setGiro({ x: limitar(inicio.current.x + (e.clientX - inicio.current.px) / 4, 35), y: limitar(inicio.current.y - (e.clientY - inicio.current.py) / 4, 25) });
        }}
        onPointerUp={() => { inicio.current = null; setMexendo(false); }}
        onWheel={(e) => mudarZoom(e.deltaY < 0 ? 0.15 : -0.15)}
        onDoubleClick={() => { setGiro({ x: 0, y: 0 }); setZoom(zoom > 1 ? 1 : 2); }}>
        {/* Fundo desfocado da própria foto */}
        <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
        <img src={src} alt={alt} draggable={false}
          className={`relative h-full w-full object-contain drop-shadow-2xl ${!mexendo && giro.x === 0 && giro.y === 0 && zoom === 1 ? "flutuar" : ""}`}
          style={{ transform: `rotateY(${giro.x}deg) rotateX(${giro.y}deg) scale(${zoom})`, transition: mexendo ? "none" : "transform .4s ease-out" }} />
      </div>
      {/* Controles */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {[["−", () => mudarZoom(-0.3)], ["+", () => mudarZoom(0.3)], ["↺", () => { setGiro({ x: 0, y: 0 }); setZoom(1); }]].map(([t, f]) => (
          <button key={t as string} type="button" onClick={f as () => void} className="h-8 w-8 rounded-full bg-white/90 text-sm font-bold shadow" style={{ color: cor }}>{t as string}</button>
        ))}
      </div>
      <p className="mt-1 text-center text-xs opacity-60">👆 Arraste para girar · role ou use + − para dar zoom</p>
    </div>
  );
}
