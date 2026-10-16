"use client";
// =====================================================================
// CARRINHO FLUTUANTE + CARRINHO LATERAL
//   - Botão redondo 🛒 no canto inferior direito, com a quantidade.
//     É o "alvo" da miniatura que voa (id="alvo-carrinho") e dá um
//     pulinho quando um item entra.
//   - Ao clicar (ou depois do voo), o carrinho desliza da direita,
//     sem sair da página.
// =====================================================================
import { useEffect, useRef, useState } from "react";
import { usarCarrinho } from "@/lib/carrinho";
import type { Loja } from "@/lib/tipos";
import Carrinho from "@/components/Carrinho";

export default function CarrinhoFlutuante({ loja }: { loja: Loja }) {
  const cor = loja.cor ?? "#333";
  const itens = usarCarrinho(loja.slug);
  const total = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const [aberto, setAberto] = useState(false);

  // Pulinho quando a quantidade aumenta.
  const anterior = useRef(total);
  const [pulando, setPulando] = useState(false);
  useEffect(() => {
    if (total > anterior.current) {
      setPulando(true);
      const t = setTimeout(() => setPulando(false), 600);
      anterior.current = total;
      return () => clearTimeout(t);
    }
    anterior.current = total;
  }, [total]);

  // Qualquer parte do site pode pedir para abrir o carrinho (evento "abrir-carrinho").
  useEffect(() => {
    const abrir = () => setAberto(true);
    window.addEventListener("abrir-carrinho", abrir);
    return () => window.removeEventListener("abrir-carrinho", abrir);
  }, []);

  // Carrinho aberto: a página de trás não rola, e Esc fecha.
  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", aoTeclar); };
  }, [aberto]);

  return (
    <>
      {/* Botão flutuante */}
      <button id="alvo-carrinho" type="button" onClick={() => setAberto(true)} aria-label={`Abrir carrinho (${total} itens)`}
        className={`fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-xl ${pulando ? "pular" : ""}`}
        style={{ background: cor, bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        🛒
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold shadow"
            style={{ color: cor }}>
            {total}
          </span>
        )}
      </button>

      {/* Fundo escuro */}
      <div onClick={() => setAberto(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${aberto ? "opacity-100" : "pointer-events-none opacity-0"}`} />

      {/* Painel que desliza da direita */}
      <aside role="dialog" aria-modal="true" aria-label="Carrinho"
        className={`fixed inset-y-0 right-0 z-50 flex w-[26rem] max-w-[92vw] flex-col bg-white text-stone-900 shadow-2xl transition-transform duration-300 ease-out ${aberto ? "translate-x-0" : "translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          {/* Logo + nome: deixa claro de qual loja é o carrinho */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white font-bold" style={{ borderColor: cor, color: cor }}>
              {loja.logo_url ? <img src={loja.logo_url} alt="" className="h-full w-full object-cover" /> : loja.nome.charAt(0)}
            </span>
            <div className="leading-tight">
              <b className="block text-lg" style={{ color: cor }}>🛒 Seu carrinho</b>
              <span className="text-xs opacity-60">{loja.nome}</span>
            </div>
          </div>
          <button type="button" onClick={() => setAberto(false)} aria-label="Fechar carrinho" className="rounded-full px-2 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <Carrinho loja={loja} />
        </div>
      </aside>
    </>
  );
}
