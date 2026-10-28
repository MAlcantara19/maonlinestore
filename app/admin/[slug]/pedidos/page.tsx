"use client";
// =====================================================================
// PAINEL — PEDIDOS (endereço: /admin/vitraforma/pedidos)
// Todo pedido/orçamento enviado pelo site aparece aqui, com o código.
// Mude o andamento (Recebido → Em produção → Pronto → Entregue) e deixe
// um recado: o cliente vê tudo em /pedido/<código>.
// "Copiar aviso" copia uma mensagem pronta para colar na conversa.
// =====================================================================
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco } from "@/lib/formato";

type Item = { nome: string; opcao?: string | null; quantidade: number; tamanho: string | null; cor: string | null; preco: number | null; observacao: string };
type Pedido = {
  id: string; codigo: string; tipo: "pedido" | "orcamento"; cliente_nome: string | null; itens: Item[]; total: number | null;
  desconto: number | null; cupom: string | null; data_desejada: string | null; urgente: boolean; status: string; nota_loja: string | null; criado_em: string;
  entrega?: string | null; frete?: number | null;
};

const STATUS = [
  { valor: "recebido", rotulo: "📥 Recebido", cor: "#64748b" },
  { valor: "em_producao", rotulo: "🛠️ Em produção", cor: "#d97706" },
  { valor: "pronto", rotulo: "🎁 Pronto", cor: "#2563eb" },
  { valor: "entregue", rotulo: "✅ Entregue", cor: "#16a34a" },
  { valor: "cancelado", rotulo: "❌ Cancelado", cor: "#dc2626" },
];

export default function PainelPedidos() {
  return <AreaAdmin>{() => <Lista />}</AreaAdmin>;
}

function Lista() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [filtro, setFiltro] = useState("abertos");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async (l: LojaResumo) => {
    const { data } = await supabaseNavegador().from("pedidos").select("*").eq("loja_id", l.id).order("criado_em", { ascending: false }).limit(300);
    setPedidos((data ?? []) as Pedido[]);
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); }); }, [slug, carregar]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  async function atualizar(p: Pedido, campos: Partial<Pedido>) {
    const { error } = await supabaseNavegador().from("pedidos").update({ ...campos, atualizado_em: new Date().toISOString() }).eq("id", p.id);
    if (error) return avisar(`Erro: ${error.message}`);
    setPedidos((lista) => (lista ?? []).map((x) => (x.id === p.id ? { ...x, ...campos } : x)));
    avisar("✓ Atualizado! O cliente já vê no acompanhamento.");
  }

  async function copiarAviso(p: Pedido) {
    const etapa = STATUS.find((s) => s.valor === p.status)?.rotulo ?? p.status;
    const texto = `Oi${p.cliente_nome ? `, ${p.cliente_nome}` : ""}! 😊\nSeu pedido *#${p.codigo}* agora está: *${etapa}*` +
      (p.nota_loja ? `\n💬 ${p.nota_loja}` : "") + `\n🔗 Acompanhe: ${window.location.origin}/pedido/${p.codigo}`;
    await navigator.clipboard.writeText(texto);
    avisar("✓ Mensagem copiada! Cole na conversa do WhatsApp.");
  }

  const lista = (pedidos ?? []).filter((p) =>
    filtro === "todos" ? true : filtro === "abertos" ? !["entregue", "cancelado"].includes(p.status) : p.status === filtro);

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <p className="mb-3 rounded-xl bg-sky-50 p-3 text-xs text-sky-900">
        📦 Produtos com estoque controlado: o estoque <b>baixa sozinho</b> quando o pedido muda para &quot;Em produção&quot;, &quot;Pronto&quot; ou &quot;Entregue&quot;,
        e <b>volta</b> se você cancelar.
      </p>
      {aviso && <p className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">{aviso}</p>}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[{ valor: "abertos", rotulo: "Em aberto" }, ...STATUS, { valor: "todos", rotulo: "Todos" }].map((f) => (
          <button key={f.valor} type="button" onClick={() => setFiltro(f.valor)} className="shrink-0 rounded-full border px-3 py-1.5 text-sm"
            style={filtro === f.valor ? { background: cor, color: "white", borderColor: cor } : { background: "white" }}>{f.rotulo}</button>
        ))}
      </div>

      {!pedidos ? <p className="opacity-60">Carregando pedidos...</p> : lista.length === 0 ? <p className="opacity-70">Nenhum pedido aqui. 📭</p> : (
        <div className="space-y-3">
          {lista.map((p) => {
            const st = STATUS.find((s) => s.valor === p.status);
            return (
              <article key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-lg">#{p.codigo}</b>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{p.tipo === "orcamento" ? "📝 Orçamento" : "🛒 Pedido"}</span>
                  {p.urgente && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">⚡ Urgente</span>}
                  {p.data_desejada && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs">📅 {p.data_desejada.split("-").reverse().join("/")}</span>}
                  <span className="flex-1" />
                  <span className="text-xs opacity-60">{new Date(p.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                {p.cliente_nome && <p className="text-sm">👤 {p.cliente_nome}</p>}
                <ul className="mt-2 text-sm">
                  {p.itens.map((i, n) => (
                    <li key={n}>• {i.quantidade}x <b>{i.nome}</b> {[i.opcao, i.tamanho, i.cor].filter(Boolean).join(" · ")}{i.observacao ? ` — ✏️ ${i.observacao}` : ""}</li>
                  ))}
                </ul>
                <p className="mt-1 text-sm font-semibold">
                  Total: {formatarPreco(Number(p.total ?? 0))}{p.cupom ? ` (cupom ${p.cupom}: −${formatarPreco(Number(p.desconto ?? 0))})` : ""}
                  {p.entrega && <> · 🚚 {p.entrega}{p.frete ? ` (${formatarPreco(Number(p.frete))})` : ""}</>}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select value={p.status} onChange={(e) => atualizar(p, { status: e.target.value })}
                    className="rounded-lg border px-3 py-2 text-sm font-semibold text-white" style={{ background: st?.cor }}>
                    {STATUS.map((s) => <option key={s.valor} value={s.valor} className="bg-white text-stone-900">{s.rotulo}</option>)}
                  </select>
                  <button type="button" onClick={() => copiarAviso(p)} className="rounded-lg border px-3 py-2 text-sm">📋 Copiar aviso para o cliente</button>
                  <a href={`/pedido/${p.codigo}`} target="_blank" className="rounded-lg border px-3 py-2 text-sm">👁️ Ver como o cliente</a>
                </div>
                <textarea defaultValue={p.nota_loja ?? ""} rows={2} placeholder="💬 Recado para o cliente (ex.: previsão de entrega). Salva ao sair do campo."
                  onBlur={(e) => e.target.value !== (p.nota_loja ?? "") && atualizar(p, { nota_loja: e.target.value || null })}
                  className="mt-2 w-full rounded-lg border bg-stone-50 p-2 text-sm" />
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
