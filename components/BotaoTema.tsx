"use client";
// =====================================================================
// BOTÃO MODO CLARO / ESCURO 🌙☀️
// Ao trocar, o novo tema se espalha num CÍRCULO a partir do botão
// ("cortina"), nos navegadores que suportam. A escolha fica salva.
// =====================================================================
import { useEffect, useState, type MouseEvent } from "react";

export default function BotaoTema({ className = "" }: { className?: string }) {
  const [escuro, setEscuro] = useState(false);
  useEffect(() => setEscuro(document.documentElement.dataset.tema === "escuro"), []);

  function alternar(e: MouseEvent<HTMLButtonElement>) {
    const novo = !escuro;
    const aplicar = () => {
      document.documentElement.dataset.tema = novo ? "escuro" : "claro";
      try { localStorage.setItem("tema", novo ? "escuro" : "claro"); } catch {}
      setEscuro(novo);
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return aplicar();
    // O círculo nasce exatamente onde a pessoa clicou
    document.documentElement.style.setProperty("--cortina-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--cortina-y", `${e.clientY}px`);
    doc.startViewTransition(aplicar);
  }

  return (
    <button type="button" onClick={alternar} aria-label={escuro ? "Mudar para o modo claro" : "Mudar para o modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"} className={className}>
      {escuro ? "☀️" : "🌙"}
    </button>
  );
}
