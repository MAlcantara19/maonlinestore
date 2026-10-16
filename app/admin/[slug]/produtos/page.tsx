"use client";
// =====================================================================
// PAINEL — PRODUTOS DA LOJA (endereço: /admin/vitraforma/produtos)
// Lista com foto, preço e situação; busca; botão "+ Novo produto".
// =====================================================================
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco, precoMinimo } from "@/lib/formato";
import type { Produto } from "@/lib/tipos";

export default function PainelProdutos() {
  return <AreaAdmin>{() => <Lista />}</AreaAdmin>;
}

function Lista() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [produtos, setProdutos] = useState<(Produto & { ativo: boolean })[] | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
      const l = await lojaPeloSlug(slug);
      setLoja(l);
      if (!l) return;
      const { data } = await supabaseNavegador().from("produtos")
        .select("id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ativo, variacoes(id, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem), midias(id, tipo, url, ordem)")
        .eq("loja_id", l.id).order("criado_em", { ascending: false });
      setProdutos((data ?? []) as (Produto & { ativo: boolean })[]);
    })();
  }, [slug]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const lista = (produtos ?? []).filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔍 Buscar produto..."
          className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm" />
        <Link href={`/admin/${slug}/produtos/novo`} className="clicavel rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: cor }}>
          + Novo produto
        </Link>
      </div>

      {!produtos ? <p className="opacity-60">Carregando produtos...</p> : lista.length === 0 ? <p className="opacity-70">Nenhum produto encontrado.</p> : (
        <div className="space-y-2">
          {lista.map((p) => {
            const foto = [...p.midias].sort((a, b) => a.ordem - b.ordem).find((m) => m.tipo === "foto");
            const preco = precoMinimo(p);
            return (
              <Link key={p.id} href={`/admin/${slug}/produtos/${p.id}`}
                className={`clicavel flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-sm ${p.ativo ? "" : "opacity-50"}`}>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[10px]" style={{ background: `${cor}22` }}>
                  {foto ? <img src={foto.url} alt="" className="h-full w-full object-cover" /> : "sem foto"}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{p.nome}</b>
                  <span className="text-xs opacity-60">
                    {preco != null ? formatarPreco(preco) : "Sob consulta"} · {p.variacoes.length} variações · {p.midias.length} fotos/vídeos
                  </span>
                </span>
                {!p.ativo && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Oculto</span>}
                {p.destaque && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">⭐</span>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
