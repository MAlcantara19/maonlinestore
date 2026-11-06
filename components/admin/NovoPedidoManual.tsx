"use client";
// =====================================================================
// ➕ PEDIDO MANUAL — para pedidos que chegaram pelo WhatsApp, Instagram
// ou pessoalmente. Escolha os produtos do catálogo (com foto) ou digite
// à mão, e ele entra na lista de Pedidos e no Financeiro como os outros.
// =====================================================================
import { useEffect, useState } from "react";
import Portal from "@/components/Portal";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco } from "@/lib/formato";
import { paraNumero } from "@/lib/admin";
import { CANAIS, FORMAS_PAGAMENTO, lancarNoFinanceiro } from "@/lib/pagamento";
import { ETAPAS_PEDIDO } from "@/lib/statusPedido";

type ProdutoMini = { id: string; nome: string; preco: number | null; midias: { url: string; tipo: string; ordem: number }[] };
type ItemNovo = { nome: string; quantidade: number; preco: number; produto_id: string | null; foto: string | null };
const gerarCodigo = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function NovoPedidoManual({ lojaId, cor, aoCriar }: { lojaId: string; cor: string; aoCriar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [produtos, setProdutos] = useState<ProdutoMini[]>([]);
  const [busca, setBusca] = useState("");
  const [canal, setCanal] = useState("whatsapp");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [itens, setItens] = useState<ItemNovo[]>([]);
  const [status, setStatus] = useState("aceito");
  const [previsao, setPrevisao] = useState("");
  const [pagamento, setPagamento] = useState("pendente");
  const [forma, setForma] = useState("pix");
  const [valorPago, setValorPago] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto || produtos.length) return;
    supabaseNavegador().from("produtos").select("id, nome, preco, midias(url, tipo, ordem)").eq("loja_id", lojaId).is("excluido_em", null).order("nome")
      .then(({ data }: { data: ProdutoMini[] | null }) => setProdutos(data ?? []));
  }, [aberto, lojaId, produtos.length]);

  const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const capa = (p: ProdutoMini) => [...p.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0]?.url ?? null;
  const achados = busca.trim() ? produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 8) : [];
  const mudarItem = (i: number, c: Partial<ItemNovo>) => setItens(itens.map((x, j) => (j === i ? { ...x, ...c } : x)));

  async function criar() {
    if (!itens.length) return setErro("Adicione pelo menos um produto.");
    setSalvando(true); setErro("");
    const sb = supabaseNavegador();
    const pagoNum = pagamento === "pago" ? total : pagamento === "sinal" ? paraNumero(valorPago) ?? total / 2 : 0;
    const linha = {
      loja_id: lojaId, tipo: "pedido", status: "recebido", canal, cliente_nome: nome.trim() || null, cliente_whatsapp: whats.replace(/\D/g, "") || null,
      itens: itens.map((i) => ({ nome: i.nome, quantidade: i.quantidade, preco: i.preco, produto_id: i.produto_id, foto: i.foto, observacao: "", tamanho: null, cor: null })),
      total, previsao_entrega: previsao || null, nota_loja: null, pagamento_status: pagamento, valor_pago: pagoNum,
      pagamento_forma: pagamento === "pendente" ? null : forma, restante_quando: pagamento === "sinal" ? "na entrega" : null, pagamento_obs: obs || null,
    };
    // Gera um código livre (tenta de novo se já existir)
    let criado: { id: string; codigo: string } | null = null;
    for (let t = 0; t < 4 && !criado; t++) {
      const { data, error } = await sb.from("pedidos").insert({ ...linha, codigo: gerarCodigo() }).select("id, codigo").single();
      if (!error) criado = data as { id: string; codigo: string };
      else if (!String(error.message).includes("duplicate")) { setErro(error.message); setSalvando(false); return; }
    }
    if (!criado) { setErro("Não deu para criar. Tente de novo."); setSalvando(false); return; }
    // Passa para a etapa escolhida (assim o estoque baixa sozinho, se for o caso)
    if (status !== "recebido") await sb.from("pedidos").update({ status }).eq("id", criado.id);
    if (pagoNum > 0) await lancarNoFinanceiro({ lojaId, pedidoId: criado.id, codigo: criado.codigo, cliente: nome, valor: pagoNum, forma, itens, categoria: pagamento === "sinal" ? "sinal" : "venda" });
    setSalvando(false); setAberto(false);
    setItens([]); setNome(""); setWhats(""); setObs(""); setValorPago(""); setPrevisao("");
    aoCriar();
  }

  const campo = "w-full rounded-lg border bg-white px-3 py-2";
  const chip = (ligado: boolean) => (ligado ? { background: cor, color: "white", borderColor: cor } : { background: "white" });
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="mb-3 rounded-full px-4 py-2 text-sm font-semibold text-white shadow" style={{ background: cor }}>
        ➕ Pedido manual (WhatsApp, Instagram, feira...)
      </button>
      {aberto && (
        <Portal>
          <div className="surgir fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-6" onClick={() => setAberto(false)}>
            <div onClick={(e) => e.stopPropagation()} className="subir max-h-[92vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 text-stone-900 sm:rounded-3xl">
              <div className="flex items-center justify-between"><b className="text-lg">➕ Novo pedido manual</b><button type="button" onClick={() => setAberto(false)} className="text-xl" aria-label="Fechar">✕</button></div>

              <div className="flex flex-wrap gap-2">{CANAIS.filter(([v]) => v !== "site").map(([v, r]) => <button key={v} type="button" onClick={() => setCanal(v)} className="rounded-full border px-3 py-1 text-sm" style={chip(canal === v)}>{r}</button>)}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" />
                <input className={campo} inputMode="tel" value={whats} onChange={(e) => setWhats(e.target.value)} placeholder="WhatsApp do cliente (para os avisos)" />
              </div>

              {/* Produtos */}
              <div className="relative">
                <input className={campo} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔍 Buscar produto do catálogo..." />
                {achados.length > 0 && (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border bg-white shadow-xl">
                    {achados.map((p) => (
                      <button key={p.id} type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5"
                        onClick={() => { setItens([...itens, { nome: p.nome, quantidade: 1, preco: Number(p.preco ?? 0), produto_id: p.id, foto: capa(p) }]); setBusca(""); }}>
                        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-stone-100">{capa(p) && <img src={capa(p)!} alt="" className="h-full w-full object-cover" />}</span>
                        <span className="flex-1">{p.nome}</span><span>{p.preco != null ? formatarPreco(Number(p.preco)) : "—"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {itens.map((i, n) => (
                <div key={n} className="flex items-center gap-2">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">{i.foto ? <img src={i.foto} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center">📦</span>}</span>
                  <input className={`${campo} flex-1`} value={i.nome} onChange={(e) => mudarItem(n, { nome: e.target.value })} />
                  <input className={`${campo} w-16`} inputMode="numeric" value={i.quantidade} onChange={(e) => mudarItem(n, { quantidade: Number(e.target.value.replace(/\D/g, "")) || 1 })} aria-label="Quantidade" />
                  <input className={`${campo} w-24`} inputMode="decimal" value={String(i.preco).replace(".", ",")} onChange={(e) => mudarItem(n, { preco: Number(e.target.value.replace(",", ".")) || 0 })} aria-label="Preço" />
                  <button type="button" onClick={() => setItens(itens.filter((_, j) => j !== n))} className="text-red-600" aria-label="Tirar">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setItens([...itens, { nome: "", quantidade: 1, preco: 0, produto_id: null, foto: null }])} className="rounded-full border px-3 py-1 text-sm">+ Item digitado à mão</button>
              <p className="text-right text-lg">Total: <b>{formatarPreco(total)}</b></p>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-sm font-semibold">Etapa
                  <select className={`${campo} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    {ETAPAS_PEDIDO.filter((e) => e.valor !== "cancelado").map((e) => <option key={e.valor} value={e.valor}>{e.icone} {e.rotulo}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold">📅 Previsão de entrega<input type="date" className={`${campo} mt-1`} value={previsao} onChange={(e) => setPrevisao(e.target.value)} /></label>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {[["pendente", "⏳ Não pago"], ["sinal", "💵 Sinal"], ["pago", "✅ Pago"]].map(([v, r]) => <button key={v} type="button" onClick={() => setPagamento(v)} className="rounded-full border px-3 py-1" style={chip(pagamento === v)}>{r}</button>)}
              </div>
              {pagamento !== "pendente" && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {FORMAS_PAGAMENTO.map(([v, r]) => <button key={v} type="button" onClick={() => setForma(v)} className="rounded-full border px-3 py-1" style={chip(forma === v)}>{r}</button>)}
                  {pagamento === "sinal" && <input className="w-32 rounded-lg border px-2 py-1" inputMode="decimal" value={valorPago} onChange={(e) => setValorPago(e.target.value)} placeholder={`Sinal (${formatarPreco(total / 2)})`} />}
                </div>
              )}
              <input className={campo} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observação (opcional)" />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <button type="button" onClick={criar} disabled={salvando} className="w-full rounded-xl p-3 font-semibold text-white disabled:opacity-50" style={{ background: cor }}>{salvando ? "Criando..." : "Criar pedido"}</button>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
