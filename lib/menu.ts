// =====================================================================
// MENU RÁPIDO DA LOJA — a linha de atalhos embaixo do banner
// (✨ Natal · ⭐ Destaques · Brinquedos · Decoração · ...).
// Só entra no menu o que tiver pelo menos um produto, para não ter
// atalho levando a uma seção vazia.
// =====================================================================
import { supabase } from "@/lib/supabase";
import type { Categoria, Colecao } from "@/lib/tipos";

// id = âncora da seção na página; filhos = subcategorias (só nas categorias)
export type ItemMenu = { id: string; rotulo: string; filhos?: ItemMenu[] };

// O mínimo que precisamos saber de cada produto para montar o menu.
type ProdutoResumo = { id: string; categoria_id: string | null; destaque: boolean };

export function montarMenu(categorias: Categoria[], colecoes: Colecao[], produtos: ProdutoResumo[]): ItemMenu[] {
  const idsProdutos = new Set(produtos.map((p) => p.id));
  const colecaoTemProduto = (c: Colecao) => c.produtos_colecoes.some((pc) => idsProdutos.has(pc.produto_id));
  const itens: ItemMenu[] = [];

  // 1) Coleções em destaque (ex.: Natal) vêm primeiro
  colecoes.filter((c) => c.em_destaque && colecaoTemProduto(c))
    .forEach((c) => itens.push({ id: `colecao-${c.id}`, rotulo: `✨ ${c.nome}` }));

  // 2) Destaques
  if (produtos.some((p) => p.destaque)) itens.push({ id: "destaques", rotulo: "⭐ Destaques" });

  // 3) Categorias principais (contando os produtos das subcategorias)
  categorias.filter((c) => !c.parent_id).forEach((cat) => {
    const subs = categorias.filter((s) => s.parent_id === cat.id);
    const ids = [cat.id, ...subs.map((s) => s.id)];
    if (produtos.some((p) => p.categoria_id && ids.includes(p.categoria_id))) {
      // Subcategorias que têm produto viram "filhos" (aparecem ao expandir no menu lateral)
      const filhos = subs
        .filter((s) => produtos.some((p) => p.categoria_id === s.id))
        .map((s) => ({ id: `sub-${s.id}`, rotulo: s.nome }));
      itens.push({ id: `categoria-${cat.id}`, rotulo: cat.nome, filhos });
    }
  });

  // 4) Coleções antigas/sem destaque (ex.: Santos, Dia das Crianças)
  colecoes.filter((c) => !c.em_destaque && colecaoTemProduto(c))
    .forEach((c) => itens.push({ id: `colecao-${c.id}`, rotulo: c.nome }));

  return itens;
}

// Versão que busca sozinha no banco (usada na página do produto e no carrinho).
export async function buscarMenuDaLoja(lojaId: string): Promise<ItemMenu[]> {
  const [cat, col, prod] = await Promise.all([
    supabase.from("categorias").select("id, nome, descricao, parent_id, ordem").eq("loja_id", lojaId).order("ordem"),
    supabase.from("colecoes").select("id, nome, descricao, em_destaque, produtos_colecoes(produto_id)")
      .eq("loja_id", lojaId).eq("ativa", true).order("ordem"),
    supabase.from("produtos").select("id, categoria_id, destaque").eq("loja_id", lojaId).eq("ativo", true),
  ]);
  return montarMenu((cat.data ?? []) as Categoria[], (col.data ?? []) as Colecao[], (prod.data ?? []) as ProdutoResumo[]);
}
