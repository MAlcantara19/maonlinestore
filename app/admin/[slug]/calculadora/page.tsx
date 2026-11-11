"use client";
// =====================================================================
// PAINEL — CALCULADORA DE PREÇOS 3D (endereço: /admin/vitraforma/calculadora)
// Aparece só nas lojas com a calculadora ligada (VitraForma).
//
// Conta:  Filamento = peso (arredondado p/ cima) ÷ 1000 × preço do kg
//         Impressão = horas × valor da hora (grande · média · pequena)
//         Custo     = filamento + impressão + extras + perdas
//         Preço     = custo × (1 + LUCRO%)   ← "lucro sobre o custo"
//           Ex.: custo R$ 50 com lucro de 100% → preço R$ 100 (o dobro)
//
// Saídas: 📋 resumo DETALHADO para a equipe (WhatsApp da loja)
//         💬 mensagem pronta para o CLIENTE (modelo editável, vários itens)
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco } from "@/lib/formato";
import { linkWhatsApp } from "@/lib/whatsapp";

type Faixa = { qtd: number; desconto: number };
type Config = { precoKg: number; horaGrande: number; horaMedia: number; horaPequena: number; faixas: Faixa[]; cabecalho: string; rodape: string };
type Item = { nome: string; emoji: string; custo: number; preco: number; quando: string; resumo: string };

const CABECALHO = "Olá! 😊❤️ Seguem os valores das nossas peças personalizadas em impressão 3D:";
const RODAPE = `💰 CONDIÇÃO ESPECIAL DE PAGAMENTO

Ganhe 10% de desconto no pagamento à vista, via Pix ou dinheiro! 🎁

📌 CONDIÇÕES DE ENCOMENDA
• 50% de sinal para iniciar a produção.
• Restante pago na entrega.
• Produção sob encomenda, com prazo combinado conforme a quantidade e o modelo escolhido.

Todas as peças são produzidas em impressão 3D e podem ser personalizadas conforme o modelo.

Qualquer dúvida, estou à disposição! Será um prazer atender você! ❤️😊`;
const PADRAO: Config = {
  precoKg: 150, horaGrande: 4, horaMedia: 6, horaPequena: 8,
  faixas: [{ qtd: 10, desconto: 5 }, { qtd: 25, desconto: 7 }, { qtd: 50, desconto: 10 }],
  cabecalho: CABECALHO, rodape: RODAPE,
};
const TEMPOS = [["10 min", 10], ["20 min", 20], ["30 min", 30], ["45 min", 45], ["1 h", 60], ["2 h", 120], ["3 h", 180], ["4 h", 240], ["5 h", 300], ["8 h", 480]] as const;
const LUCROS_COMPARAR = [50, 75, 100, 150];
const EMOJIS = ["✨", "🎁", "⭐", "🔴⚫", "⚽", "🎄", "❤️", "🖱️", "🏠", "🧸", "🙏", "🦆"];

const terminaEm90 = (v: number) => Math.max(0.9, Math.ceil(v - 0.9) + 0.9); // 89,66 → 89,90
const num = (t: string) => Number(t.replace(",", ".")) || 0;
const reais = (v: number) => formatarPreco(Math.round(v * 100) / 100);

// Copiar que funciona em qualquer navegador (com plano B)
async function copiarTexto(texto: string) {
  try { await navigator.clipboard.writeText(texto); return true; } catch {
    const t = document.createElement("textarea");
    t.value = texto; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  }
}

export default function PainelCalculadora() {
  return <AreaAdmin>{() => <Calculadora />}</AreaAdmin>;
}

function Calculadora() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [whatsLoja, setWhatsLoja] = useState<string | null>(null);
  const [cfg, setCfg] = useState<Config>(PADRAO);
  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [peso, setPeso] = useState("");
  const [arredonda, setArredonda] = useState(5);
  const [horas, setHoras] = useState("");
  const [minutos, setMinutos] = useState("");
  const [tamanho, setTamanho] = useState<"grande" | "media" | "pequena">("pequena");
  const [embalagem, setEmbalagem] = useState("");
  const [acabamento, setAcabamento] = useState("");
  const [outros, setOutros] = useState("");
  const [perdas, setPerdas] = useState(0);
  const [lucroPct, setLucroPct] = useState(100);
  const [usar90, setUsar90] = useState(true);
  const [itens, setItens] = useState<Item[]>([]);
  const [marcados, setMarcados] = useState<number[]>([]);
  const [editarModelo, setEditarModelo] = useState(false);
  const [aviso, setAviso] = useState("");
  const [produtosLoja, setProdutosLoja] = useState<{ id: string; nome: string }[]>([]);
  const [produtoAlvo, setProdutoAlvo] = useState("");
  const [materiais, setMateriais] = useState<{ id: string; nome: string; quantidade: number; unidade: string }[]>([]);
  const [materialAlvo, setMaterialAlvo] = useState("");

  useEffect(() => {
    lojaPeloSlug(slug).then((l) => {
      setLoja(l);
      if (l) supabaseNavegador().from("produtos").select("id, nome").eq("loja_id", l.id).is("excluido_em", null).order("nome")
        .then(({ data }: { data: { id: string; nome: string }[] | null }) => setProdutosLoja(data ?? []));
      if (l) supabaseNavegador().from("materiais").select("id, nome, quantidade, unidade").eq("loja_id", l.id).eq("unidade", "g").order("nome")
        .then(({ data }: { data: { id: string; nome: string; quantidade: number; unidade: string }[] | null }) => setMateriais(data ?? []), () => {});
    });
  }, [slug]);
  useEffect(() => {
    supabaseNavegador().from("lojas").select("whatsapp").eq("slug", slug).maybeSingle()
      .then(({ data }: { data: { whatsapp: string | null } | null }) => setWhatsLoja(data?.whatsapp ?? null), () => {});
    try {
      setCfg({ ...PADRAO, ...JSON.parse(localStorage.getItem(`calc3d:${slug}`) ?? "{}") });
      setItens(JSON.parse(localStorage.getItem(`calc3d-itens:${slug}`) ?? "[]"));
    } catch {}
  }, [slug]);
  const mudarCfg = (c: Partial<Config>) => { const n = { ...cfg, ...c }; setCfg(n); try { localStorage.setItem(`calc3d:${slug}`, JSON.stringify(n)); } catch {} };
  const guardarItens = (l: Item[]) => { setItens(l); try { localStorage.setItem(`calc3d-itens:${slug}`, JSON.stringify(l)); } catch {} };
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#3B1260";

  // ---------- Contas ----------
  const pesoReal = num(peso);
  const pesoUsado = arredonda ? Math.ceil(pesoReal / arredonda) * arredonda : pesoReal;
  const totalMin = num(horas) * 60 + num(minutos);
  const valorHora = tamanho === "grande" ? cfg.horaGrande : tamanho === "media" ? cfg.horaMedia : cfg.horaPequena;
  const rotuloTamanho = tamanho === "grande" ? "grande" : tamanho === "media" ? "média" : "pequena";
  const filamento = (pesoUsado / 1000) * cfg.precoKg;
  const impressao = (totalMin / 60) * valorHora;
  const extras = num(embalagem) + num(acabamento) + num(outros);
  const valorPerdas = (filamento + impressao) * (perdas / 100);
  const custo = filamento + impressao + extras + valorPerdas;
  const precoCom = (lucro: number) => { const p = custo * (1 + lucro / 100); return usar90 && custo > 0 ? terminaEm90(p) : p; };
  const preco = precoCom(lucroPct);
  const lucro = preco - custo;
  const margemNoPreco = preco > 0 ? Math.round((lucro / preco) * 100) : 0;
  const tempoTexto = `${Math.floor(totalMin / 60)}h${String(Math.round(totalMin % 60)).padStart(2, "0")}`;
  const nomePeca = nome.trim() || "Peça";
  const comDesconto = (v: number, d: number) => Math.round(v * (100 - d)) / 100;

  // ---------- Resumo DETALHADO (para a equipe) ----------
  const resumoInterno = [
    `🧮 *CÁLCULO — ${nomePeca.toUpperCase()}*`,
    "",
    `🧵 Filamento: ${pesoUsado.toLocaleString("pt-BR")} g${pesoUsado !== pesoReal ? ` (real ${pesoReal.toLocaleString("pt-BR")} g)` : ""} × ${reais(cfg.precoKg)}/kg = ${reais(filamento)}`,
    `⏱️ Impressão: ${tempoTexto} × ${reais(valorHora)}/h (peça ${rotuloTamanho}) = ${reais(impressao)}`,
    ...(extras ? [`➕ Extras (embalagem ${reais(num(embalagem))} · acabamento ${reais(num(acabamento))} · outros ${reais(num(outros))}) = ${reais(extras)}`] : []),
    ...(perdas ? [`⚠️ Perdas ${perdas}% = ${reais(valorPerdas)}`] : []),
    `💵 *Custo de produção: ${reais(custo)}*`,
    "━━━━━━━━━━━━━━━",
    `🏷️ *Preço de venda: ${reais(preco)}* (lucro de ${lucroPct}% sobre o custo)`,
    `💰 Lucro: ${reais(lucro)} por peça (${margemNoPreco}% do preço)`,
    "",
    "📊 *Comparando lucros:*",
    ...LUCROS_COMPARAR.map((l) => `• ${l}% → ${reais(precoCom(l))} (lucro ${reais(precoCom(l) - custo)})`),
    "",
    `🎁 *Se der desconto em ${reais(preco)}:*`,
    ...[5, 10, 15].map((d) => `• ${d}% → ${reais(comDesconto(preco, d))} (lucro ${reais(comDesconto(preco, d) - custo)})`),
    "",
    "📦 *Por quantidade:*",
    ...cfg.faixas.map((f) => `• ${f.qtd}+ un. (−${f.desconto}%) → ${reais(comDesconto(preco, f.desconto))} cada (lucro ${reais(comDesconto(preco, f.desconto) - custo)} por peça)`),
  ].join("\n");

  // ---------- Bloco do item na mensagem do CLIENTE ----------
  const blocoCliente = (it: { nome: string; emoji: string; preco: number }) =>
    [`${it.emoji} ${it.nome.toUpperCase()}`, `• Unidade: ${reais(it.preco)}`,
      ...cfg.faixas.map((f) => `• A partir de ${f.qtd} unidades: ${reais(comDesconto(it.preco, f.desconto))} cada`)].join("\n");

  function salvarItem() {
    if (!custo) return avisar("Preencha peso e tempo primeiro.");
    const novo: Item = { nome: nomePeca, emoji, custo, preco, quando: new Date().toISOString(), resumo: resumoInterno };
    guardarItens([novo, ...itens.filter((i) => i.nome !== novo.nome)].slice(0, 40));
    setMarcados((m) => [0, ...m.map((x) => x + 1)]);
    avisar("✓ Peça salva e marcada para a mensagem do cliente.");
  }

  const mensagemCliente = [cfg.cabecalho, "", ...marcados.map((i) => itens[i]).filter(Boolean).map((it) => blocoCliente(it)).join("\n\n").split("\n"), "", cfg.rodape].join("\n");

  const enviarParaLoja = () => window.open(linkWhatsApp(whatsLoja, resumoInterno), "_blank");
  const enviarParaCliente = () => window.open(linkWhatsApp("", mensagemCliente), "_blank"); // escolhe o contato no WhatsApp

  const campo = "w-full rounded-lg border bg-white px-3 py-2";
  const chip = (ligado: boolean) => (ligado ? { background: cor, color: "white", borderColor: cor } : { background: "white" });

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* ===== Entradas ===== */}
        <div>
          <Bloco titulo="🏷️ Peça">
            <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Mascote do Flamengo musculoso — 10 cm" />
            <div className="flex flex-wrap items-center gap-1 text-sm">
              Emoji na mensagem:
              {EMOJIS.map((e) => <button key={e} type="button" onClick={() => setEmoji(e)} className="rounded-lg border px-2 py-1" style={emoji === e ? { borderColor: cor, borderWidth: 2 } : {}}>{e}</button>)}
            </div>
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
            {pesoReal > 0 && <p className="text-sm">Peso usado na conta: <b>{pesoUsado.toLocaleString("pt-BR")} g</b>{pesoUsado !== pesoReal && <span className="opacity-60"> (de {pesoReal.toLocaleString("pt-BR")} g — a sobra cobre purga e falhas)</span>}</p>}
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

        {/* ===== Resultado ===== */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-2xl p-5 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
            <b className="text-sm uppercase tracking-wide opacity-80">Custo de produção</b>
            <table className="mt-2 w-full text-sm">
              <tbody>
                <tr><td>🧵 Filamento ({pesoUsado.toLocaleString("pt-BR")} g)</td><td className="text-right">{reais(filamento)}</td></tr>
                <tr><td>⏱️ Impressão ({tempoTexto} × {reais(valorHora)})</td><td className="text-right">{reais(impressao)}</td></tr>
                {extras > 0 && <tr><td>➕ Extras</td><td className="text-right">{reais(extras)}</td></tr>}
                {perdas > 0 && <tr><td>⚠️ Perdas ({perdas}%)</td><td className="text-right">{reais(valorPerdas)}</td></tr>}
                <tr className="border-t border-white/30 text-base font-bold"><td className="pt-1">Custo</td><td className="pt-1 text-right">{reais(custo)}</td></tr>
              </tbody>
            </table>

            <div className="mt-4 rounded-xl bg-white/15 p-3">
              <div className="flex items-center justify-between text-sm"><b>🛍️ Preço de venda</b><span>lucro de <b>{lucroPct}%</b></span></div>
              <input type="range" min={0} max={200} step={5} value={lucroPct} onChange={(e) => setLucroPct(Number(e.target.value))} className="w-full" aria-label="Lucro sobre o custo" />
              <div className="flex flex-wrap gap-1">
                {[50, 75, 100, 150, 200].map((l) => (
                  <button key={l} type="button" onClick={() => setLucroPct(l)} className="rounded-full px-2 py-0.5 text-xs" style={lucroPct === l ? { background: "white", color: cor } : { background: "rgb(255 255 255 / .15)" }}>{l}%</button>
                ))}
              </div>
              <p className="mt-1 text-4xl font-bold">{reais(preco)}</p>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={usar90} onChange={(e) => setUsar90(e.target.checked)} /> Terminar em ,90 (preço de vitrine)</label>
              <p className="mt-1 text-sm">Lucro: <b>{reais(lucro)}</b> por peça · {margemNoPreco}% do preço</p>
              <p className="mt-1 text-[11px] opacity-80">“Lucro sobre o custo”: custo {reais(50)} com 100% → preço {reais(100)} (o dobro). Com 150% → {reais(125)}.</p>
            </div>

            {/* Comparação e descontos */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/10 p-2">
                <b className="block">📊 Outros lucros</b>
                {LUCROS_COMPARAR.map((l) => <button key={l} type="button" onClick={() => setLucroPct(l)} className="block w-full text-left">{l}% → {reais(precoCom(l))}</button>)}
              </div>
              <div className="rounded-xl bg-white/10 p-2">
                <b className="block">🎁 Com desconto</b>
                {[5, 10, 15].map((d) => <span key={d} className="block">−{d}% → {reais(comDesconto(preco, d))} <span className="opacity-70">(lucro {reais(comDesconto(preco, d) - custo)})</span></span>)}
              </div>
            </div>

            {aviso && <p className="mt-2 text-sm">{aviso}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={enviarParaLoja} className="rounded-xl bg-green-600 p-2 text-sm font-semibold" title="Manda o cálculo completo para o WhatsApp da loja">📲 Resumo p/ a equipe</button>
              <button type="button" onClick={async () => avisar((await copiarTexto(resumoInterno)) ? "✓ Resumo copiado!" : "Não deu para copiar.")} className="rounded-xl bg-white/20 p-2 text-sm font-semibold">📋 Copiar resumo</button>
              <button type="button" onClick={salvarItem} className="col-span-2 rounded-xl bg-white p-2 text-sm font-semibold" style={{ color: cor }}>💾 Salvar peça (vai para a mensagem do cliente)</button>
            </div>
            {/* 🧵 Baixar o filamento usado do estoque de materiais */}
            {materiais.length > 0 && (
              <div className="mt-3 rounded-xl bg-white/10 p-2 text-sm">
                <b className="block">🧵 Baixar do estoque de material</b>
                <div className="mt-1 flex gap-2">
                  <select value={materialAlvo} onChange={(e) => setMaterialAlvo(e.target.value)} className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-stone-900">
                    <option value="">Qual filamento?</option>
                    {materiais.map((m) => <option key={m.id} value={m.id}>{m.nome} ({Math.round(Number(m.quantidade))} g)</option>)}
                  </select>
                  <button type="button" disabled={!materialAlvo || !pesoUsado} className="rounded-lg bg-white px-3 font-semibold disabled:opacity-40" style={{ color: cor }}
                    onClick={async () => {
                      const m = materiais.find((x) => x.id === materialAlvo)!;
                      const nova = Math.max(0, Number(m.quantidade) - pesoUsado);
                      const { error } = await supabaseNavegador().from("materiais").update({ quantidade: nova }).eq("id", m.id);
                      if (error) return avisar(`Erro: ${error.message}`);
                      setMateriais(materiais.map((x) => (x.id === m.id ? { ...x, quantidade: nova } : x)));
                      avisar(`✓ Baixados ${pesoUsado} g de ${m.nome} (sobram ${Math.round(nova)} g)`);
                    }}>−{pesoUsado} g</button>
                </div>
              </div>
            )}
            {/* Manda o custo (e o preço, se quiser) direto para um produto do catálogo */}
            <div className="mt-3 rounded-xl bg-white/10 p-2 text-sm">
              <b className="block">📤 Usar num produto do catálogo</b>
              <select value={produtoAlvo} onChange={(e) => setProdutoAlvo(e.target.value)} className="mt-1 w-full rounded-lg px-2 py-1.5 text-stone-900">
                <option value="">Escolha o produto...</option>
                {produtosLoja.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" disabled={!produtoAlvo || !custo} className="rounded-lg bg-white/20 p-1.5 font-semibold disabled:opacity-40"
                  onClick={async () => { const { error } = await supabaseNavegador().from("produtos").update({ custo: Math.round(custo * 100) / 100, tempo_min: Math.round(totalMin) || null }).eq("id", produtoAlvo); avisar(error ? `Erro: ${error.message}` : "✓ Custo salvo no produto!"); }}>
                  Só o custo
                </button>
                <button type="button" disabled={!produtoAlvo || !custo} className="rounded-lg bg-white p-1.5 font-semibold disabled:opacity-40" style={{ color: cor }}
                  onClick={async () => { if (!confirm(`Atualizar o produto com custo ${reais(custo)} e preço ${reais(preco)}?`)) return; const { error } = await supabaseNavegador().from("produtos").update({ custo: Math.round(custo * 100) / 100, preco: Math.round(preco * 100) / 100, tempo_min: Math.round(totalMin) || null }).eq("id", produtoAlvo); avisar(error ? `Erro: ${error.message}` : "✓ Custo e preço salvos no produto!"); }}>
                  Custo + preço
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Preço por quantidade ===== */}
      <Bloco titulo="📦 Preço por quantidade (desconto por faixa)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left opacity-60"><th className="py-1">A partir de</th><th>Desconto</th><th>Preço por peça</th><th>Lucro por peça</th><th /></tr></thead>
            <tbody>
              <tr className="border-t"><td className="py-2">1 unidade</td><td>—</td><td className="font-semibold">{reais(preco)}</td><td>{reais(lucro)}</td><td /></tr>
              {cfg.faixas.map((f, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2"><input className="w-16 rounded border px-1" inputMode="numeric" value={f.qtd} onChange={(e) => mudarCfg({ faixas: cfg.faixas.map((x, j) => (j === i ? { ...x, qtd: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)) })} /> un.</td>
                  <td><input className="w-14 rounded border px-1" inputMode="numeric" value={f.desconto} onChange={(e) => mudarCfg({ faixas: cfg.faixas.map((x, j) => (j === i ? { ...x, desconto: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)) })} /> %</td>
                  <td className="font-semibold">{reais(comDesconto(preco, f.desconto))}</td>
                  <td style={{ color: comDesconto(preco, f.desconto) - custo < custo * 0.3 ? "#dc2626" : undefined }}>{reais(comDesconto(preco, f.desconto) - custo)}</td>
                  <td><button type="button" onClick={() => mudarCfg({ faixas: cfg.faixas.filter((_, j) => j !== i) })} className="text-red-600" aria-label="Remover faixa">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => mudarCfg({ faixas: [...cfg.faixas, { qtd: 100, desconto: 12 }] })} className="w-fit rounded-full border px-4 py-1.5 text-sm">+ Faixa</button>
        <p className="text-xs opacity-60">As faixas ficam salvas e entram na mensagem do cliente (“A partir de 20 unidades: R$ … cada”). Lucro em vermelho = ficou baixo.</p>
      </Bloco>

      {/* ===== Mensagem para o cliente ===== */}
      <Bloco titulo="💬 Mensagem para o cliente">
        {itens.length === 0 ? <p className="text-sm opacity-60">Calcule uma peça e toque em “💾 Salvar peça”. Ela aparece aqui para montar a mensagem.</p> : (
          <>
            <p className="text-sm opacity-70">Marque as peças que vão na mensagem:</p>
            <ul className="space-y-1 text-sm">
              {itens.map((it, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2">
                  <input type="checkbox" checked={marcados.includes(i)} onChange={() => setMarcados((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))} />
                  <span className="flex-1">{it.emoji} {it.nome} — <b>{reais(it.preco)}</b> <span className="opacity-50">(custo {reais(it.custo)})</span></span>
                  <button type="button" aria-label="Apagar" className="text-red-600"
                    onClick={() => { guardarItens(itens.filter((_, j) => j !== i)); setMarcados((m) => m.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x))); }}>✕</button>
                </li>
              ))}
            </ul>
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-white p-3 font-sans text-sm">{mensagemCliente}</pre>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={enviarParaCliente} disabled={!marcados.length} className="flex-1 rounded-xl bg-green-600 p-3 font-semibold text-white disabled:opacity-40">📲 Enviar no WhatsApp</button>
              <button type="button" onClick={async () => avisar((await copiarTexto(mensagemCliente)) ? "✓ Mensagem copiada!" : "Não deu para copiar.")} disabled={!marcados.length} className="rounded-xl border px-4 font-semibold disabled:opacity-40">📋 Copiar</button>
            </div>
          </>
        )}
        <button type="button" onClick={() => setEditarModelo((v) => !v)} className="w-fit text-sm underline opacity-70">{editarModelo ? "Fechar o modelo" : "✏️ Editar o começo e o fim da mensagem"}</button>
        {editarModelo && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Começo<textarea rows={2} className={`${campo} mt-1`} value={cfg.cabecalho} onChange={(e) => mudarCfg({ cabecalho: e.target.value })} /></label>
            <label className="block text-sm font-semibold">Final (pagamento, condições...)<textarea rows={10} className={`${campo} mt-1`} value={cfg.rodape} onChange={(e) => mudarCfg({ rodape: e.target.value })} /></label>
            <button type="button" onClick={() => mudarCfg({ cabecalho: CABECALHO, rodape: RODAPE })} className="text-sm underline opacity-70">Voltar ao modelo original</button>
          </div>
        )}
      </Bloco>
    </>
  );
}
