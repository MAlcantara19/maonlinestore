// =====================================================================
// FAVORITOS ❤️ — guardados no aparelho do cliente (sem login), por loja.
// =====================================================================
import { useEffect, useState } from "react";
import { registrarEvento } from "@/lib/eventos";

const chave = (slug: string) => `favoritos:${slug}`;
const EVENTO = "favoritos-mudou";

export function lerFavoritos(slug: string): string[] {
  try { return JSON.parse(localStorage.getItem(chave(slug)) ?? "[]"); } catch { return []; }
}

// Liga/desliga o favorito. Devolve true se ficou favoritado.
export function alternarFavorito(slug: string, produtoId: string): boolean {
  const lista = lerFavoritos(slug);
  const agora = !lista.includes(produtoId);
  const nova = agora ? [produtoId, ...lista] : lista.filter((x) => x !== produtoId);
  try { localStorage.setItem(chave(slug), JSON.stringify(nova)); } catch {}
  window.dispatchEvent(new Event(EVENTO));
  if (agora) registrarEvento(slug, "favorito", produtoId);
  return agora;
}

// "Gancho": a lista de favoritos, sempre atualizada
export function usarFavoritos(slug: string) {
  const [lista, setLista] = useState<string[]>([]);
  useEffect(() => {
    const atualizar = () => setLista(lerFavoritos(slug));
    atualizar();
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => { window.removeEventListener(EVENTO, atualizar); window.removeEventListener("storage", atualizar); };
  }, [slug]);
  return lista;
}
