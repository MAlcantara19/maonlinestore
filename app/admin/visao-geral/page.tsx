"use client";
// =====================================================================
// PAINEL DO MASTER — VISÃO GERAL (endereço: /admin/visao-geral)
// Todas as lojas juntas no mês: pedidos, vendido, entradas, saídas,
// saldo e a comissão/repasse da MA (quando houver %).
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco } from "@/lib/formato";

type LojaV = { id: string; slug: string; nome: string; cor: string | null; logo_url: string | null; comissao_pct: number | null };
type Linha = LojaV & { pedidos: number; vendido: number; entradas: number; saidas: number; vendas: number };

export default function VisaoGeral() {
  return <AreaAdmin>{(info) => (info.master ? <Conteudo /> : <p>Só o administrador master vê esta página.</p>)}</AreaAdmin>;
}

function Conteudo() {
  const [mes, setMes] = useState(new Date().toLocaleDateString("sv-SE").slice(0, 7));
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    (async () => {
      setLinhas(null);
      const sb = supabaseNavegador();
      const [ano, m] = mes.split("-").map(Number);
      const fim = `${mes}-${new Date(ano, m, 0).getDate()}`;
      const [l, mv, pd] = await Promise.all([
        sb.from("lojas").select("id, slug, nome, cor, logo_url, comissao_pct").order("ordem"),
        sb.from("movimentacoes").select("loja_id, tipo, valor, categoria, pago").gte("data", `${mes}-01`).lte("data", fim),
        sb.from("pedidos").select("loja_id, total").eq("tipo", "pedido").eq("teste", false).neq("status", "cancelado").gte("criado_em", `${mes}-01`).lte("criado_em", `${fim}T23:59:59`),
      ]);
      const movs = ((mv.data ?? []) as { loja_id: string; tipo: string; valor: number; categoria: string; pago: boolean }[]).filter((x) => x.pago !== false);
      const peds = (pd.data ?? []) as { loja_id: string; total: number | null }[];
      setLinhas(((l.data ?? []) as LojaV[]).map((lj) => {
        const daLoja = movs.filter((x) => x.loja_id === lj.id);
        const soma = (f: (x: (typeof movs)[number]) => boolean) => daLoja.filter(f).reduce((s, x) => s + Number(x.valor), 0);
        return {
          ...lj, pedidos: peds.filter((p) => p.loja_id === lj.id).length, vendido: peds.filter((p) => p.loja_id === lj.id).reduce((s, p) => s + Number(p.total ?? 0), 0),
          entradas: soma((x) => x.tipo === "entrada"), saidas: soma((x) => x.tipo === "saida"),
          vendas: soma((x) => x.tipo === "entrada" && ["venda", "sinal", "restante"].includes(x.categoria)),
        };
      }));
    })();
  }, [mes, recarregar]);

  const total = (k: keyof Linha) => (linhas ?? []).reduce((s, l) => s + Number(l[k] ?? 0), 0);
  const comissao = (l: Linha) => (l.comissao_pct ? (l.vendas * Number(l.comissao_pct)) / 100 : 0);
  const max = Math.max(1, ...(linhas ?? []).map((l) => l.entradas));

  return (
    <>
      <Link href="/admin" className="text-sm opacity-60">← Suas lojas</Link>
      <h1 className="mt-1 text-2xl font-bold">🌐 Visão geral — todas as lojas</h1>
      <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className="my-3 rounded-xl border bg-white px-3 py-2" />
      {!linhas ? <p className="opacity-60">Carregando...</p> : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["🧾 Pedidos", String(total("pedidos"))], ["🛍️ Vendido", formatarPreco(total("vendido"))], ["⬆️ Entradas", formatarPreco(total("entradas"))],
              ["🤝 Comissão MA", formatarPreco(linhas.reduce((s, l) => s + comissao(l), 0))]].map(([r, v]) => (
              <div key={r} className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs opacity-60">{r}</span><b className="block text-xl">{v}</b></div>
            ))}
          </div>
          <div className="space-y-2">
            {linhas.map((l) => (
              <div key={l.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="h-10 w-10 overflow-hidden rounded-full border-2 bg-white" style={{ borderColor: l.cor ?? "#ddd" }}>{l.logo_url && <img src={l.logo_url} alt="" className="h-full w-full object-cover" />}</span>
                  <Link href={`/admin/${l.slug}/financeiro`} className="flex-1 font-bold hover:underline">{l.nome}</Link>
                  <span className="text-sm">🧾 {l.pedidos} · 🛍️ {formatarPreco(l.vendido)}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full" style={{ width: `${(l.entradas / max) * 100}%`, background: l.cor ?? "#3B1260" }} /></div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-green-700">⬆️ {formatarPreco(l.entradas)}</span>
                  <span className="text-red-600">⬇️ {formatarPreco(l.saidas)}</span>
                  <b>= {formatarPreco(l.entradas - l.saidas)}</b>
                  <label className="ml-auto flex items-center gap-1 text-xs">🤝 Comissão
                    <input className="w-14 rounded border px-1 text-center" inputMode="decimal" defaultValue={l.comissao_pct ?? ""} placeholder="%"
                      onBlur={async (e) => { await supabaseNavegador().from("lojas").update({ comissao_pct: Number(e.target.value.replace(",", ".")) || null }).eq("id", l.id); setRecarregar((n) => n + 1); }} />%
                    {comissao(l) > 0 && <b className="ml-1">= {formatarPreco(comissao(l))}</b>}
                  </label>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs opacity-60">Comissão = % sobre as vendas recebidas no mês (entradas de venda, sinal e restante). Deixe vazio se a MA não cobra da loja.</p>
        </>
      )}
    </>
  );
}
