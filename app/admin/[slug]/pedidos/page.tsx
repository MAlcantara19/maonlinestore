"use client";
// =====================================================================
// PAINEL — PEDIDOS (endereço: /admin/vitraforma/pedidos)
// Todo pedido/orçamento enviado pelo site aparece aqui, com o código.
// Mude o andamento (Recebido → Em produção → Pronto → Entregue) e deixe
// um recado: o cliente vê tudo em /pedido/<código>.
// "Copiar aviso" copia uma mensagem pronta para colar na conversa.
// =====================================================================
import { ETAPAS_PEDIDO, mensagemDeAndamento } from "@/lib/statusPedido";
import { linkWhatsApp } from "@/lib/whatsapp";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco, telefoneBonito } from "@/lib/formato";

type Item = { nome: string; opcao?: string | null; quantidade: number; tamanho: string | null; cor: string | null; preco: number | null; observacao: string };
type Pedido = {
  id: string; codigo: string; tipo: "pedido" | "orcamento"; cliente_nome: string | null; itens: Item[]; total: number | null;
  desconto: number | null; cupom: string | null; data_desejada: string | null; urgente: boolean; status: string; nota_loja: string | null; criado_em: string;
  entrega?: string | null; frete?: number | null; cliente_whatsapp?: string | null;
};

// As etapas ficam em lib/statusPedido.ts (as mesmas do acompanhamento do cliente)
const STATUS = ETAPAS_PEDIDO.map((e) => ({ valor: e.valor, rotulo: `${e.icone} ${e.rotulo}`, cor: e.cor }));

export default function PainelPedidos() {
  return <AreaAdmin>{() => <Lista />}</AreaAdmin>;
}

function Lista() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [filtro, setFiltro] = useState("abertos");
  const [aviso, setAviso] = useState("");
  // Abrir o WhatsApp do cliente sozinho ao mudar a etapa (lembrado neste aparelho)
  const [avisarAuto, setAvisarAuto] = useState(true);
  useEffect(() => { try { setAvisarAuto(localStorage.getItem("avisar-cliente-auto") !== "nao"); } catch {} }, []);
  // Veio pelo link de um pedido (?codigo=ABC123)? Mostra todos e destaca ele
  const [destaque, setDestaque] = useState<string | null>(null);
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("codigo");
    if (c) { setDestaque(c.toUpperCase()); setFiltro("todos"); }
  }, []);
  useEffect(() => {
    if (destaque && pedidos) document.getElementById(`pedido-${destaque}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [destaque, pedidos]);

  const carregar = useCallback(async (l: LojaResumo) => {
    const { data } = await supabaseNavegador().from("pedidos").select("*").eq("loja_id", l.id).order("criado_em", { ascending: false }).limit(300);
    setPedidos((data ?? []) as Pedido[]);
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); }); }, [slug, carregar]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  // Abre o WhatsApp do cliente com a mensagem da etapa pronta (é só tocar em enviar)
  function avisarNoWhatsApp(p: Pedido, status = p.status) {
    if (!p.cliente_whatsapp) return false;
    const numero = p.cliente_whatsapp.length <= 11 ? `55${p.cliente_whatsapp}` : p.cliente_whatsapp;
    window.open(linkWhatsApp(numero, mensagemDeAndamento({ ...p, status }, window.location.origin, loja?.nome)), "_blank");
    return true;
  }

  async function mudarEtapa(p: Pedido, status: string) {
    // Abre o WhatsApp ANTES de salvar (o navegador só deixa abrir na hora do clique)
    const avisou = avisarAuto && avisarNoWhatsApp(p, status);
    await atualizar(p, { status });
    if (!avisou && !p.cliente_whatsapp) avisar("✓ Atualizado! (O cliente não deixou o WhatsApp: use 📋 Copiar aviso.)");
  }

  async function atualizar(p: Pedido, campos: Partial<Pedido>) {
    const { error } = await supabaseNavegador().from("pedidos").update({ ...campos, atualizado_em: new Date().toISOString() }).eq("id", p.id);
    if (error) return avisar(`Erro: ${error.message}`);
    setPedidos((lista) => (lista ?? []).map((x) => (x.id === p.id ? { ...x, ...campos } : x)));
    avisar("✓ Atualizado! O cliente já vê no acompanhamento.");
  }

  async function copiarAviso(p: Pedido) {
    const texto = mensagemDeAndamento(p, window.location.origin, loja?.nome);
    await navigator.clipboard.writeText(texto);
    avisar("✓ Mensagem copiada! Cole na conversa do WhatsApp.");
  }

  const lista = (pedidos ?? []).filter((p) =>
    filtro === "todos" ? true : filtro === "abertos" ? !["entregue", "cancelado"].includes(p.status) : p.status === filtro);

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <p className="mb-3 rounded-xl bg-sky-50 p-3 text-xs text-sky-900">
        📦 Produtos com estoque controlado: o estoque <b>baixa sozinho</b> quando o pedido é &quot;Aceito&quot; (ou passa para as etapas seguintes),
        e <b>volta</b> se você cancelar.
      </p>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={avisarAuto} onChange={(e) => { setAvisarAuto(e.target.checked); try { localStorage.setItem("avisar-cliente-auto", e.target.checked ? "sim" : "nao"); } catch {} }} />
        📲 Ao mudar a etapa, abrir o WhatsApp do cliente com o aviso pronto (é só tocar em enviar)
      </label>
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
              <article key={p.id} id={`pedido-${p.codigo}`} className="rounded-2xl bg-white p-4 shadow-sm"
                style={destaque === p.codigo ? { outline: `3px solid ${cor}`, outlineOffset: 2 } : {}}>
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-lg">#{p.codigo}</b>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{p.tipo === "orcamento" ? "💬 Dúvida" : "🛒 Pedido"}</span>
                  {p.urgente && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">⚡ Urgente</span>}
                  {p.data_desejada && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs">📅 {p.data_desejada.split("-").reverse().join("/")}</span>}
                  <span className="flex-1" />
                  <span className="text-xs opacity-60">{new Date(p.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                {p.cliente_nome && <p className="text-sm">👤 {p.cliente_nome}</p>}
                {p.cliente_whatsapp && <p className="text-sm">📲 {telefoneBonito(p.cliente_whatsapp)}</p>}
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
                  <select value={p.status} onChange={(e) => mudarEtapa(p, e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm font-semibold text-white" style={{ background: st?.cor }}>
                    {STATUS.map((s) => <option key={s.valor} value={s.valor} className="bg-white text-stone-900">{s.rotulo}</option>)}
                  </select>
                  {p.cliente_whatsapp && (
                    <button type="button" onClick={() => avisarNoWhatsApp(p)} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">📲 Avisar no WhatsApp</button>
                  )}
                  <button type="button" onClick={() => copiarAviso(p)} className="rounded-lg border px-3 py-2 text-sm">📋 Copiar aviso</button>
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
