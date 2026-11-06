"use client";
// =====================================================================
// 📦 CALCULAR FRETE APROXIMADO — o cliente digita o CEP e vê uma
// estimativa. Fica guardado para ir junto na mensagem do pedido.
// =====================================================================
import { useEffect, useState } from "react";
import { estimarFrete, temRegras, type Estimativa, type RegrasFrete } from "@/lib/frete";
import { formatarPreco } from "@/lib/formato";

export const chaveFrete = (slug: string) => `frete:${slug}`;

export default function CalculoFrete({ slug, regras, cor }: { slug: string; regras?: RegrasFrete | null; cor: string }) {
  const [cep, setCep] = useState("");
  const [res, setRes] = useState<Estimativa | null>(null);
  const [erro, setErro] = useState("");
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(chaveFrete(slug)) ?? "null"); if (s) { setRes(s); setCep(s.cep); } } catch {}
  }, [slug]);
  if (!temRegras(regras)) return null;

  async function calcular() {
    setBuscando(true); setErro("");
    const r = await estimarFrete(cep, regras!);
    setBuscando(false);
    if (r === "cep_invalido") return setErro("Digite os 8 números do CEP.");
    if (r === "nao_achou") return setErro("Não encontramos esse CEP.");
    setRes(r);
    try { localStorage.setItem(chaveFrete(slug), JSON.stringify(r)); } catch {}
    window.dispatchEvent(new Event("frete-mudou"));
  }

  return (
    <div className="mt-4 rounded-xl border p-3 text-sm" style={{ borderColor: `${cor}44` }}>
      <b>📦 Calcular frete aproximado</b>
      <div className="mt-2 flex gap-2">
        <input className="min-w-0 flex-1 rounded-lg border bg-white/70 px-3 py-2" inputMode="numeric" placeholder="Seu CEP" maxLength={9} value={cep}
          onChange={(e) => setCep(e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2"))} onKeyDown={(e) => e.key === "Enter" && calcular()} />
        <button type="button" onClick={calcular} disabled={buscando} className="rounded-lg px-4 font-semibold text-white disabled:opacity-50" style={{ background: cor }}>{buscando ? "..." : "Calcular"}</button>
      </div>
      {erro && <p className="mt-1 text-red-600">{erro}</p>}
      {res && !erro && (
        <p className="mt-2">
          📍 {res.cidade} - {res.uf}:{" "}
          {res.valor == null ? <b>frete combinado pelo WhatsApp</b> : res.valor === 0 ? <b className="text-green-700">entrega grátis 🎉</b> : <b>cerca de {formatarPreco(res.valor)}</b>}
          <span className="block text-xs opacity-60">Valor aproximado — o frete final é confirmado na conversa.</span>
        </p>
      )}
    </div>
  );
}
