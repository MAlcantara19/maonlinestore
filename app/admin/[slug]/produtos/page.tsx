"use client";
// =====================================================================
// PAINEL — PRODUTOS DA LOJA (endereço: /admin/vitraforma/produtos)
//   Produtos: lista com foto, preço e situação; busca; "+ Novo produto".
//   🗑️ Lixeira: produtos excluídos nos últimos 15 dias. Dá para
//   RESTAURAR ou apagar de vez. Depois de 15 dias, somem sozinhos.
// =====================================================================
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco, precoMinimo } from "@/lib/formato";
import type { Produto } from "@/lib/tipos";

const DIAS_NA_LIXEIRA = 15;
type ProdutoAdmin = Produto & { ativo: boolean; excluido_em: string | null };

export default function PainelProdutos() {
  return <AreaAdmin>{() => <Lista />}</AreaAdmin>;
}

function Lista() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [produtos, setProdutos] = useState<ProdutoAdmin[] | null>(null);
  const [busca, setBusca] = useState("");
  const [verLixeira, setVerLixeira] = useState(false);

  const carregar = useCallback(async (l: LojaResumo) => {
    const supabase = supabaseNavegador();
    // Limpeza automática: apaga de vez o que está na lixeira há mais de 15 dias
    const limite = new Date(Date.now() - DIAS_NA_LIXEIRA * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("produtos").delete().eq("loja_id", l.id).lt("excluido_em", limite);

    const { data } = await supabase.from("produtos")
      .select("id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ativo, excluido_em, variacoes(id, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem), midias(id, tipo, url, ordem)")
      .eq("loja_id", l.id).order("criado_em", { ascending: false });
    setProdutos((data ?? []) as ProdutoAdmin[]);
  }, []);

  useEffect(() => {
    lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); });
  }, [slug, carregar]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const naLixeira = (produtos ?? []).filter((p) => p.excluido_em);
  const lista = (produtos ?? [])
    .filter((p) => (verLixeira ? p.excluido_em : !p.excluido_em))
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  async function restaurar(p: ProdutoAdmin) {
    await supabaseNavegador().from("produtos").update({ excluido_em: null }).eq("id", p.id);
    if (loja) carregar(loja);
  }
  async function apagarDeVez(p: ProdutoAdmin) {
    if (!confirm(`Apagar "${p.nome}" PARA SEMPRE? Isso não tem volta.`)) return;
    await supabaseNavegador().from("produtos").delete().eq("id", p.id);
    if (loja) carregar(loja);
  }
  const diasRestantes = (data: string) =>
    Math.max(0, DIAS_NA_LIXEIRA - Math.floor((Date.now() - new Date(data).getTime()) / (24 * 60 * 60 * 1000)));

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔍 Buscar produto..."
          className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm" />
        <button type="button" onClick={() => setVerLixeira(!verLixeira)} className="rounded-xl border bg-white px-4 py-2.5 text-sm">
          {verLixeira ? "← Produtos" : `🗑️ Lixeira (${naLixeira.length})`}
        </button>
        {!verLixeira && (
          <Link href={`/admin/${slug}/produtos/novo`} className="clicavel rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: cor }}>
            + Novo produto
          </Link>
        )}
      </div>

      {verLixeira && <p className="mb-3 text-sm opacity-70">Produtos excluídos ficam aqui por {DIAS_NA_LIXEIRA} dias. Depois são apagados de vez.</p>}

      {!produtos ? <p className="opacity-60">Carregando produtos...</p> : lista.length === 0 ? (
        <p className="opacity-70">{verLixeira ? "A lixeira está vazia. 🎉" : "Nenhum produto encontrado."}</p>
      ) : (
        <div className="space-y-2">
          {lista.map((p) => {
            const foto = [...p.midias].sort((a, b) => a.ordem - b.ordem).find((m) => m.tipo === "foto");
            const preco = precoMinimo(p);
            const miniatura = (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[10px]" style={{ background: `${cor}22` }}>
                {foto ? <img src={foto.url} alt="" className="h-full w-full object-cover" /> : "sem foto"}
              </span>
            );

            // Na lixeira: restaurar ou apagar de vez
            if (verLixeira) {
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-2 pr-3 shadow-sm">
                  {miniatura}
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{p.nome}</b>
                    <span className="text-xs text-red-600">Apagado de vez em {diasRestantes(p.excluido_em!)} dias</span>
                  </span>
                  <button type="button" onClick={() => restaurar(p)} className="rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">↩️ Restaurar</button>
                  <button type="button" onClick={() => apagarDeVez(p)} className="rounded-full border border-red-300 px-3 py-1.5 text-sm text-red-600">Apagar de vez</button>
                </div>
              );
            }

            return (
              <Link key={p.id} href={`/admin/${slug}/produtos/${p.id}`}
                className={`clicavel flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-sm ${p.ativo ? "" : "opacity-50"}`}>
                {miniatura}
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
