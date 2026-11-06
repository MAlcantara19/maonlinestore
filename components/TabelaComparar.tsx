"use client";
// Tabela lado a lado dos produtos marcados para comparar.
import Link from "next/link";
import { useEffect, useState } from "react";
import { alternarComparar, usarComparar } from "@/lib/comparar";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco, precoMinimo, textoDisponibilidade } from "@/lib/formato";
import { estoqueTotal } from "@/lib/estoque";
import { emOrdem } from "@/lib/opcoes";
import type { Produto } from "@/lib/tipos";

const COLUNAS = "id, nome, descricao, preco, disponibilidade, prazo, estoque, promocao_pct, promocao_ate, categoria_id, variacoes(id, tipo, nome, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), midias(id, tipo, url, ordem)";

export default function TabelaComparar({ slug, lojaId, cor }: { slug: string; lojaId: string; cor: string }) {
  const ids = usarComparar(slug);
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  useEffect(() => {
    if (!ids.length) { setProdutos([]); return; }
    supabaseNavegador().from("produtos").select(COLUNAS).eq("loja_id", lojaId).in("id", ids)
      .then(({ data }: { data: Produto[] | null }) => setProdutos((data ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))));
  }, [ids, lojaId]);

  if (!produtos) return <p className="mt-4 opacity-60">Carregando...</p>;
  if (!produtos.length) return <p className="mt-6 opacity-70">Nenhum produto marcado. Na página de um produto, toque em “⚖️ Comparar”.</p>;

  const linhas: [string, (p: Produto) => React.ReactNode][] = [
    ["Preço", (p) => { const m = precoMinimo(p); return m != null ? <b style={{ color: cor }}>{formatarPreco(m)}</b> : "Sob consulta"; }],
    ["Situação", (p) => textoDisponibilidade(p.disponibilidade)],
    ["Prazo", (p) => p.prazo ?? "—"],
    ["Tamanhos", (p) => emOrdem(p.variacoes.filter((v) => v.ativa && v.tamanho).map((v) => v.tamanho!)).join(", ") || "—"],
    ["Cores", (p) => emOrdem(p.variacoes.filter((v) => v.ativa && v.cor).map((v) => v.cor!)).join(", ") || "—"],
    ["Opções / kits", (p) => [...new Set(p.variacoes.filter((v) => v.ativa && v.nome).map((v) => v.nome))].join(", ") || "—"],
    ["Estoque", (p) => { const e = estoqueTotal(p); return e == null ? "—" : e === 0 ? "Esgotado" : `${e} un.`; }],
  ];
  const capa = (p: Produto) => [...p.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0]?.url;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-2 text-sm">
        <thead>
          <tr>
            <th />
            {produtos.map((p) => (
              <th key={p.id} className="w-1/4 align-top">
                <Link href={`/${slug}/p/${p.id}`} className="block">
                  <span className="block aspect-square overflow-hidden rounded-xl bg-black/5">{capa(p) && <img src={capa(p)} alt="" className="h-full w-full object-cover" />}</span>
                  <span className="mt-1 block font-bold">{p.nome}</span>
                </Link>
                <button type="button" onClick={() => alternarComparar(slug, p.id)} className="text-xs underline opacity-60">tirar</button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map(([rotulo, f]) => (
            <tr key={rotulo}>
              <td className="font-semibold opacity-70">{rotulo}</td>
              {produtos.map((p) => <td key={p.id} className="rounded-lg bg-white/70 p-2 text-center">{f(p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
