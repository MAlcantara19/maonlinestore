"use client";
// =====================================================================
// 🎄 GERADOR DE CATÁLOGO TEMÁTICO
//   1. Escolha O QUE entra: tudo, uma coleção, uma categoria, destaques
//      ou promoções (e tire produtos clicando neles).
//   2. Escolha o TEMA (Natal, Natal dourado, Criança, Páscoa...), o
//      formato (Feed 4:5 ou Story 9:16) e quantos produtos por página.
//   3. Pronto: as páginas aparecem na hora. Dá para:
//        📲 Compartilhar (no celular manda todas as imagens no WhatsApp)
//        📥 Baixar as imagens   ·   📄 Salvar em PDF
// Tudo é desenhado no próprio navegador, com as fotos cadastradas.
// =====================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { formatarPreco, telefoneBonito, usuarioInstagram } from "@/lib/formato";
import { pedirIA } from "@/lib/ia";
import { TEMAS, desenharFundo, escurecer, fotoCobrindo, quebrarTexto, retanguloRedondo, temaPeloNome, type Tema } from "@/lib/catalogo";

export type ProdutoCatalogo = {
  id: string; nome: string; preco: number | null; precoCheio: number | null; aPartir: boolean; promoPct: number | null;
  esgotado: boolean; destaque: boolean; foto: string | null; categorias: string[]; colecoes: string[];
};
type LojaCatalogo = { nome: string; slug: string; cor: string; logo_url: string | null; whatsapp: string | null; instagram: string | null };
type Grupo = { id: string; nome: string; descricao?: string | null; parent_id?: string | null };

const ESCALA = 1.5; // imagens 1620×2025 (Feed) — nítidas no PDF e no celular
const FORMATOS = { feed: { L: 1080, A: 1350, nome: "Feed / WhatsApp (4:5)" }, story: { L: 1080, A: 1920, nome: "Story / Status (9:16)" } } as const;
const GRADES: Record<string, { feed: [number, number]; story: [number, number] }> = {
  "4": { feed: [2, 2], story: [2, 2] }, "6": { feed: [2, 3], story: [2, 3] }, "9": { feed: [3, 3], story: [2, 4] },
};

const imagens = new Map<string, Promise<HTMLImageElement | null>>();
function carregar(src: string | null) {
  if (!src) return Promise.resolve(null);
  if (!imagens.has(src)) imagens.set(src, new Promise((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }));
  return imagens.get(src)!;
}
// Cor de texto que dá leitura em cima de uma cor (preto ou branco)
function contraste(hex: string) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "#fff";
  const [r, g, b] = m.map((c) => parseInt(c, 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1c1917" : "#ffffff";
}
// Tamanho do título conforme a fonte (as cursivas são "miudinhas")
const fatorFonte = (f: string) => (/Great Vibes/.test(f) ? 1.35 : /Dancing/.test(f) ? 1.15 : /Bebas/.test(f) ? 1.3 : /Cinzel/.test(f) ? 0.85 : 1);

type Opcoes = {
  tema: Tema; formato: keyof typeof FORMATOS; porPagina: string; titulo: string; subtitulo: string;
  mostrarPreco: boolean; capa: boolean; final: boolean; link: string;
  prazo: string; // "🎄 Pedidos até 15/12" (vazio = não mostra)
};

export default function GeradorCatalogo({ loja, produtos, colecoes, categorias, site, inicial, prazoLoja }: {
  loja: LojaCatalogo; produtos: ProdutoCatalogo[]; colecoes: Grupo[]; categorias: Grupo[]; site: string;
  inicial: { colecao?: string; categoria?: string; tema?: string };
  prazoLoja?: { ate: string | null; texto: string | null } | null; // contagem regressiva da loja
}) {
  const nomeDoGrupo = (filtro: string) => filtro.startsWith("col:") ? colecoes.find((c) => `col:${c.id}` === filtro)?.nome ?? "" : filtro.startsWith("cat:") ? categorias.find((c) => `cat:${c.id}` === filtro)?.nome ?? "" : "";
  const filtroInicial = inicial.colecao ? `col:${inicial.colecao}` : inicial.categoria ? `cat:${inicial.categoria}` : "todos";
  const temaInicial = TEMAS.find((t) => t.id === inicial.tema)?.id ?? temaPeloNome(nomeDoGrupo(filtroInicial)) ?? "natal";

  const [filtro, setFiltro] = useState(filtroInicial);
  const [temaId, setTemaId] = useState(temaInicial);
  const [formato, setFormato] = useState<keyof typeof FORMATOS>("feed");
  const [porPagina, setPorPagina] = useState("4");
  const [titulo, setTitulo] = useState(() => TEMAS.find((t) => t.id === temaInicial)!.titulo);
  const [subtitulo, setSubtitulo] = useState(() => TEMAS.find((t) => t.id === temaInicial)!.subtitulo);
  const [mostrarPreco, setMostrarPreco] = useState(true);
  const [semEsgotados, setSemEsgotados] = useState(true);
  const [capa, setCapa] = useState(true);
  const [final, setFinal] = useState(true);
  const [ordem, setOrdem] = useState<"padrao" | "menor" | "maior" | "az">("padrao");
  const [fora, setFora] = useState<string[]>([]);
  const [ate, setAte] = useState<number | null>(null);
  const [prazo, setPrazo] = useState(() => {
    if (!prazoLoja?.ate) return "";
    const d = new Date(prazoLoja.ate);
    return `${prazoLoja.texto?.trim() || "Pedidos até"} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [legendas, setLegendas] = useState<string[]>([]);
  const [escrevendo, setEscrevendo] = useState(false);
  const [avisoIA, setAvisoIA] = useState("");
  const [paginas, setPaginas] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);
  const [aberta, setAberta] = useState<number | null>(null);
  const vez = useRef(0);

  // Tema "Cores da loja" usa a cor de verdade da loja
  const tema = useMemo<Tema>(() => {
    const t = TEMAS.find((x) => x.id === temaId) ?? TEMAS[0];
    return t.id === "loja" ? { ...t, fundo: [loja.cor, escurecer(loja.cor, 0.55)] } : t;
  }, [temaId, loja.cor]);

  function trocarTema(id: string) {
    const antigo = TEMAS.find((t) => t.id === temaId)!, novo = TEMAS.find((t) => t.id === id)!;
    if (titulo === antigo.titulo) setTitulo(novo.titulo); // só troca o texto se a pessoa não tinha mudado
    if (subtitulo === antigo.subtitulo) setSubtitulo(novo.subtitulo);
    setTemaId(id);
  }
  function trocarFiltro(f: string) {
    setFiltro(f); setFora([]);
    const sugerido = temaPeloNome(nomeDoGrupo(f));
    if (sugerido && sugerido !== temaId) trocarTema(sugerido);
  }

  // Quais produtos entram
  const doFiltro = useMemo(() => {
    const subsDe = (id: string) => [id, ...categorias.filter((c) => c.parent_id === id).map((c) => c.id)];
    let lista = produtos.filter((p) => {
      if (semEsgotados && p.esgotado) return false;
      if (ate != null && (p.preco == null || p.preco > ate)) return false;
      if (filtro === "destaques") return p.destaque;
      if (filtro === "promocoes") return !!p.promoPct;
      if (filtro.startsWith("col:")) return p.colecoes.includes(filtro.slice(4));
      if (filtro.startsWith("cat:")) { const ids = subsDe(filtro.slice(4)); return p.categorias.some((c) => ids.includes(c)); }
      return true;
    });
    const valor = (p: ProdutoCatalogo) => p.preco ?? Infinity;
    if (ordem === "menor") lista = [...lista].sort((a, b) => valor(a) - valor(b));
    if (ordem === "maior") lista = [...lista].sort((a, b) => (valor(b) === Infinity ? -1 : valor(b)) - (valor(a) === Infinity ? -1 : valor(a)));
    if (ordem === "az") lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return lista;
  }, [produtos, filtro, semEsgotados, ordem, categorias, ate]);
  const escolhidos = doFiltro.filter((p) => !fora.includes(p.id));

  // Link do QR Code: página da coleção (se escolheu uma) ou a loja
  const link = filtro.startsWith("col:") ? `${site}/${loja.slug}/colecao/${filtro.slice(4)}` : filtro.startsWith("cat:") ? `${site}/${loja.slug}#categoria-${filtro.slice(4)}` : `${site}/${loja.slug}`;

  // Redesenha sozinho 0,6 s depois de qualquer mudança
  useEffect(() => {
    const minhaVez = ++vez.current;
    const t = setTimeout(async () => {
      setGerando(true);
      try {
        const feitas = await gerarPaginas(loja, escolhidos, { tema, formato, porPagina, titulo, subtitulo, mostrarPreco, capa, final, link, prazo });
        if (minhaVez === vez.current) setPaginas(feitas);
      } finally { if (minhaVez === vez.current) setGerando(false); }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, formato, porPagina, titulo, subtitulo, mostrarPreco, capa, final, link, prazo, escolhidos.map((p) => p.id).join(",")]);
  useEffect(() => setLegendas([]), [paginas.length, filtro, temaId]);

  // ✨ Uma legenda pronta para cada página (precisa estar logado no painel neste aparelho)
  async function escreverLegendas() {
    setEscrevendo(true); setAvisoIA("");
    const [cols, linhas] = GRADES[porPagina][formato];
    const porPag = cols * linhas;
    const blocos: string[] = [];
    if (capa) blocos.push(`CAPA do catálogo "${titulo}" — ${subtitulo}`);
    for (let i = 0; i < escolhidos.length; i += porPag) blocos.push(escolhidos.slice(i, i + porPag).map((p) => `${p.nome}${p.preco != null ? ` (${formatarPreco(p.preco)})` : ""}`).join("; "));
    if (final) blocos.push("Página final: como fazer o pedido pelo WhatsApp / QR Code");
    try {
      const texto = await pedirIA(loja.slug, "catalogo", { titulo, tema: tema.nome, prazo, link, paginas: blocos.map((b, i) => `Página ${i + 1}: ${b}`).join("\n") });
      setLegendas(texto.split(/^\s*={3,}\s*$/m).map((t) => t.replace(/^\s*P[áa]gina \d+\s*[:\-–]?\s*/i, "").trim()).filter(Boolean));
    } catch (e) { setAvisoIA(`😕 ${(e as Error).message} (o assistente só funciona com o painel aberto e logado neste aparelho)`); }
    setEscrevendo(false);
  }

  const nomeArquivo = (i: number) => `catalogo-${loja.slug}-${tema.id}-${String(i + 1).padStart(2, "0")}.jpg`;
  async function arquivos() {
    return Promise.all(paginas.map(async (url, i) => new File([await (await fetch(url)).blob()], nomeArquivo(i), { type: "image/jpeg" })));
  }
  async function compartilhar() {
    const lista = await arquivos();
    if (navigator.canShare?.({ files: lista })) await navigator.share({ files: lista, title: titulo, text: `${titulo} · ${loja.nome}\n${link}` }).catch(() => {});
    else baixarTodas();
  }
  function baixar(i: number) { const a = document.createElement("a"); a.href = paginas[i]; a.download = nomeArquivo(i); a.click(); }
  function baixarTodas() { paginas.forEach((_, i) => setTimeout(() => baixar(i), i * 350)); }

  const { L, A } = FORMATOS[formato];
  const cor = loja.cor;
  const caixa = "rounded-xl border bg-white px-3 py-2 text-sm text-stone-900";

  return (
    <div className="catalogo-raiz min-h-screen bg-stone-100 text-stone-900">
      {/* Na impressão (PDF) só saem as páginas, uma por folha, do tamanho certinho */}
      <style>{`
        .so-impressao { display: none; }
        @media print {
          @page { size: ${L}px ${A}px; margin: 0; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          .catalogo-raiz { min-height: 0 !important; }
          .nao-imprimir { display: none !important; }
          .so-impressao { display: block; }
          .so-impressao img { display: block; width: ${L}px; height: ${A}px; break-after: page; page-break-after: always; }
          .so-impressao img:last-child { break-after: auto; page-break-after: auto; }
        }`}</style>

      <div className="nao-imprimir mx-auto max-w-6xl p-4">
        <header className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4 text-white shadow" style={{ background: `linear-gradient(135deg, ${cor}, ${escurecer(cor, 0.4)})` }}>
          {loja.logo_url && <img src={loja.logo_url} alt="" className="h-12 w-12 rounded-full border-2 border-white bg-white object-cover" />}
          <div className="flex-1">
            <h1 className="text-xl font-bold">🎨 Catálogo temático · {loja.nome}</h1>
            <p className="text-sm opacity-90">Escolha os produtos e o tema — as páginas ficam prontas na hora para PDF, WhatsApp e Instagram.</p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          {/* ---------- Opções ---------- */}
          <aside className="space-y-4">
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-bold">1. O que entra</h2>
              <select value={filtro} onChange={(e) => trocarFiltro(e.target.value)} className={`${caixa} w-full`}>
                <option value="todos">📦 Todos os produtos</option>
                <option value="destaques">⭐ Só os destaques</option>
                <option value="promocoes">🏷️ Só as promoções</option>
                {colecoes.length > 0 && <optgroup label="Coleções">{colecoes.map((c) => <option key={c.id} value={`col:${c.id}`}>✨ {c.nome}</option>)}</optgroup>}
                {categorias.length > 0 && <optgroup label="Categorias">{categorias.map((c) => <option key={c.id} value={`cat:${c.id}`}>{c.parent_id ? "   ↳ " : "🗂️ "}{c.nome}</option>)}</optgroup>}
              </select>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} className={caixa} aria-label="Ordem">
                  <option value="padrao">Ordem da loja</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="az">A–Z</option>
                </select>
                <select value={ate ?? ""} onChange={(e) => setAte(e.target.value ? Number(e.target.value) : null)} className={caixa} aria-label="Faixa de preço">
                  <option value="">💰 Qualquer preço</option><option value="50">🎁 Até R$ 50</option><option value="100">🎁 Até R$ 100</option><option value="200">🎁 Até R$ 200</option>
                </select>
                <label className="flex items-center gap-1"><input type="checkbox" checked={semEsgotados} onChange={(e) => setSemEsgotados(e.target.checked)} /> Sem esgotados</label>
              </div>
              <p className="mt-3 text-xs opacity-60">Toque para tirar/colocar um produto ({escolhidos.length} de {doFiltro.length}):</p>
              <div className="mt-1 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
                {doFiltro.map((p) => {
                  const sai = fora.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => setFora((f) => (sai ? f.filter((x) => x !== p.id) : [...f, p.id]))}
                      className={`flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 text-xs ${sai ? "opacity-40 line-through" : ""}`}>
                      <span className="h-6 w-6 overflow-hidden rounded-full bg-stone-200">{p.foto && <img src={p.foto} alt="" className="h-full w-full object-cover" />}</span>
                      {p.nome.slice(0, 22)}
                    </button>
                  );
                })}
                {doFiltro.length === 0 && <p className="text-sm opacity-60">Nenhum produto aqui 😕</p>}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-bold">2. Tema</h2>
              <div className="grid grid-cols-2 gap-2">
                {TEMAS.map((t) => {
                  const fundo = t.id === "loja" ? [loja.cor, escurecer(loja.cor, 0.55)] : t.fundo;
                  return (
                    <button key={t.id} type="button" onClick={() => trocarTema(t.id)}
                      className="rounded-xl p-2 text-left text-xs font-semibold shadow-sm transition-transform hover:scale-[1.03]"
                      style={{ background: `linear-gradient(${fundo[0]}, ${fundo[1]})`, color: t.texto, outline: temaId === t.id ? `3px solid ${cor}` : "none", outlineOffset: 2 }}>
                      <span className="text-lg">{t.emoji}</span><br />{t.nome}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="font-bold">3. Textos e formato</h2>
              <label className="block text-sm font-semibold">Título<input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={40} className={`${caixa} mt-1 w-full`} /></label>
              <label className="block text-sm font-semibold">Frase<input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} maxLength={60} className={`${caixa} mt-1 w-full`} /></label>
              <label className="block text-sm font-semibold">⏳ Selo de prazo (vazio = sem selo)<input value={prazo} onChange={(e) => setPrazo(e.target.value)} maxLength={34} placeholder="Ex.: Pedidos de Natal até 15/12" className={`${caixa} mt-1 w-full`} /></label>
              <div className="flex gap-2">
                <select value={formato} onChange={(e) => setFormato(e.target.value as typeof formato)} className={`${caixa} flex-1`} aria-label="Formato">
                  {Object.entries(FORMATOS).map(([k, f]) => <option key={k} value={k}>{f.nome}</option>)}
                </select>
                <select value={porPagina} onChange={(e) => setPorPagina(e.target.value)} className={caixa} aria-label="Produtos por página">
                  <option value="4">4 por página</option><option value="6">6 por página</option><option value="9">{formato === "story" ? "8" : "9"} por página</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" checked={mostrarPreco} onChange={(e) => setMostrarPreco(e.target.checked)} /> Mostrar preços</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={capa} onChange={(e) => setCapa(e.target.checked)} /> Página de capa</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={final} onChange={(e) => setFinal(e.target.checked)} /> &quot;Como pedir&quot;</label>
              </div>
              <p className="break-all text-xs opacity-60">QR Code leva para: {link.replace(/^https?:\/\//, "")}</p>
            </section>
          </aside>

          {/* ---------- Resultado ---------- */}
          <main>
            <div className="sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/95 p-3 shadow backdrop-blur">
              <b className="flex-1 text-sm">{gerando ? "⏳ Desenhando as páginas..." : `✅ ${paginas.length} ${paginas.length === 1 ? "página pronta" : "páginas prontas"}`}</b>
              <button type="button" disabled={!paginas.length || gerando} onClick={compartilhar} className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: "#25D366" }}>📲 Compartilhar</button>
              <button type="button" disabled={!paginas.length || gerando} onClick={baixarTodas} className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-40">📥 Baixar imagens</button>
              <button type="button" disabled={!paginas.length || gerando || escrevendo} onClick={escreverLegendas} className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 disabled:opacity-40">{escrevendo ? "✨ Escrevendo..." : "✨ Legendas com IA"}</button>
              <button type="button" disabled={!paginas.length || gerando} onClick={() => window.print()} className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: cor }}>📄 Salvar PDF</button>
            </div>
            {avisoIA && <p className="mb-2 text-sm text-red-600">{avisoIA}</p>}
            <p className="mb-3 text-xs opacity-60">💡 PDF: na janela que abrir, escolha <b>&quot;Salvar como PDF&quot;</b> e deixe as margens em <b>&quot;Nenhuma&quot;</b>. No celular, &quot;Compartilhar&quot; manda todas as imagens de uma vez para o WhatsApp.</p>
            <div className={`grid gap-3 ${formato === "story" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 xl:grid-cols-3"}`}>
              {paginas.map((url, i) => (
                <div key={i}>
                  <button type="button" onClick={() => setAberta(i)} className="group relative block w-full overflow-hidden rounded-xl shadow-md transition-transform hover:scale-[1.02]" style={{ opacity: gerando ? 0.5 : 1 }}>
                    <img src={url} alt={`Página ${i + 1}`} className="w-full" />
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{i + 1}</span>
                  </button>
                  {legendas[i] && (
                    <div className="mt-1.5 rounded-lg bg-white p-2 text-xs shadow-sm">
                      <p className="max-h-28 overflow-y-auto whitespace-pre-line">{legendas[i]}</p>
                      <button type="button" onClick={() => navigator.clipboard.writeText(legendas[i]).catch(() => {})} className="mt-1 font-semibold text-violet-700">📋 Copiar legenda</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Página aberta em tamanho grande */}
      {aberta != null && paginas[aberta] && (
        <div className="nao-imprimir fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/85 p-4" onClick={() => setAberta(null)}>
          <img src={paginas[aberta]} alt="" className="max-h-[80vh] max-w-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button type="button" disabled={aberta === 0} onClick={() => setAberta(aberta - 1)} className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-40">◀</button>
            <button type="button" onClick={() => baixar(aberta)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold">📥 Baixar esta</button>
            <button type="button" disabled={aberta === paginas.length - 1} onClick={() => setAberta(aberta + 1)} className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-40">▶</button>
            <button type="button" onClick={() => setAberta(null)} className="rounded-full bg-white px-4 py-2 text-sm">✕</button>
          </div>
        </div>
      )}

      <div className="so-impressao">{paginas.map((url, i) => <img key={i} src={url} alt="" />)}</div>
    </div>
  );
}

// =====================================================================
// DESENHO DAS PÁGINAS
// =====================================================================
async function gerarPaginas(loja: LojaCatalogo, produtos: ProdutoCatalogo[], o: Opcoes): Promise<string[]> {
  const { L, A } = FORMATOS[o.formato];
  const [cols, linhas] = GRADES[o.porPagina][o.formato];
  const porPag = cols * linhas;
  try { await document.fonts.load(`700 80px ${o.tema.fonteTitulo}`); } catch {}
  const [logo, qr] = await Promise.all([
    carregar(loja.logo_url),
    carregar(await QRCode.toDataURL(o.link, { margin: 1, width: 400, color: { dark: "#1c1917", light: "#ffffff" } })),
  ]);
  const fotos = new Map(await Promise.all(produtos.map(async (p) => [p.id, await carregar(p.foto)] as const)));

  const blocos: ProdutoCatalogo[][] = [];
  for (let i = 0; i < produtos.length; i += porPag) blocos.push(produtos.slice(i, i + porPag));
  const total = (o.capa ? 1 : 0) + blocos.length + (o.final ? 1 : 0);
  const saida: string[] = [];
  let n = 0;

  const nova = () => {
    const c = document.createElement("canvas");
    c.width = L * ESCALA; c.height = A * ESCALA;
    const ctx = c.getContext("2d")!;
    ctx.scale(ESCALA, ESCALA);
    ctx.textBaseline = "alphabetic";
    desenharFundo(ctx, o.tema, L, A, 1234 + n * 97);
    return { c, ctx };
  };
  const fechar = (c: HTMLCanvasElement) => { saida.push(c.toDataURL("image/jpeg", 0.9)); n++; };

  if (o.capa) { const { c, ctx } = nova(); desenharCapa(ctx, L, A, loja, produtos, fotos, logo, qr, o); fechar(c); }
  blocos.forEach((bloco) => {
    const { c, ctx } = nova();
    desenharPaginaProdutos(ctx, L, A, cols, linhas, bloco, fotos, logo, qr, loja, o, n + 1, total);
    fechar(c);
  });
  if (o.final) { const { c, ctx } = nova(); desenharFinal(ctx, L, A, loja, logo, qr, o); fechar(c); }
  return saida;
}

type Fotos = Map<string, HTMLImageElement | null>;
type Ctx = CanvasRenderingContext2D;

function sombra(ctx: Ctx, ligar: boolean) {
  ctx.shadowColor = ligar ? "rgba(0,0,0,0.28)" : "transparent";
  ctx.shadowBlur = ligar ? 22 : 0;
  ctx.shadowOffsetY = ligar ? 8 : 0;
}

function logoRedonda(ctx: Ctx, logo: HTMLImageElement | null, x: number, y: number, r: number, cor: string) {
  ctx.save(); sombra(ctx, true);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); sombra(ctx, false);
  ctx.strokeStyle = cor; ctx.lineWidth = r * 0.07; ctx.stroke();
  if (logo) { ctx.beginPath(); ctx.arc(x, y, r * 0.93, 0, Math.PI * 2); ctx.clip(); fotoCobrindo(ctx, logo, x - r * 0.93, y - r * 0.93, r * 1.86, r * 1.86); }
  ctx.restore();
}

function textoCentro(ctx: Ctx, texto: string, x: number, y: number, fonte: string, cor: string, largura?: number) {
  ctx.font = fonte; ctx.fillStyle = cor; ctx.textAlign = "center";
  let t = texto;
  if (largura) while (ctx.measureText(t).width > largura && t.length > 3) t = t.slice(0, -1);
  ctx.fillText(t === texto ? t : `${t.trim()}…`, x, y);
  ctx.textAlign = "left";
}

function precoTexto(p: ProdutoCatalogo) {
  if (p.preco == null) return "Sob consulta";
  return `${p.aPartir ? "a partir de " : ""}${formatarPreco(p.preco)}`;
}

function desenharCabecalho(ctx: Ctx, L: number, loja: LojaCatalogo, logo: HTMLImageElement | null, o: Opcoes) {
  const t = o.tema;
  logoRedonda(ctx, logo, L / 2, 92, 46, t.destaque);
  ctx.save(); ctx.letterSpacing = "6px";
  textoCentro(ctx, loja.nome.toUpperCase(), L / 2, 166, "700 22px system-ui, sans-serif", t.texto, L - 300);
  ctx.restore();
  const tam = Math.round(64 * fatorFonte(t.fonteTitulo));
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 8;
  textoCentro(ctx, o.titulo, L / 2, 170 + tam * 0.95, `700 ${tam}px ${t.fonteTitulo}`, t.id === "natal-dourado" ? t.destaque : t.texto, L - 120);
  ctx.restore();
}

function desenharRodape(ctx: Ctx, L: number, A: number, loja: LojaCatalogo, qr: HTMLImageElement | null, o: Opcoes, pagina?: number, total?: number) {
  const t = o.tema, y = A - 128, tx = qr ? 172 : 48;
  if (qr) {
    ctx.save(); sombra(ctx, true); ctx.fillStyle = "#fff"; retanguloRedondo(ctx, 48, y, 104, 104, 14); ctx.fill(); ctx.restore();
    ctx.drawImage(qr, 54, y + 6, 92, 92);
  }
  ctx.fillStyle = t.texto; ctx.font = "800 26px system-ui, sans-serif";
  ctx.fillText(loja.whatsapp ? `📲 Peça pelo WhatsApp ${telefoneBonito(loja.whatsapp)}` : "📲 Peça pelo WhatsApp", tx, y + 40);
  ctx.font = "500 22px system-ui, sans-serif"; ctx.globalAlpha = 0.9;
  const insta = usuarioInstagram(loja.instagram);
  ctx.fillText(`${insta ? `@${insta}  ·  ` : ""}${o.link.replace(/^https?:\/\//, "").replace(/#.*/, "")}`, tx, y + 76);
  ctx.globalAlpha = 1;
  if (o.prazo.trim()) {
    ctx.font = "800 22px system-ui, sans-serif";
    const txt = `⏳ ${o.prazo.trim()}`, w = ctx.measureText(txt).width + 32;
    // selo logo ACIMA do rodapé, à direita (não briga com o WhatsApp)
    ctx.save(); sombra(ctx, true); ctx.fillStyle = t.destaque; retanguloRedondo(ctx, L - 48 - w, y - 58, w, 42, 21); ctx.fill(); ctx.restore();
    ctx.fillStyle = contraste(t.destaque); ctx.textAlign = "right"; ctx.fillText(txt, L - 64, y - 29); ctx.textAlign = "left";
  }
  if (pagina && total) {
    ctx.textAlign = "right"; ctx.font = "700 20px system-ui, sans-serif"; ctx.globalAlpha = 0.75;
    ctx.fillText(`${pagina}/${total}`, L - 48, y + 76); ctx.globalAlpha = 1; ctx.textAlign = "left";
  }
}

function desenharPaginaProdutos(ctx: Ctx, L: number, A: number, cols: number, linhas: number, bloco: ProdutoCatalogo[], fotos: Fotos,
  logo: HTMLImageElement | null, qr: HTMLImageElement | null, loja: LojaCatalogo, o: Opcoes, pagina: number, total: number) {
  const t = o.tema;
  desenharCabecalho(ctx, L, loja, logo, o);
  const topo = 300, base = A - (o.prazo.trim() ? 200 : 160), margem = 48, vao = cols === 3 ? 22 : 28;
  const w = (L - margem * 2 - vao * (cols - 1)) / cols;
  const h = (base - topo - vao * (linhas - 1)) / linhas;
  const pequeno = cols === 3 || linhas >= 4;
  const areaTexto = pequeno ? 104 : 128;
  const fundoPreco = t.destaque, textoPreco = contraste(t.destaque);

  bloco.forEach((p, i) => {
    const x = margem + (i % cols) * (w + vao), y = topo + Math.floor(i / cols) * (h + vao);
    // cartão
    ctx.save(); sombra(ctx, true); ctx.fillStyle = t.cartao; retanguloRedondo(ctx, x, y, w, h, 26); ctx.fill(); ctx.restore();
    // foto
    const fx = x + 10, fy = y + 10, fw = w - 20, fh = h - areaTexto - 10;
    ctx.save(); retanguloRedondo(ctx, fx, fy, fw, fh, 18); ctx.clip();
    ctx.fillStyle = "#f1ece6"; ctx.fillRect(fx, fy, fw, fh);
    const img = fotos.get(p.id);
    if (img) fotoCobrindo(ctx, img, fx, fy, fw, fh);
    else textoCentro(ctx, "📷", fx + fw / 2, fy + fh / 2 + 20, "60px system-ui", "#999");
    if (p.esgotado) {
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(fx, fy, fw, fh);
      textoCentro(ctx, "ESGOTADO", fx + fw / 2, fy + fh / 2 + 12, "800 34px system-ui", "#fff");
    }
    ctx.restore();
    // selo de promoção
    if (p.promoPct && o.mostrarPreco) {
      ctx.fillStyle = "#e11d48"; retanguloRedondo(ctx, fx + 10, fy + 10, 96, 42, 21); ctx.fill();
      textoCentro(ctx, `-${p.promoPct}%`, fx + 58, fy + 40, "800 24px system-ui", "#fff");
    }
    // nome
    ctx.fillStyle = t.textoCartao; ctx.font = `700 ${pequeno ? 21 : 26}px system-ui, sans-serif`;
    const nomes = quebrarTexto(ctx, p.nome, fw, 2);
    let ty = fy + fh + (pequeno ? 28 : 34);
    nomes.forEach((l) => { ctx.fillText(l, fx, ty); ty += pequeno ? 25 : 31; });
    // preço
    if (o.mostrarPreco) {
      const txt = precoTexto(p);
      ctx.font = `800 ${pequeno ? 20 : 25}px system-ui, sans-serif`;
      const pw = Math.min(ctx.measureText(txt).width + 26, fw);
      const py = y + h - (pequeno ? 44 : 52);
      ctx.fillStyle = fundoPreco; retanguloRedondo(ctx, fx, py, pw, pequeno ? 34 : 40, 20); ctx.fill();
      ctx.fillStyle = textoPreco; ctx.fillText(txt, fx + 13, py + (pequeno ? 24 : 28));
      if (p.precoCheio && p.precoCheio !== p.preco && pw + 90 < fw) {
        ctx.font = `500 ${pequeno ? 16 : 19}px system-ui`; ctx.fillStyle = "#9a948f";
        const velho = formatarPreco(p.precoCheio), vx = fx + pw + 10, vy = py + (pequeno ? 23 : 27);
        ctx.fillText(velho, vx, vy);
        ctx.fillRect(vx, vy - 6, ctx.measureText(velho).width, 2);
      }
    }
  });
  desenharRodape(ctx, L, A, loja, qr, o, pagina, total);
}

function desenharCapa(ctx: Ctx, L: number, A: number, loja: LojaCatalogo, produtos: ProdutoCatalogo[], fotos: Fotos,
  logo: HTMLImageElement | null, qr: HTMLImageElement | null, o: Opcoes) {
  const t = o.tema;
  logoRedonda(ctx, logo, L / 2, A * 0.13, 78, t.destaque);
  ctx.save(); ctx.letterSpacing = "8px";
  textoCentro(ctx, loja.nome.toUpperCase(), L / 2, A * 0.13 + 125, "700 26px system-ui, sans-serif", t.texto, L - 200);
  ctx.restore();
  const tam = Math.round(96 * fatorFonte(t.fonteTitulo));
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 12;
  ctx.font = `700 ${tam}px ${t.fonteTitulo}`;
  const linhasTitulo = quebrarTexto(ctx, o.titulo, L - 140, 2);
  let ty = A * 0.13 + 160 + tam * 0.9;
  linhasTitulo.forEach((l) => { textoCentro(ctx, l, L / 2, ty, `700 ${tam}px ${t.fonteTitulo}`, t.id === "natal-dourado" ? t.destaque : t.texto); ty += tam * 0.95; });
  ctx.restore();
  textoCentro(ctx, o.subtitulo, L / 2, ty + 10, "500 34px system-ui, sans-serif", t.texto, L - 140);

  // "Polaroids" com as fotos dos produtos
  const comFoto = produtos.filter((p) => fotos.get(p.id)).slice(0, 3);
  const fundoUtil = A - (o.prazo.trim() ? 240 : 190);
  const meio = (ty + 40 + fundoUtil) / 2;
  const lado = Math.min(L * 0.4, fundoUtil - (ty + 60) - 40);
  const posicoes = comFoto.length >= 3 ? [[-0.6, 0.08, -0.13, 0.78], [0.6, 0.1, 0.13, 0.78], [0, 0, 0, 1]] : comFoto.length === 2 ? [[-0.36, 0.04, -0.08, 0.9], [0.36, 0, 0.08, 0.9]] : [[0, 0, 0, 1]];
  comFoto.forEach((p, i) => {
    const [dx, dy, ang, k] = posicoes[i];
    const s = lado * k;
    ctx.save(); ctx.translate(L / 2 + dx * lado, meio + dy * lado); ctx.rotate(ang);
    sombra(ctx, true); ctx.fillStyle = "#fff"; ctx.fillRect(-s / 2 - 14, -s / 2 - 14, s + 28, s + 70); sombra(ctx, false);
    ctx.save(); ctx.beginPath(); ctx.rect(-s / 2, -s / 2, s, s); ctx.clip(); fotoCobrindo(ctx, fotos.get(p.id)!, -s / 2, -s / 2, s, s); ctx.restore();
    ctx.font = "600 22px system-ui"; ctx.fillStyle = "#3a3a3a"; ctx.textAlign = "center";
    ctx.fillText(quebrarTexto(ctx, p.nome, s - 10, 1)[0] ?? "", 0, s / 2 + 42); ctx.textAlign = "left";
    ctx.restore();
  });
  if (!comFoto.length) textoCentro(ctx, t.emoji, L / 2, meio + 60, "180px system-ui", t.texto);
  desenharRodape(ctx, L, A, loja, qr, o);
}

function desenharFinal(ctx: Ctx, L: number, A: number, loja: LojaCatalogo, logo: HTMLImageElement | null, qr: HTMLImageElement | null, o: Opcoes) {
  const t = o.tema;
  logoRedonda(ctx, logo, L / 2, A * 0.12, 64, t.destaque);
  const tam = Math.round(72 * fatorFonte(t.fonteTitulo));
  textoCentro(ctx, "Como fazer seu pedido", L / 2, A * 0.12 + 100 + tam * 0.8, `700 ${tam}px ${t.fonteTitulo}`, t.id === "natal-dourado" ? t.destaque : t.texto, L - 100);
  const passos = ["Escolha seus favoritos no catálogo ou no site", "Mande uma mensagem no WhatsApp com o nome do produto", "A gente confirma, prepara com carinho e entrega 💝"];
  let y = A * 0.12 + 170 + tam;
  passos.forEach((p, i) => {
    ctx.save(); sombra(ctx, true); ctx.fillStyle = t.cartao; retanguloRedondo(ctx, 80, y, L - 160, 110, 24); ctx.fill(); ctx.restore();
    ctx.fillStyle = t.destaque; ctx.beginPath(); ctx.arc(140, y + 55, 34, 0, Math.PI * 2); ctx.fill();
    textoCentro(ctx, String(i + 1), 140, y + 68, "800 36px system-ui", contraste(t.destaque));
    ctx.fillStyle = t.textoCartao; ctx.font = "600 27px system-ui, sans-serif";
    const ls = quebrarTexto(ctx, p, L - 360, 2);
    ls.forEach((l, k) => ctx.fillText(l, 200, y + (ls.length === 1 ? 64 : 48 + k * 34)));
    y += 134;
  });
  const q = Math.min(300, A - y - (o.prazo.trim() ? 290 : 230));
  if (qr && q > 120) {
    ctx.save(); sombra(ctx, true); ctx.fillStyle = "#fff"; retanguloRedondo(ctx, L / 2 - q / 2 - 16, y + 20, q + 32, q + 32, 24); ctx.fill(); ctx.restore();
    ctx.drawImage(qr, L / 2 - q / 2, y + 36, q, q);
    textoCentro(ctx, "Aponte a câmera e veja tudo no site 📷", L / 2, y + q + 100, "600 28px system-ui, sans-serif", t.texto);
  }
  desenharRodape(ctx, L, A, loja, null, o);
}
