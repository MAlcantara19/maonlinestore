"use client";
// =====================================================================
// 🖼️ FUNDO QUE TROCA SOZINHO — várias imagens do banner da coleção,
// uma esmaecendo na outra a cada 5 segundos (com bolinhas para trocar).
// =====================================================================
import { useEffect, useState } from "react";

export default function FundoRotativo({ imagens }: { imagens: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (imagens.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % imagens.length), 5000);
    return () => clearInterval(t);
  }, [imagens.length]);
  return (
    <>
      {imagens.map((src, n) => (
        <div key={src} aria-hidden className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${JSON.stringify(src)})`, opacity: n === i ? 1 : 0 }} />
      ))}
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,.15))" }} />
      {imagens.length > 1 && (
        <div className="absolute bottom-3 right-4 z-10 flex gap-1.5">
          {imagens.map((src, n) => <button key={src} type="button" aria-label={`Imagem ${n + 1}`} onClick={() => setI(n)} className="h-2.5 w-2.5 rounded-full border border-white" style={{ background: n === i ? "#fff" : "transparent" }} />)}
        </div>
      )}
    </>
  );
}
