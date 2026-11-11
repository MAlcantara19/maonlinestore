"use client";
// =====================================================================
// Lista dos produtos favoritados (busca no banco pelos ids guardados).
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { alternarFavorito, usarFavoritos } from "@/lib/favoritos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Produto } from "@/lib/tipos";
import CardDoProduto from "@/components/CardDoProduto";

const COLUNAS = "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, previa_cor, personalizacao, tempo_min, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";

export default function ListaFavoritos({ slug, lojaId, cor }: { slug: string; lojaId: string; cor: string }) {
  const meus = usarFavoritos(slug);
  // 🎁 Lista compartilhada: /vitraforma/favoritos?lista=id1,id2 (lista de presentes/desejos de alguém)
  const [compartilhada, setCompartilhada] = useState<string[] | null>(null);
  useEffect(() => {
    const l = new URLSearchParams(window.location.search).get("lista");
    if (l) setCompartilhada(l.split(",").filter(Boolean).slice(0, 60));
  }, []);
  const ids = compartilhada ?? meus;
  const [aviso, setAviso] = useState("");
  async function compartilhar() {
    const url = `${window.location.origin}/${slug}/favoritos?lista=${meus.join(",")}`;
    const texto = "🎁 Minha lista de desejos — se quiser me dar um presente, é por aqui 😊";
    if (navigator.share) await navigator.share({ title: "Minha lista", text: texto, url }).catch(() => {});
    else { await navigator.clipboard.writeText(`${texto}\n${url}`).catch(() => {}); setAviso("✓ Link copiado!"); }
  }
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
    <>
    {compartilhada ? (
      <div className="mt-3 rounded-2xl p-4 text-white" style={{ background: cor }}>
        <b className="text-lg">🎁 Lista de desejos compartilhada</b>
        <p className="text-sm opacity-90">Toque no ＋ de um produto para colocar no carrinho e presentear. 💜</p>
        <button type="button" className="mt-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold" style={{ color: cor }}
          onClick={() => { compartilhada.forEach((id) => { if (!meus.includes(id)) alternarFavorito(slug, id); }); setAviso("✓ Salvos nos seus favoritos!"); }}>
          ❤️ Salvar todos nos meus favoritos
        </button>
      </div>
    ) : (
      <button type="button" onClick={compartilhar} className="mt-3 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: cor }}>
        📤 Compartilhar minha lista (presentes / desejos)
      </button>
    )}
    {aviso && <p className="mt-2 text-sm">{aviso}</p>}
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
      {produtos.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
    </div>
    </>
  );
}
