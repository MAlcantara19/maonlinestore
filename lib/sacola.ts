// =====================================================================
// SACOLA ÚNICA — junta os carrinhos de TODAS as lojas (cada loja continua
// com o seu, porque cada uma tem o seu WhatsApp).
// =====================================================================
import { useEffect, useState } from "react";
import type { ItemCarrinho } from "@/lib/carrinho";

export type CarrinhoDaLoja = { slug: string; itens: ItemCarrinho[] };

export function lerTodosOsCarrinhos(): CarrinhoDaLoja[] {
  const lista: CarrinhoDaLoja[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i) ?? "";
      if (!chave.startsWith("carrinho:")) continue;
      const itens = JSON.parse(localStorage.getItem(chave) ?? "[]") as ItemCarrinho[];
      if (itens.length) lista.push({ slug: chave.slice("carrinho:".length), itens });
    }
  } catch {}
  return lista;
}

// "Gancho": todas as sacolas, sempre atualizadas
export function usarTodosOsCarrinhos() {
  const [lista, setLista] = useState<CarrinhoDaLoja[] | null>(null);
  useEffect(() => {
    const atualizar = () => setLista(lerTodosOsCarrinhos());
    atualizar();
    window.addEventListener("carrinho-mudou", atualizar);
    window.addEventListener("storage", atualizar);
    return () => { window.removeEventListener("carrinho-mudou", atualizar); window.removeEventListener("storage", atualizar); };
  }, []);
  return lista;
}
