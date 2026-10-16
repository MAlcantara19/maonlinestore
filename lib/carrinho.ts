// =====================================================================
// CARRINHO — guardado no navegador do próprio cliente (sem login).
// Cada loja tem o seu carrinho separado, porque cada uma tem o seu
// WhatsApp: o pedido da VitraForma não se mistura com o do Chocolate.
// =====================================================================
import { useEffect, useState } from "react";

// Um item do carrinho: produto + a variação escolhida + quantidade.
export type ItemCarrinho = {
  chave: string; // identifica o item: id do produto + id da variação
  produtoId: string;
  nome: string;
  tamanho: string | null;
  cor: string | null;
  preco: number | null; // preço de UMA unidade (vazio = sob consulta)
  quantidade: number;
  observacao: string; // ex.: "cor rosa, com o nome Ana"
  prazo: string | null;
};

// Nome usado para guardar no navegador: "carrinho:vitraforma", "carrinho:chocolate"...
const nomeGuardado = (slug: string) => `carrinho:${slug}`;
const EVENTO = "carrinho-mudou"; // avisa a página quando o carrinho muda

export function lerCarrinho(slug: string): ItemCarrinho[] {
  try {
    return JSON.parse(localStorage.getItem(nomeGuardado(slug)) ?? "[]");
  } catch {
    return []; // se algo der errado, começa vazio em vez de quebrar a página
  }
}

export function salvarCarrinho(slug: string, itens: ItemCarrinho[]) {
  try {
    localStorage.setItem(nomeGuardado(slug), JSON.stringify(itens));
  } catch {
    // navegador sem espaço ou em modo restrito: só não guarda
  }
  window.dispatchEvent(new Event(EVENTO));
}

// Se o mesmo item (mesma variação e mesma observação) já estiver lá, soma a quantidade.
export function adicionarAoCarrinho(slug: string, novo: ItemCarrinho) {
  const itens = lerCarrinho(slug);
  const igual = itens.find((i) => i.chave === novo.chave && i.observacao === novo.observacao);
  if (igual) igual.quantidade += novo.quantidade;
  else itens.push(novo);
  salvarCarrinho(slug, itens);
  // Avisa outras partes do site que um item entrou (útil para efeitos futuros)
  window.dispatchEvent(new CustomEvent("item-adicionado", { detail: novo.nome }));
}

// "Gancho" do React: devolve os itens e se atualiza sozinho quando o carrinho muda.
export function usarCarrinho(slug: string) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  useEffect(() => {
    const atualizar = () => setItens(lerCarrinho(slug));
    atualizar();
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar); // outra aba mudou o carrinho
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, [slug]);
  return itens;
}

// formatarPreco agora mora em lib/formato.ts (serve também para páginas do servidor)
export { formatarPreco } from "@/lib/formato";
