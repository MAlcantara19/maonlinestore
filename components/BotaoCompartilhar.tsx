"use client";
// =====================================================================
// BOTÃO COMPARTILHAR — no celular abre a lista do aparelho (WhatsApp,
// Instagram...). No computador, copia o link e avisa "Link copiado!".
// =====================================================================
import { useState } from "react";

export default function BotaoCompartilhar({ titulo, cor }: { titulo: string; cor: string }) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: titulo, text: `Olha que legal: ${titulo}`, url }); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  }

  return (
    <button type="button" onClick={compartilhar} className="rounded-full border px-4 py-2 text-sm font-medium"
      style={{ borderColor: cor, color: cor }}>
      {copiado ? "✓ Link copiado!" : "📤 Compartilhar"}
    </button>
  );
}
