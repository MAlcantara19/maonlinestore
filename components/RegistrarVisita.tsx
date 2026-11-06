"use client";
// =====================================================================
// Conta UMA visita por página a cada sessão (para as estatísticas).
// Links de campanha: /vitraforma?origem=instagram → a visita fica marcada
// com a origem (aparece em 📊 Estatísticas → "De onde vieram").
// =====================================================================
import { useEffect } from "react";
import { registrarEvento } from "@/lib/eventos";

export default function RegistrarVisita({ slug, produtoId }: { slug: string; produtoId?: string }) {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const origem = (q.get("origem") ?? q.get("utm_source") ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
    const marca = `visto:${slug}:${produtoId ?? "loja"}`;
    try {
      if (origem) sessionStorage.setItem(`origem:${slug}`, origem);
      if (sessionStorage.getItem(marca)) return;
      sessionStorage.setItem(marca, "1");
    } catch {}
    let guardada: string | null = null;
    try { guardada = sessionStorage.getItem(`origem:${slug}`); } catch {}
    registrarEvento(slug, produtoId ? "visita_produto" : "visita_loja", produtoId, guardada ? `origem:${guardada}` : null);
  }, [slug, produtoId]);
  return null;
}
