"use client";
// =====================================================================
// BOTÃO DE FAVORITO ❤️ — o coração "pula" ao marcar.
// =====================================================================
import { useState } from "react";
import { alternarFavorito, usarFavoritos } from "@/lib/favoritos";

export default function BotaoFavorito({ slug, produtoId, className = "", comTexto = false }: { slug: string; produtoId: string; className?: string; comTexto?: boolean }) {
  const favoritos = usarFavoritos(slug);
  const ligado = favoritos.includes(produtoId);
  const [pulo, setPulo] = useState(0);

  return (
    <button type="button" aria-pressed={ligado} aria-label={ligado ? "Tirar dos favoritos" : "Adicionar aos favoritos"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); alternarFavorito(slug, produtoId); setPulo((n) => n + 1); }}
      className={`inline-flex items-center justify-center gap-1 ${className}`}>
      <span key={pulo} className={pulo ? "pular" : ""} style={{ color: ligado ? "#e11d48" : "currentColor" }}>{ligado ? "❤️" : "🤍"}</span>
      {comTexto && <span className="text-sm">{ligado ? "Favoritado" : "Favoritar"}</span>}
    </button>
  );
}
