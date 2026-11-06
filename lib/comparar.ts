// =====================================================================
// COMPARAR PRODUTOS — até 4 por loja, guardados no aparelho.
// =====================================================================
import { useEffect, useState } from "react";

const chave = (slug: string) => `comparar:${slug}`;
export const lerComparar = (slug: string): string[] => { try { return JSON.parse(localStorage.getItem(chave(slug)) ?? "[]"); } catch { return []; } };
export function alternarComparar(slug: string, id: string) {
  const l = lerComparar(slug);
  const nova = l.includes(id) ? l.filter((x) => x !== id) : [...l, id].slice(-4);
  try { localStorage.setItem(chave(slug), JSON.stringify(nova)); } catch {}
  window.dispatchEvent(new Event("comparar-mudou"));
}
export function usarComparar(slug: string) {
  const [lista, setLista] = useState<string[]>([]);
  useEffect(() => {
    const at = () => setLista(lerComparar(slug));
    at(); window.addEventListener("comparar-mudou", at);
    return () => window.removeEventListener("comparar-mudou", at);
  }, [slug]);
  return lista;
}
