"use client";
// =====================================================================
// Conta UMA visita por página a cada sessão (para as estatísticas).
// Não aparece nada na tela.
// =====================================================================
import { useEffect } from "react";
import { registrarEvento } from "@/lib/eventos";

export default function RegistrarVisita({ slug, produtoId }: { slug: string; produtoId?: string }) {
  useEffect(() => {
    const marca = `visto:${slug}:${produtoId ?? "loja"}`;
    try { if (sessionStorage.getItem(marca)) return; sessionStorage.setItem(marca, "1"); } catch {}
    registrarEvento(slug, produtoId ? "visita_produto" : "visita_loja", produtoId);
  }, [slug, produtoId]);
  return null;
}
