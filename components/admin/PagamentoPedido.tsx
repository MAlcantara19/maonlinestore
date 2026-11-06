"use client";
// =====================================================================
// 💳 PAGAMENTO DO PEDIDO (painel) — um menuzinho que abre e fecha:
//   Não pago · Sinal pago · Pago por inteiro  +  como foi pago  +
//   quando paga o restante. Ao salvar, já lança no 💰 Financeiro.
// =====================================================================
import { useState } from "react";
import { formatarPreco } from "@/lib/formato";
import { paraNumero } from "@/lib/admin";
import { FORMAS_PAGAMENTO, lancarNoFinanceiro, rotuloDe } from "@/lib/pagamento";

type Pedido = {
  id: string; codigo: string; cliente_nome: string | null; total: number | null; itens: { nome: string; quantidade: number; preco: number | null; produto_id?: string | null }[];
  pagamento_status?: string | null; valor_pago?: number | null; pagamento_forma?: string | null; restante_quando?: string | null; pagamento_obs?: string | null;
};

export function SeloPagamento({ p }: { p: Pedido }) {
  const total = Number(p.total ?? 0), pago = Number(p.valor_pago ?? 0);
  if (p.pagamento_status === "pago") return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">✅ Pago</span>;
  if (p.pagamento_status === "sinal") return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">💵 Sinal pago · falta {formatarPreco(Math.max(0, total - pago))}</span>;
  return <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">⏳ Não pago</span>;
}

export default function PagamentoPedido({ p, lojaId, cor, aoSalvar }: { p: Pedido; lojaId: string; cor: string; aoSalvar: (campos: Partial<Pedido>) => Promise<void> }) {
  const [aberto, setAberto] = useState(false);
  const [status, setStatus] = useState(p.pagamento_status ?? "pendente");
  const [total, setTotal] = useState(p.total != null ? String(p.total).replace(".", ",") : "");
  const [pago, setPago] = useState(p.valor_pago ? String(p.valor_pago).replace(".", ",") : "");
  const [forma, setForma] = useState(p.pagamento_forma ?? "pix");
  const [quando, setQuando] = useState(p.restante_quando ?? "na entrega");
  const [obs, setObs] = useState(p.pagamento_obs ?? "");
  const [lancar, setLancar] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const totalNum = paraNumero(total) ?? 0;
  function escolher(s: string) {
    setStatus(s);
    if (s === "pago") setPago(totalNum.toFixed(2).replace(".", ","));
    if (s === "sinal" && !paraNumero(pago)) setPago((totalNum / 2).toFixed(2).replace(".", ","));
    if (s === "pendente") setPago("0");
  }

  async function salvar() {
    setSalvando(true);
    const novoPago = paraNumero(pago) ?? 0;
    const antes = Number(p.valor_pago ?? 0);
    await aoSalvar({ pagamento_status: status, valor_pago: novoPago, total: totalNum || p.total, pagamento_forma: status === "pendente" ? null : forma, restante_quando: status === "sinal" ? quando : null, pagamento_obs: obs || null });
    // Lança no financeiro só a DIFERENÇA que entrou agora
    if (lancar && novoPago > antes) {
      await lancarNoFinanceiro({
        lojaId, pedidoId: p.id, codigo: p.codigo, cliente: p.cliente_nome, valor: novoPago - antes, forma, itens: p.itens,
        categoria: antes > 0 ? "restante" : status === "sinal" ? "sinal" : "venda", observacao: obs || null,
      });
    }
    setSalvando(false);
    setAberto(false);
  }

  const chip = (ligado: boolean) => (ligado ? { background: cor, color: "white", borderColor: cor } : { background: "white" });
  return (
    <div className="mt-2 rounded-xl border bg-stone-50">
      <button type="button" onClick={() => setAberto((a) => !a)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm">
        <b>💳 Pagamento</b> <SeloPagamento p={p} />
        {p.pagamento_forma && p.pagamento_status !== "pendente" && <span className="text-xs opacity-60">{rotuloDe(FORMAS_PAGAMENTO, p.pagamento_forma)}</span>}
        {p.pagamento_status === "sinal" && p.restante_quando && <span className="text-xs opacity-60">· restante {p.restante_quando}</span>}
        <span className="ml-auto transition-transform" style={{ transform: aberto ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {aberto && (
        <div className="space-y-3 border-t p-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {[["pendente", "⏳ Não pago"], ["sinal", "💵 Sinal / metade"], ["pago", "✅ Pago por inteiro"]].map(([v, r]) => (
              <button key={v} type="button" onClick={() => escolher(v)} className="rounded-full border px-3 py-1.5" style={chip(status === v)}>{r}</button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="font-semibold">Valor total combinado (R$)
              <input className="mt-1 w-full rounded-lg border bg-white px-3 py-2" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
            </label>
            {status !== "pendente" && (
              <label className="font-semibold">Quanto já foi pago (R$)
                <input className="mt-1 w-full rounded-lg border bg-white px-3 py-2" inputMode="decimal" value={pago} onChange={(e) => setPago(e.target.value)} />
              </label>
            )}
          </div>
          {status !== "pendente" && (
            <div>
              <span className="font-semibold">Como foi pago</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {FORMAS_PAGAMENTO.map(([v, r]) => <button key={v} type="button" onClick={() => setForma(v)} className="rounded-full border px-3 py-1" style={chip(forma === v)}>{r}</button>)}
              </div>
            </div>
          )}
          {status === "sinal" && (
            <label className="block font-semibold">O restante ({formatarPreco(Math.max(0, totalNum - (paraNumero(pago) ?? 0)))}) será pago:
              <div className="mt-1 flex flex-wrap gap-2">
                {["na entrega", "na retirada", "antes de enviar"].map((q) => <button key={q} type="button" onClick={() => setQuando(q)} className="rounded-full border px-3 py-1 font-normal" style={chip(quando === q)}>{q}</button>)}
                <input className="rounded-lg border bg-white px-3 py-1 font-normal" value={quando} onChange={(e) => setQuando(e.target.value)} placeholder="ou digite (ex.: 20/11)" />
              </div>
            </label>
          )}
          <input className="w-full rounded-lg border bg-white px-3 py-2" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observação do pagamento (opcional)" />
          <label className="flex items-center gap-2"><input type="checkbox" checked={lancar} onChange={(e) => setLancar(e.target.checked)} /> Lançar o valor recebido no 💰 Financeiro</label>
          <button type="button" onClick={salvar} disabled={salvando} className="w-full rounded-xl p-2 font-semibold text-white disabled:opacity-50" style={{ background: cor }}>{salvando ? "Salvando..." : "Salvar pagamento"}</button>
        </div>
      )}
    </div>
  );
}
