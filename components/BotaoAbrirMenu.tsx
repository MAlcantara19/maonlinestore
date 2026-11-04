"use client";
// Botão "☰ Menu" (só no celular): abre a gaveta com as categorias da loja.
export default function BotaoAbrirMenu({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("abrir-menu"))} aria-label="Abrir o menu da loja" className={className}>
      ☰ Menu
    </button>
  );
}
