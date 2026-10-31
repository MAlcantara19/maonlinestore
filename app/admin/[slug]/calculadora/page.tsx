"use client";
// =====================================================================
// PAINEL — CALCULADORA DE PREÇOS 3D (endereço: /admin/vitraforma/calculadora)
// Aparece só nas lojas com a calculadora ligada (VitraForma).
//
// Conta:  Filamento = peso (arredondado p/ cima) ÷ 1000 × preço do kg
//         Impressão = horas × valor da hora (grande R$4 · média R$6 · pequena R$8)
//         Custo     = filamento + impressão + extras + perdas
//         Preço     = custo ÷ (1 − margem)        ← mesma fórmula da planilha
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco } from "@/lib/formato";

type Config = { precoKg: number; horaGrande: number; horaMedia: number; horaPequena: number };
type Salvo = { nome: string; quando: string; custo: number; varejo: number; resumo: string };
const CONFIG_PADRAO: Config = { precoKg: 150, horaGrande: 4, horaMedia: 6, horaPequena: 8 };
const TEMPOS = [["10 min", 10], ["20 min", 20], ["30 min", 30], ["45 min", 45], ["1 h", 60], ["2 h", 120], ["3 h", 180], ["4 h", 240], ["5 h", 300], ["8 h", 480]] as const;
const MARGENS_ATACADO = [30, 35, 40, 45, 50];

// "89,66" → "89,90" (preço de vitrine terminando em ,90)
const terminaEm90 = (v: number) => Math.max(0.9, Math.ceil(v - 0.9) + 0.9);
const num = (t: string) => Number(t.replace(",", ".")) || 0;

export default function PainelCalculadora() {
  return <AreaAdmin>{() => <Calculadora />}</AreaAdmin>;
}

function Calculadora() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [cfg, setCfg] = useState<Config>(CONFIG_PADRAO);
  const [nome, setNome] = useState("");
  const [peso, setPeso] = useState("");
  const [arredonda, setArredonda] = useState(5);
  const [horas, setHoras] = useState("");
  const [minutos, setMinutos] = useState("");
  const [tamanho, setTamanho] = useState<"grande" | "media" | "pequena">("pequena");
  const [embalagem, setEmbalagem] = useState("");
  const [acabamento, setAcabamento] = useState("");
  const [outros, setOutros] = useState("");
  const [perdas, setPerdas] = useState(0);
  const [margem, setMargem] = useState(50);
  const [usar90, setUsar90] = useState(true);
  const [qtd, setQtd] = useState("10");
  const [margemAtacado, setMargemAtacado] = useState(40);
  const [salvos, setSalvos] = useState<Salvo[]>([]);
  const [aviso, setAviso] = useState("");

  useEffect(() => { lojaPeloSlug(slug).then(setLoja); }, [slug]);
  // Valores da loja (preço do kg e da hora) e cálculos salvos ficam neste aparelho
  useEffect(() => {
    try {
      setCfg({ ...CONFIG_PADRAO, ...JSON.parse(localStorage.getItem(`calc3d:${slug}`) ?? "{}") });
      setSalvos(JSON.parse(localStorage.getItem(`calc3d-salvos:${slug}`) ?? "[]"));
    } catch {}
  }, [slug]);
  const mudarCfg = (c: Partial<Config>) => { const n = { ...cfg, ...c }; setCfg(n); try { localStorage.setItem(`calc3d:${slug}`, JSON.stringify(n)); } catch {} };

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#3B1260";

  // ---------- Contas ----------
  const pesoReal = num(peso);
  const pesoUsado = arredonda ? Math.ceil(pesoReal / arredonda) * arredonda : pesoReal; // arredonda para CIMA (purga/falhas)
  const totalMin = num(horas) * 60 + num(minutos);
  const horasDec = totalMin / 60;
  const valorHora = tamanho === "grande" ? cfg.horaGrande : tamanho === "media" ? cfg.horaMedia : cfg.horaPequena;
  const filamento = (pesoUsado / 1000) * cfg.precoKg;
  const impressao = horasDec * valorHora;
  const extras = num(embalagem) + num(acabamento) + num(outros);
  const valorPerdas = (filamento + impressao) * (perdas / 100);
  const custo = filamento + impressao + extras + valorPerdas;
  const precoCalc = margem < 100 ? custo / (1 - margem / 100) : 0;
  const varejo = usar90 && custo > 0 ? terminaEm90(precoCalc) : precoCalc;
  const lucro = varejo - custo;
  const quantidade = Math.max(1, Math.round(num(qtd)));
  const tempoTexto = `${Math.floor(totalMin / 60)}h${String(Math.round(totalMin % 60)).padStart(2, "0")}`;

  function salvar() {
    if (!custo) return;
    const resumo = `${nome || "Peça"} — ${pesoUsado} g · ${tempoTexto} · custo ${formatarPreco(custo)} · varejo ${formatarPreco(varejo)}`;
    const lista = [{ nome: nome || "Peça", quando: new Date().toISOString(), custo, varejo, resumo }, ...salvos].slice(0, 30);
    setSalvos(lista);
    try { localStorage.setItem(`calc3d-salvos:${slug}`, JSON.stringify(lista)); } catch {}
    setAviso("✓ Cálculo salvo na lista abaixo."); setTimeout(() => setAviso(""), 2000);
  }
  async function copiar() {
    const texto = [
      `🧮 ${nome || "Peça"} — VitraForma`,
      `Filamento (${pesoUsado} g): ${formatarPreco(filamento)}`,
      `Impressão (${tempoTexto} × ${formatarPreco(valorHora)}/h): ${formatarPreco(impressao)}`,
      extras ? `Extras: ${formatarPreco(extras)}` : "",
      perdas ? `Perdas (${perdas}%): ${formatarPreco(valorPerdas)}` : "",
      `Custo de produção: ${formatarPreco(custo)}`,
      `Preço unitário (varejo, ${margem}%): ${formatarPreco(varejo)}`,
      `Atacado (${margemAtacado}%): ${formatarPreco(custo / (1 - margemAtacado / 100))} cada · ${quantidade} un. = ${formatarPreco((custo / (1 - margemAtacado / 100)) * quantidade)}`,
    ].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(texto);
    setAviso("✓ Resumo copiado!"); setTimeout(() => setAviso(""), 2000);
  }

  const campo = "w-full rounded-lg border bg-white px-3 py-2";
  const chip = (ligado: boolean) => (ligado ? { background: cor, color: "white", borderColor: cor } : { background: "white" });

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* ===== Entradas ===== */}
        <div>
          <Bloco titulo="🏷️ Peça">
            <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da peça (opcional) — ex.: Vaso espiral" />
          </Bloco>

          <Bloco titulo="🧵 Filamento">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Peso total com suportes (g)
                <input className={`${campo} mt-1 text-lg`} inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="69,52" />
              </label>
              <label className="text-sm font-semibold">Preço do kg do filamento (R$)
                <input className={`${campo} mt-1`} inputMode="decimal" value={String(cfg.precoKg).replace(".", ",")} onChange={(e) => mudarCfg({ precoKg: num(e.target.value) })} />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              Arredondar o peso para cima:
              {[[0, "Não"], [1, "1 g"], [5, "5 g"], [10, "10 g"]].map(([v, r]) => (
                <button key={r} type="button" onClick={() => setArredonda(v as number)} className="rounded-full border px-3 py-1" style={chip(arredonda === v)}>{r}</button>
              ))}
            </div>
            {pesoReal > 0 && <p className="text-sm">Peso usado na conta: <b>{pesoUsado.toLocaleString("pt-BR")} g</b>{pesoUsado !== pesoReal && <span className="opacity-60"> (de {pesoReal.toLocaleString("pt-BR")} g — sobra cobre purga e falhas)</span>}</p>}
          </Bloco>

          <Bloco titulo="⏱️ Tempo de impressão">
            <div className="flex flex-wrap gap-2">
              {TEMPOS.map(([r, m]) => (
                <button key={r} type="button" onClick={() => { setHoras(String(Math.floor(m / 60))); setMinutos(String(m % 60)); }}
                  className="rounded-full border px-3 py-1.5 text-sm" style={chip(totalMin === m)}>{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">Horas<input className={`${campo} mt-1 text-lg`} inputMode="numeric" value={horas} onChange={(e) => setHoras(e.target.value.replace(/\D/g, ""))} placeholder="4" /></label>
              <label className="text-sm font-semibold">Minutos<input className={`${campo} mt-1 text-lg`} inputMode="numeric" value={minutos} onChange={(e) => setMinutos(e.target.value.replace(/\D/g, ""))} placeholder="18" /></label>
            </div>
            <div>
              <span className="text-sm font-semibold">Tamanho da peça (valor da hora)</span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {([["grande", "🐘 Grande", cfg.horaGrande, "horaGrande"], ["media", "🐕 Média", cfg.horaMedia, "horaMedia"], ["pequena", "🐭 Pequena", cfg.horaPequena, "horaPequena"]] as const).map(([v, r, valor, chave]) => (
                  <div key={v} className="rounded-xl border p-2 text-center" style={tamanho === v ? { borderColor: cor, borderWidth: 2 } : {}}>
                    <button type="button" onClick={() => setTamanho(v)} className="w-full text-sm font-semibold">{r}</button>
                    <input className="mt-1 w-full rounded border px-1 text-center text-sm" inputMode="decimal" value={String(valor).replace(".", ",")}
                      onChange={(e) => mudarCfg({ [chave]: num(e.target.value) } as Partial<Config>)} aria-label={`Valor da hora ${r}`} />
                    <span className="text-[11px] opacity-60">R$/hora</span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs opacity-60">Peças menores pagam mais por hora (mais atenção e acabamento por peça). Os valores ficam salvos neste aparelho.</p>
            </div>
          </Bloco>

          <Bloco titulo="➕ Outros custos (opcional)">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold">Embalagem (R$)<input className={`${campo} mt-1`} inputMode="decimal" value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} placeholder="0,00" /></label>
              <label className="text-sm font-semibold">Acabamento/pintura (R$)<input className={`${campo} mt-1`} inputMode="decimal" value={acabamento} onChange={(e) => setAcabamento(e.target.value)} placeholder="0,00" /></label>
              <label className="text-sm font-semibold">Outros (R$)<input className={`${campo} mt-1`} inputMode="decimal" value={outros} onChange={(e) => setOutros(e.target.value)} placeholder="argola, ímã..." /></label>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              Perdas e falhas:
              {[0, 5, 10, 15].map((v) => <button key={v} type="button" onClick={() => setPerdas(v)} className="rounded-full border px-3 py-1" style={chip(perdas === v)}>{v}%</button>)}
            </div>
          </Bloco>
        </div>

        {/* ===== Resultado (fica parado ao rolar no computador) ===== */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-2xl p-5 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
            <b className="text-sm uppercase tracking-wide opacity-80">Custo de produção</b>
            <table className="mt-2 w-full text-sm">
              <tbody>
                <tr><td>🧵 Filamento ({pesoUsado.toLocaleString("pt-BR")} g)</td><td className="text-right">{formatarPreco(filamento)}</td></tr>
                <tr><td>⏱️ Impressão ({tempoTexto} × {formatarPreco(valorHora)})</td><td className="text-right">{formatarPreco(impressao)}</td></tr>
                {extras > 0 && <tr><td>➕ Extras</td><td className="text-right">{formatarPreco(extras)}</td></tr>}
                {perdas > 0 && <tr><td>⚠️ Perdas ({perdas}%)</td><td className="text-right">{formatarPreco(valorPerdas)}</td></tr>}
                <tr className="border-t border-white/30 text-base font-bold"><td className="pt-1">Custo</td><td className="pt-1 text-right">{formatarPreco(custo)}</td></tr>
              </tbody>
            </table>

            <div className="mt-4 rounded-xl bg-white/15 p-3">
              <div className="flex items-center justify-between text-sm"><b>🛍️ Preço unitário (varejo)</b><span>margem {margem}%</span></div>
              <input type="range" min={20} max={75} step={5} value={margem} onChange={(e) => setMargem(Number(e.target.value))} className="w-full" aria-label="Margem do varejo" />
              <p className="text-4xl font-bold">{formatarPreco(varejo)}</p>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={usar90} onChange={(e) => setUsar90(e.target.checked)} /> Terminar em ,90 (preço de vitrine)</label>
              <p className="mt-1 text-sm">Lucro bruto: <b>{formatarPreco(lucro)}</b>{custo > 0 && <> · {(varejo / custo).toFixed(1).replace(".", ",")}× o custo</>}</p>
            </div>
            {aviso && <p className="mt-2 text-sm">{aviso}</p>}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={copiar} className="flex-1 rounded-xl bg-white/20 p-2 text-sm font-semibold">📋 Copiar resumo</button>
              <button type="button" onClick={salvar} className="flex-1 rounded-xl bg-white p-2 text-sm font-semibold" style={{ color: cor }}>💾 Salvar</button>
            </div>
          </section>
          <p className="mt-2 text-xs opacity-60">Recomendação: varejo com margem de 50% ou mais · atacado entre 35% e 45% · grandes pedidos até 30%, com todos os custos incluídos.</p>
        </div>
      </div>

      {/* ===== Atacado ===== */}
      <Bloco titulo="📦 Atacado">
        <label className="block text-sm font-semibold">Quantidade de peças
          <input className={`${campo} mt-1 max-w-[160px]`} inputMode="numeric" value={qtd} onChange={(e) => setQtd(e.target.value.replace(/\D/g, ""))} />
        </label>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left opacity-60"><th className="py-1">Margem</th><th>Preço por peça</th><th>Total ({quantidade} un.)</th><th>Lucro total</th></tr></thead>
            <tbody>
              {MARGENS_ATACADO.map((m) => {
                const unit = custo / (1 - m / 100);
                const recomendado = m >= 35 && m <= 45;
                return (
                  <tr key={m} onClick={() => setMargemAtacado(m)} className="cursor-pointer border-t"
                    style={margemAtacado === m ? { background: `${cor}18`, fontWeight: 700 } : {}}>
                    <td className="py-2">{m}% {recomendado && <span className="rounded-full bg-green-100 px-1.5 text-[10px] text-green-800">recomendado</span>}</td>
                    <td>{formatarPreco(unit)}</td>
                    <td>{formatarPreco(unit * quantidade)}</td>
                    <td>{formatarPreco((unit - custo) * quantidade)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs opacity-60">Toque numa linha para usar no “Copiar resumo”. Nunca venda perto do custo: ele já é o mínimo para não ter prejuízo.</p>
      </Bloco>

      {/* ===== Salvos ===== */}
      {salvos.length > 0 && (
        <Bloco titulo="💾 Cálculos salvos (neste aparelho)">
          <ul className="space-y-1 text-sm">
            {salvos.map((s, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2">
                <span className="flex-1">{s.resumo}</span>
                <span className="text-xs opacity-50">{new Date(s.quando).toLocaleDateString("pt-BR")}</span>
                <button type="button" aria-label="Apagar" className="text-red-600"
                  onClick={() => { const l = salvos.filter((_, j) => j !== i); setSalvos(l); try { localStorage.setItem(`calc3d-salvos:${slug}`, JSON.stringify(l)); } catch {} }}>✕</button>
              </li>
            ))}
          </ul>
        </Bloco>
      )}
    </>
  );
}
