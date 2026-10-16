// =====================================================================
// AJUDANTES DO PAINEL
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";

export type LojaResumo = { id: string; slug: string; nome: string; cor: string | null };

// Busca a loja pelo endereço (slug) — usada nas telas do painel.
export async function lojaPeloSlug(slug: string): Promise<LojaResumo | null> {
  const { data } = await supabaseNavegador().from("lojas").select("id, slug, nome, cor").eq("slug", slug).maybeSingle();
  return (data as LojaResumo | null) ?? null;
}

// Texto -> número (aceita "25,90"). Vazio = null.
export function paraNumero(texto: string): number | null {
  const limpo = texto.replace(/\s/g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}
