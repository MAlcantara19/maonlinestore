"use client";
// =====================================================================
// BOTÃO "VOLTAR AO TOPO" — aparece depois que a pessoa rola um pouco
// a página e, ao clicar, sobe suavemente até o início.
// =====================================================================
import { useEffect, useState } from "react";

export default function VoltarAoTopo({ cor }: { cor: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > 500); // depois de ~1 tela
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  if (!visivel) return null;

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-lg"
      // fica acima da barra "Ver carrinho"
      style={{ background: cor, bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      ↑
    </button>
  );
}