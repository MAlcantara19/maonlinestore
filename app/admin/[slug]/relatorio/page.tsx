"use client";
// =====================================================================
// RELATÓRIO DO MÊS (endereço: /admin/vitraforma/relatorio?mes=2026-11)
// Uma página pronta para imprimir ou "Salvar como PDF": dinheiro que
// entrou e saiu, pedidos, ticket médio, produtos campeões e clientes.
// =====================================================================
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco } from "@/lib/formato";
import { FORMAS_PAGAMENTO, rotuloDe } from "@/lib/pagamento";

type Mov = { tipo: string; valor: number; categoria: string; forma_pagamento: string | null; pago?: boolean };
type Ped = { total: number | null; cliente_whatsapp: string | null; cliente_nome: string | null; criado_em: string; itens: { nome: string; quantidade: number; preco: number | null }[]; canal: string | null };

export default function Pagina() {
  return <Suspense fallback={null}><Relatorio /></Suspense>;
}

function Relatorio() {
  const { slug } = useParams<{ slug: string }>();
  const mes = useSearchParams().get("mes") ?? new Date().toLocaleDateString("sv-SE").slice(0, 7);
  const [dados, setDados] = useState<{ loja: { nome: string; cor: string | null; logo_url: string | null; meta_mensal: number | null }; movs: Mov[]; peds: Ped[]; antigos: Set<string> } | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const sb = supabaseNavegador();
      const { data: loja } = await sb.from("lojas").select("id, nome, cor, logo_url, meta_mensal").eq("slug", slug).maybeSingle();
      if (!loja) return setDados(null);
      const [ano, m] = mes.split("-").map(Number);
      const fim = `${mes}-${new Date(ano, m, 0).getDate()}`;
      const [r1, r2, r3] = await Promise.all([
        sb.from("movimentacoes").select("tipo, valor, categoria, forma_pagamento, pago").eq("loja_id", loja.id).gte("data", `${mes}-01`).lte("data", fim),
        sb.from("pedidos").select("total, cliente_whatsapp, cliente_nome, criado_em, itens, canal").eq("loja_id", loja.id).eq("tipo", "pedido").eq("teste", false).neq("status", "cancelado")
          .gte("criado_em", `${mes}-01`).lte("criado_em", `${fim}T23:59:59`),
        sb.from("pedidos").select("cliente_whatsapp").eq("loja_id", loja.id).eq("teste", false).lt("criado_em", `${mes}-01`).not("cliente_whatsapp", "is", null),
      ]);
      setDados({ loja, movs: ((r1.data ?? []) as Mov[]).filter((x) => x.pago !== false), peds: (r2.data ?? []) as Ped[],
        antigos: new Set(((r3.data ?? []) as { cliente_whatsapp: string }[]).map((x) => x.cliente_whatsapp.slice(-9))) });
    })();
  }, [slug, mes]);

  if (dados === undefined) return <p className="p-8 opacity-60">Carregando...</p>;
  if (!dados) return <p className="p-8">Sem acesso (entre no painel neste aparelho).</p>;
  const { loja, movs, peds, antigos } = dados;
  const cor = loja.cor ?? "#333";
  const soma = (tipo: string) => movs.filter((x) => x.tipo === tipo).reduce((s, x) => s + Number(x.valor), 0);
  const entradas = soma("entrada"), saidas = soma("saida");
  const vendido = peds.reduce((s, p) => s + Number(p.total ?? 0), 0);
  const agrupar = (lista: [string, number][]) => { const m = new Map<string, number>(); lista.forEach(([k, v]) => m.set(k, (m.get(k) ?? 0) + v)); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const campeoes = agrupar(peds.flatMap((p) => p.itens.map((i) => [i.nome, Number(i.quantidade)] as [string, number]))).slice(0, 8);
  const clientes = new Set(peds.map((p) => p.cliente_whatsapp?.slice(-9) ?? p.cliente_nome ?? "").filter(Boolean));
  const novos = [...clientes].filter((c) => /^\d{9}$/.test(c) && !antigos.has(c)).length;
  const nomeMes = new Date(`${mes}-15`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const caixa = "rounded-xl border p-3";

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-stone-900">
      <style>{`@media print { .nao-imprimir { display: none !important; } @page { margin: 12mm; } }`}</style>
      <div className="nao-imprimir mb-4 flex flex-wrap gap-2">
        <Link href={`/admin/${slug}/financeiro`} className="rounded-full border px-4 py-2 text-sm">← Financeiro</Link>
        <input type="month" defaultValue={mes} onChange={(e) => e.target.value && (window.location.search = `?mes=${e.target.value}`)} className="rounded-full border px-3 py-1.5 text-sm" />
        <button type="button" onClick={() => window.print()} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: cor }}>🖨️ Imprimir / salvar PDF</button>
      </div>

      <header className="flex items-center gap-3 border-b-4 pb-3" style={{ borderColor: cor }}>
        {loja.logo_url && <img src={loja.logo_url} alt="" className="h-14 w-14 rounded-full object-cover" />}
        <div><h1 className="text-2xl font-bold">{loja.nome}</h1><p className="capitalize opacity-70">Relatório de {nomeMes}</p></div>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className={caixa}><span className="text-xs opacity-60">Entradas</span><b className="block text-xl text-green-700">{formatarPreco(entradas)}</b></div>
        <div className={caixa}><span className="text-xs opacity-60">Saídas</span><b className="block text-xl text-red-600">{formatarPreco(saidas)}</b></div>
        <div className={caixa}><span className="text-xs opacity-60">Saldo</span><b className="block text-xl">{formatarPreco(entradas - saidas)}</b></div>
        <div className={caixa}><span className="text-xs opacity-60">Pedidos</span><b className="block text-xl">{peds.length}</b></div>
        <div className={caixa}><span className="text-xs opacity-60">Ticket médio</span><b className="block text-xl">{formatarPreco(peds.length ? vendido / peds.length : 0)}</b></div>
        <div className={caixa}><span className="text-xs opacity-60">Clientes novos</span><b className="block text-xl">{novos}</b></div>
      </section>
      {loja.meta_mensal ? <p className="mt-3 text-sm">🎯 Meta: {formatarPreco(Number(loja.meta_mensal))} — atingido <b>{Math.round((entradas / Number(loja.meta_mensal)) * 100)}%</b></p> : null}

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className={caixa}>
          <b>🏆 Produtos mais vendidos</b>
          {campeoes.length ? campeoes.map(([n, q], i) => <p key={n} className="flex justify-between text-sm"><span>{i + 1}. {n}</span><b>{q}</b></p>) : <p className="text-sm opacity-60">—</p>}
        </div>
        <div className={caixa}>
          <b>💳 Entradas por forma de pagamento</b>
          {agrupar(movs.filter((x) => x.tipo === "entrada").map((x) => [rotuloDe(FORMAS_PAGAMENTO, x.forma_pagamento), Number(x.valor)])).map(([k, v]) => <p key={k} className="flex justify-between text-sm"><span>{k}</span><span>{formatarPreco(v)}</span></p>)}
          <b className="mt-3 block">⬇️ Saídas por categoria</b>
          {agrupar(movs.filter((x) => x.tipo === "saida").map((x) => [x.categoria, Number(x.valor)])).map(([k, v]) => <p key={k} className="flex justify-between text-sm"><span>{k}</span><span>{formatarPreco(v)}</span></p>)}
        </div>
      </section>
      <p className="mt-6 text-xs opacity-50">Gerado em {new Date().toLocaleString("pt-BR")} · MA Online Store</p>
    </div>
  );
}
