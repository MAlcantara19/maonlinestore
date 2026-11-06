"use client";
// =====================================================================
// 📦 CALCULAR FRETE APROXIMADO — o cliente digita o CEP e vê uma
// estimativa. Fica guardado para ir junto na mensagem do pedido.
// =====================================================================
import { useEffect, useState } from "react";
import { estimarFrete, temRegras, type Estimativa, type RegrasFrete } from "@/lib/frete";
import { formatarPreco } from "@/lib/formato";

export const chaveFrete = (slug: string) => `frete:${slug}`;

type OpcaoEnvio = { servico: string; preco: number; prazo: number | null; logo?: string };

export default function CalculoFrete({ slug, regras, cor, itens, exato }: {
  slug: string; regras?: RegrasFrete | null; cor: string;
  itens?: { produtoId: string; quantidade: number }[]; // para a cotação exata (Melhor Envio)
  exato?: boolean; // a loja tem CEP de envio cadastrado
}) {
  const [opcoes, setOpcoes] = useState<OpcaoEnvio[]>([]);
  const [cep, setCep] = useState("");
  const [res, setRes] = useState<Estimativa | null>(null);
  const [erro, setErro] = useState("");
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(chaveFrete(slug)) ?? "null"); if (s) { setRes(s); setCep(s.cep); } } catch {}
  }, [slug]);
  if (!temRegras(regras) && !exato) return null;

  async function calcular() {
    setBuscando(true); setErro(""); setOpcoes([]);
    // 1) Cotação exata (se a loja tiver Melhor Envio e os produtos tiverem medidas)
    let melhores: OpcaoEnvio[] = [];
    if (exato && itens?.length) {
      melhores = await fetch("/api/frete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, cep, itens }) })
        .then((x) => x.json()).then((x) => x.opcoes ?? []).catch(() => []);
      setOpcoes(melhores);
    }
    // 2) Estimativa por região (sempre, como reserva)
    const r = await estimarFrete(cep, regras ?? {});
    setBuscando(false);
    if (r === "cep_invalido") return setErro("Digite os 8 números do CEP.");
    if (r === "nao_achou") return setErro("Não encontramos esse CEP.");
    // Se veio cotação exata, a mais barata vira o valor estimado
    const final = melhores.length ? { ...r, valor: melhores[0].preco, onde: `${melhores[0].servico}${melhores[0].prazo ? `, ${melhores[0].prazo} dias úteis` : ""}` } : r;
    setRes(final);
    try { localStorage.setItem(chaveFrete(slug), JSON.stringify(final)); } catch {}
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
      {/* Opções reais de envio */}
      {opcoes.length > 0 && !erro && (
        <ul className="mt-2 space-y-1">
          {opcoes.map((o) => (
            <li key={o.servico} className="flex items-center gap-2 rounded-lg bg-black/5 px-2 py-1.5">
              {o.logo && <img src={o.logo} alt="" className="h-5 w-auto" />}
              <span className="flex-1">{o.servico}{o.prazo ? <span className="opacity-60"> · {o.prazo} dias úteis</span> : null}</span>
              <b>{formatarPreco(o.preco)}</b>
            </li>
          ))}
        </ul>
      )}
      {res && !erro && !opcoes.length && (
        <p className="mt-2">
          📍 {res.cidade} - {res.uf}:{" "}
          {res.valor == null ? <b>frete combinado pelo WhatsApp</b> : res.valor === 0 ? <b className="text-green-700">entrega grátis 🎉</b> : <b>cerca de {formatarPreco(res.valor)}</b>}
          <span className="block text-xs opacity-60">Valor aproximado — o frete final é confirmado na conversa.</span>
        </p>
      )}
    </div>
  );
}
