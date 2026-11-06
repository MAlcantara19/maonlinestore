"use client";
// =====================================================================
// PAINEL — FINANCEIRO (endereço: /admin/vitraforma/financeiro)
// Tudo que ENTRA e SAI de dinheiro da loja:
//   - Entrada: venda (pode puxar um pedido do site e os produtos vêm juntos),
//     sinal, restante, outro
//   - Saída: filamento/material, embalagem, frete, equipamento, taxas...
//   - Forma de pagamento: Pix, dinheiro, crédito, débito, transferência...
// Resumo do mês, lista com filtros e exportação para Excel (CSV).
// =====================================================================
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, paraNumero, type LojaResumo } from "@/lib/admin";
import { formatarPreco } from "@/lib/formato";
import { etapaDo } from "@/lib/statusPedido";

type ItemMov = { nome: string; quantidade: number; preco: number };
type Mov = {
  id: string; tipo: "entrada" | "saida"; data: string; categoria: string; descricao: string | null; valor: number;
  forma_pagamento: string | null; pedido_id: string | null; pedido_numero: string | null; itens: ItemMov[]; observacao: string | null; criado_por: string | null;
};
type PedidoResumo = { id: string; codigo: string; cliente_nome: string | null; total: number | null; status: string; criado_em: string; itens: { nome: string; quantidade: number; preco: number | null; opcao?: string | null; tamanho?: string | null; cor?: string | null }[] };

const CATEGORIAS = {
  entrada: [["venda", "🛍️ Venda"], ["sinal", "💵 Sinal (entrada do pedido)"], ["restante", "✅ Restante do pedido"], ["outro_entrada", "➕ Outra entrada"]],
  saida: [["material", "🧵 Filamento / material"], ["embalagem", "📦 Embalagem"], ["frete", "🚚 Frete / envio"], ["equipamento", "🛠️ Equipamento / ferramentas"], ["taxas", "🧾 Taxas e impostos"], ["marketing", "📣 Divulgação"], ["outro_saida", "➖ Outra saída"]],
} as const;
const FORMAS = [["pix", "⚡ Pix"], ["dinheiro", "💵 Dinheiro"], ["credito", "💳 Crédito"], ["debito", "💳 Débito"], ["transferencia", "🏦 Transferência"], ["boleto", "📄 Boleto"], ["outro", "Outro"]] as const;
const rotulo = (lista: readonly (readonly [string, string])[], v: string | null) => lista.find(([k]) => k === v)?.[1] ?? v ?? "—";
const todasCategorias = [...CATEGORIAS.entrada, ...CATEGORIAS.saida];
const hoje = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
const vazio = (): Omit<Mov, "id" | "criado_por"> => ({ tipo: "entrada", data: hoje(), categoria: "venda", descricao: "", valor: 0, forma_pagamento: "pix", pedido_id: null, pedido_numero: "", itens: [], observacao: "" });

export default function PainelFinanceiro() {
  return <AreaAdmin>{() => <Financeiro />}</AreaAdmin>;
}

function Financeiro() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [mes, setMes] = useState(hoje().slice(0, 7)); // AAAA-MM
  const [movs, setMovs] = useState<Mov[] | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [form, setForm] = useState(vazio());
  const [valorTexto, setValorTexto] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "entrada" | "saida">("todos");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async (l: LojaResumo, m: string) => {
    const sb = supabaseNavegador();
    const [ano, mm] = m.split("-").map(Number);
    const fim = new Date(ano, mm, 0).getDate();
    const [r1, r2] = await Promise.all([
      sb.from("movimentacoes").select("*").eq("loja_id", l.id).gte("data", `${m}-01`).lte("data", `${m}-${fim}`).order("data", { ascending: false }).order("criado_em", { ascending: false }),
      sb.from("pedidos").select("id, codigo, cliente_nome, total, status, criado_em, itens").eq("loja_id", l.id).eq("tipo", "pedido").neq("status", "cancelado").eq("teste", false)
        .order("criado_em", { ascending: false }).limit(60),
    ]);
    if (r1.error) setAviso(`Rode a atualização 25 no Supabase. (${r1.error.message})`);
    setMovs((r1.data ?? []) as Mov[]);
    setPedidos((r2.data ?? []) as PedidoResumo[]);
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l, mes); }); }, [slug, mes, carregar]);

  // Pedidos que ainda não têm nenhuma entrada registrada
  const semPagamento = useMemo(() => {
    const comMov = new Set((movs ?? []).filter((m) => m.pedido_id).map((m) => m.pedido_id));
    return pedidos.filter((p) => !comMov.has(p.id) && p.status !== "recebido").slice(0, 8);
  }, [movs, pedidos]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  // ---------- Resumo ----------
  const lista = movs ?? [];
  const entradas = lista.filter((m) => m.tipo === "entrada").reduce((s, m) => s + Number(m.valor), 0);
  const saidas = lista.filter((m) => m.tipo === "saida").reduce((s, m) => s + Number(m.valor), 0);
  const somarPor = (chave: "forma_pagamento" | "categoria", tipo: "entrada" | "saida") => {
    const mapa = new Map<string, number>();
    lista.filter((m) => m.tipo === tipo).forEach((m) => mapa.set(m[chave] ?? "—", (mapa.get(m[chave] ?? "—") ?? 0) + Number(m.valor)));
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  };

  // ---------- Formulário ----------
  const mudar = (c: Partial<typeof form>) => setForm({ ...form, ...c });
  function escolherPedido(id: string) {
    const p = pedidos.find((x) => x.id === id);
    if (!p) return mudar({ pedido_id: null, itens: [] });
    const itens = (p.itens ?? []).map((i) => ({ nome: [i.nome, i.opcao, i.tamanho, i.cor].filter(Boolean).join(" · "), quantidade: i.quantidade, preco: Number(i.preco ?? 0) }));
    const total = Number(p.total ?? itens.reduce((s, i) => s + i.preco * i.quantidade, 0));
    setForm({ ...form, tipo: "entrada", categoria: form.categoria.startsWith("outro") ? "venda" : form.categoria, pedido_id: p.id, itens, descricao: `Pedido #${p.codigo}${p.cliente_nome ? ` · ${p.cliente_nome}` : ""}` });
    setValorTexto(total.toFixed(2).replace(".", ","));
  }
  const mudarItem = (i: number, c: Partial<ItemMov>) => {
    const itens = form.itens.map((x, j) => (j === i ? { ...x, ...c } : x));
    mudar({ itens });
    setValorTexto(itens.reduce((s, x) => s + x.preco * x.quantidade, 0).toFixed(2).replace(".", ","));
  };

  async function salvar() {
    if (!loja) return;
    const valor = paraNumero(valorTexto);
    if (valor == null || valor <= 0) return avisar("Coloque o valor.");
    const { error } = await supabaseNavegador().from("movimentacoes").insert({
      ...form, loja_id: loja.id, valor, pedido_numero: form.pedido_numero?.trim() || null, descricao: form.descricao?.trim() || null, observacao: form.observacao?.trim() || null,
    });
    if (error) return avisar(`Erro: ${error.message}`);
    setForm({ ...vazio(), tipo: form.tipo, categoria: form.tipo === "entrada" ? "venda" : "material", forma_pagamento: form.forma_pagamento });
    setValorTexto("");
    avisar("✓ Movimentação registrada!");
    carregar(loja, mes);
  }
  async function apagar(m: Mov) {
    if (!loja || !confirm(`Apagar "${m.descricao ?? rotulo(todasCategorias, m.categoria)}" (${formatarPreco(Number(m.valor))})?`)) return;
    await supabaseNavegador().from("movimentacoes").delete().eq("id", m.id);
    carregar(loja, mes);
  }

  // Exporta o mês para abrir no Excel / Google Planilhas
  function exportar() {
    const linhas = [["Data", "Tipo", "Categoria", "Descrição", "Pedido", "Forma de pagamento", "Valor", "Produtos", "Observação", "Registrado por"],
      ...lista.map((m) => [m.data.split("-").reverse().join("/"), m.tipo === "entrada" ? "Entrada" : "Saída", rotulo(todasCategorias, m.categoria), m.descricao ?? "",
        m.pedido_numero ?? (m.pedido_id ? pedidos.find((p) => p.id === m.pedido_id)?.codigo ?? "" : ""), rotulo(FORMAS, m.forma_pagamento),
        (m.tipo === "saida" ? -1 : 1) * Number(m.valor), (m.itens ?? []).map((i) => `${i.quantidade}x ${i.nome} (${formatarPreco(i.preco)})`).join(" | "), m.observacao ?? "", m.criado_por ?? ""])];
    const csv = "\uFEFF" + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""').replace(/\./g, typeof c === "number" ? "," : ".")}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `financeiro-${loja!.slug}-${mes}.csv`;
    a.click();
  }

  const campo = "w-full rounded-lg border bg-white px-3 py-2";
  const chip = (ligado: boolean, c = cor) => (ligado ? { background: c, color: "white", borderColor: c } : { background: "white" });
  const visiveis = lista.filter((m) => filtro === "todos" || m.tipo === filtro);

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      {aviso && <p className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">{aviso}</p>}

      {/* Mês */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className="rounded-xl border bg-white px-3 py-2" />
        <button type="button" onClick={exportar} disabled={!lista.length} className="rounded-xl border bg-white px-4 py-2 text-sm disabled:opacity-40">📥 Exportar para Excel</button>
      </div>

      {/* Resumo */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs opacity-60">⬆️ Entradas</span><b className="block text-xl text-green-700">{formatarPreco(entradas)}</b></div>
        <div className="rounded-2xl bg-white p-4 shadow-sm"><span className="text-xs opacity-60">⬇️ Saídas</span><b className="block text-xl text-red-600">{formatarPreco(saidas)}</b></div>
        <div className="rounded-2xl p-4 text-white shadow-sm" style={{ background: entradas - saidas >= 0 ? "#15803d" : "#b91c1c" }}><span className="text-xs opacity-80">💰 Saldo do mês</span><b className="block text-xl">{formatarPreco(entradas - saidas)}</b></div>
      </div>
      {lista.length > 0 && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
            <b>Entradas por forma de pagamento</b>
            {somarPor("forma_pagamento", "entrada").map(([k, v]) => <p key={k} className="flex justify-between"><span>{rotulo(FORMAS, k)}</span><span>{formatarPreco(v)}</span></p>)}
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
            <b>Saídas por categoria</b>
            {somarPor("categoria", "saida").map(([k, v]) => <p key={k} className="flex justify-between"><span>{rotulo(todasCategorias, k)}</span><span>{formatarPreco(v)}</span></p>)}
            {!saidas && <p className="opacity-60">Nenhuma saída neste mês.</p>}
          </div>
        </div>
      )}

      {/* Atalho: pedidos sem pagamento registrado */}
      {semPagamento.length > 0 && (
        <Bloco titulo="⏳ Pedidos sem pagamento registrado">
          <div className="flex flex-wrap gap-2">
            {semPagamento.map((p) => (
              <button key={p.id} type="button" onClick={() => { escolherPedido(p.id); window.scrollTo({ top: document.getElementById("nova-mov")?.offsetTop ?? 0, behavior: "smooth" }); }}
                className="rounded-full border bg-white px-3 py-1.5 text-sm">#{p.codigo}{p.cliente_nome ? ` · ${p.cliente_nome}` : ""} · {formatarPreco(Number(p.total ?? 0))}</button>
            ))}
          </div>
        </Bloco>
      )}

      {/* Nova movimentação */}
      <div id="nova-mov" />
      <Bloco titulo="➕ Nova movimentação">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => mudar({ tipo: "entrada", categoria: "venda" })} className="rounded-xl border p-3 font-semibold" style={chip(form.tipo === "entrada", "#15803d")}>⬆️ Entrada (recebi)</button>
          <button type="button" onClick={() => mudar({ tipo: "saida", categoria: "material", pedido_id: null, itens: [] })} className="rounded-xl border p-3 font-semibold" style={chip(form.tipo === "saida", "#b91c1c")}>⬇️ Saída (paguei)</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">Data<input type="date" className={`${campo} mt-1`} value={form.data} onChange={(e) => mudar({ data: e.target.value })} /></label>
          <label className="text-sm font-semibold">Categoria
            <select className={`${campo} mt-1`} value={form.categoria} onChange={(e) => mudar({ categoria: e.target.value })}>
              {CATEGORIAS[form.tipo].map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Valor (R$)<input className={`${campo} mt-1 text-lg font-bold`} inputMode="decimal" value={valorTexto} onChange={(e) => setValorTexto(e.target.value)} placeholder="0,00" /></label>
        </div>

        {form.tipo === "entrada" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Pedido do site (opcional)
              <select className={`${campo} mt-1`} value={form.pedido_id ?? ""} onChange={(e) => escolherPedido(e.target.value)}>
                <option value="">— Sem pedido do site —</option>
                {pedidos.map((p) => (
                  <option key={p.id} value={p.id}>#{p.codigo} · {p.cliente_nome ?? "sem nome"} · {formatarPreco(Number(p.total ?? 0))} · {etapaDo(p.status)?.rotulo ?? p.status}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">Nº de pedido de fora (opcional)
              <input className={`${campo} mt-1`} value={form.pedido_numero ?? ""} onChange={(e) => mudar({ pedido_numero: e.target.value })} placeholder="Ex.: encomenda da feira, nº 12" />
            </label>
          </div>
        )}

        {/* Produtos vendidos (vêm do pedido; dá para ajustar ou incluir) */}
        {form.tipo === "entrada" && (
          <div className="space-y-2">
            <span className="text-sm font-semibold">Produtos vendidos</span>
            {form.itens.map((i, n) => (
              <div key={n} className="flex gap-2">
                <input className={`${campo} flex-1`} value={i.nome} onChange={(e) => mudarItem(n, { nome: e.target.value })} placeholder="Produto" />
                <input className={`${campo} w-16`} inputMode="numeric" value={i.quantidade} onChange={(e) => mudarItem(n, { quantidade: Number(e.target.value.replace(/\D/g, "")) || 0 })} aria-label="Quantidade" />
                <input className={`${campo} w-24`} inputMode="decimal" value={String(i.preco).replace(".", ",")} onChange={(e) => mudarItem(n, { preco: Number(e.target.value.replace(",", ".")) || 0 })} aria-label="Preço" />
                <button type="button" onClick={() => mudar({ itens: form.itens.filter((_, j) => j !== n) })} className="px-1 text-red-600" aria-label="Tirar">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => mudar({ itens: [...form.itens, { nome: "", quantidade: 1, preco: 0 }] })} className="w-fit rounded-full border px-3 py-1 text-sm">+ Produto</button>
            {form.itens.length > 0 && <p className="text-xs opacity-60">O valor acima é a soma dos produtos (pode ajustar, por exemplo, se o cliente pagou só o sinal).</p>}
          </div>
        )}

        <div>
          <span className="text-sm font-semibold">Forma de pagamento</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {FORMAS.map(([v, r]) => <button key={v} type="button" onClick={() => mudar({ forma_pagamento: v })} className="rounded-full border px-3 py-1.5 text-sm" style={chip(form.forma_pagamento === v)}>{r}</button>)}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">Descrição<input className={`${campo} mt-1`} value={form.descricao ?? ""} onChange={(e) => mudar({ descricao: e.target.value })} placeholder={form.tipo === "saida" ? "Ex.: 2 kg PLA roxo — loja X" : "Ex.: Venda na feira"} /></label>
          <label className="text-sm font-semibold">Observação<input className={`${campo} mt-1`} value={form.observacao ?? ""} onChange={(e) => mudar({ observacao: e.target.value })} placeholder="Qualquer detalhe" /></label>
        </div>
        <button type="button" onClick={salvar} className="w-full rounded-xl p-3 font-semibold text-white" style={{ background: form.tipo === "entrada" ? "#15803d" : "#b91c1c" }}>
          {form.tipo === "entrada" ? "⬆️ Registrar entrada" : "⬇️ Registrar saída"}
        </button>
      </Bloco>

      {/* Lista do mês */}
      <Bloco titulo="📒 Movimentações do mês">
        <div className="flex gap-2 text-sm">
          {([["todos", "Todas"], ["entrada", "⬆️ Entradas"], ["saida", "⬇️ Saídas"]] as const).map(([v, r]) => (
            <button key={v} type="button" onClick={() => setFiltro(v)} className="rounded-full border px-3 py-1" style={chip(filtro === v)}>{r}</button>
          ))}
        </div>
        {!movs ? <p className="opacity-60">Carregando...</p> : visiveis.length === 0 ? <p className="text-sm opacity-60">Nada registrado neste mês.</p> : (
          <ul className="space-y-2">
            {visiveis.map((m) => (
              <li key={m.id} className="rounded-xl border-l-4 bg-stone-50 p-3 text-sm" style={{ borderColor: m.tipo === "entrada" ? "#15803d" : "#b91c1c" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs opacity-60">{m.data.split("-").reverse().join("/")}</span>
                  <b className="flex-1">{m.descricao || rotulo(todasCategorias, m.categoria)}</b>
                  <b style={{ color: m.tipo === "entrada" ? "#15803d" : "#b91c1c" }}>{m.tipo === "entrada" ? "+" : "−"} {formatarPreco(Number(m.valor))}</b>
                  <button type="button" onClick={() => apagar(m)} className="text-red-600" aria-label="Apagar">🗑️</button>
                </div>
                <p className="text-xs opacity-70">
                  {rotulo(todasCategorias, m.categoria)} · {rotulo(FORMAS, m.forma_pagamento)}
                  {m.pedido_numero ? ` · nº ${m.pedido_numero}` : ""}{m.criado_por ? ` · por ${m.criado_por}` : ""}
                </p>
                {(m.itens ?? []).length > 0 && <p className="text-xs">{m.itens.map((i) => `${i.quantidade}x ${i.nome} (${formatarPreco(i.preco)})`).join(" · ")}</p>}
                {m.observacao && <p className="text-xs opacity-70">📝 {m.observacao}</p>}
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </>
  );
}
