"use client";
// =====================================================================
// Lista dos produtos favoritados (busca no banco pelos ids guardados).
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { usarFavoritos } from "@/lib/favoritos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Produto } from "@/lib/tipos";
import CardDoProduto from "@/components/CardDoProduto";

const COLUNAS = "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";

export default function ListaFavoritos({ slug, lojaId, cor }: { slug: string; lojaId: string; cor: string }) {
  const ids = usarFavoritos(slug);
  const [produtos, setProdutos] = useState<Produto[] | null>(null);

  useEffect(() => {
    if (!ids.length) { setProdutos([]); return; }
    supabaseNavegador().from("produtos").select(COLUNAS).eq("loja_id", lojaId).eq("ativo", true).is("excluido_em", null).in("id", ids)
      .then(({ data }: { data: Produto[] | null }) => setProdutos((data ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))));
  }, [ids, lojaId]);

  if (!produtos) return <p className="mt-4 opacity-60">Carregando...</p>;
  if (!produtos.length) {
    return (
      <div className="mt-8 text-center">
        <p className="text-4xl">🤍</p>
        <p className="opacity-70">Você ainda não favoritou nada. Toque no coração dos produtos que gostar!</p>
        <Link href={`/${slug}`} className="mt-3 inline-block font-semibold underline">Ver produtos</Link>
      </div>
    );
  }
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
      {produtos.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
    </div>
  );
}
