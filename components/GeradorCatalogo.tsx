"use client";
// =====================================================================
// 🎨 GERADOR DE CATÁLOGO TEMÁTICO
//   1. O QUE entra: tudo, coleção, categoria, destaques, promoções e
//      faixa de preço (e tire produtos clicando neles).
//   2. TEMA pronto (Natal, Kids, Páscoa, Minimalista...) e depois
//      PERSONALIZE: cores do fundo, cor de destaque, fonte do título,
//      quais enfeites aparecem, selo de prazo e o que mostrar em cada
//      produto (preço, "várias cores", "tamanhos").
//   3. Até 16 produtos por página (menos páginas = mais gente vê tudo).
//   4. 📄 PDF de verdade (arquivo limpo, sem data/endereço do navegador),
//      📲 compartilhar no WhatsApp e 📥 baixar as imagens.
// =====================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { formatarPreco, telefoneBonito, usuarioInstagram } from "@/lib/formato";
import { ENFEITES, FONTES_TITULO, TEMAS, corDeLeitura, desenharFundo, escurecer, fotoCobrindo, mistura, quebrarTexto, retanguloRedondo, temaPeloNome, type Enfeite, type Tema } from "@/lib/catalogo";
import { jpgDaUrl, pdfDeImagens } from "@/lib/pdf";

export type ProdutoCatalogo = {
  id: string; nome: string; preco: number | null; precoCheio: number | null; aPartir: boolean; promoPct: number | null;
  esgotado: boolean; destaque: boolean; foto: string | null; categorias: string[]; colecoes: string[];
  cores?: number; tamanhos?: number; escolheCor?: boolean; // 🎨 várias cores · 📏 tamanhos
};
type LojaCatalogo = { nome: string; slug: string; cor: string; logo_url: string | null; whatsapp: string | null; instagram: string | null };
type Grupo = { id: string; nome: string; descricao?: string | null; parent_id?: string | null };

const ESCALA = 1.5; // imagens 1620×2025 (Feed): nítidas no PDF e no celular
const FORMATOS = { feed: { L: 1080, A: 1350, nome: "Feed / WhatsApp (4:5)" }, story: { L: 1080, A: 1920, nome: "Story / Status (9:16)" }, a4: { L: 1080, A: 1527, nome: "Folha A4 (para imprimir)" } } as const;
type Formato = keyof typeof FORMATOS;
const GRADES: Record<string, Record<Formato, [number, number]>> = {
  "4": { feed: [2, 2], story: [2, 2], a4: [2, 2] },
  "6": { feed: [2, 3], story: [2, 3], a4: [2, 3] },
  "9": { feed: [3, 3], story: [2, 4], a4: [3, 3] },
  "12": { feed: [3, 4], story: [3, 4], a4: [3, 4] },
  "16": { feed: [4, 4], story: [3, 5], a4: [4, 4] },
};

const imagens = new Map<string, Promise<HTMLImageElement | null>>();
function carregar(src: string | null) {
  if (!src) return Promise.resolve(null);
  if (!imagens.has(src)) imagens.set(src, new Promise((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }));
  return imagens.get(src)!;
}
const fatorFonte = (f: string) => (/Great Vibes/.test(f) ? 1.35 : /Dancing/.test(f) ? 1.15 : /Bebas/.test(f) ? 1.3 : /Cinzel/.test(f) ? 0.85 : 1);

type Mostrar = { preco: boolean; opcoes: boolean; capa: boolean; final: boolean; qr: boolean; numero: boolean; cartao: boolean };
type Opcoes = { tema: Tema; formato: Formato; porPagina: string; titulo: string; subtitulo: string; link: string; prazo: string; mostrar: Mostrar };

export default function GeradorCatalogo({ loja, produtos, colecoes, categorias, site, inicial, prazoLoja }: {
  loja: LojaCatalogo; produtos: ProdutoCatalogo[]; colecoes: Grupo[]; categorias: Grupo[]; site: string;
  inicial: { colecao?: string; categoria?: string; tema?: string };
  prazoLoja?: { ate: string | null; texto: string | null } | null;
}) {
  const nomeDoGrupo = (filtro: string) => filtro.startsWith("col:") ? colecoes.find((c) => `col:${c.id}` === filtro)?.nome ?? "" : filtro.startsWith("cat:") ? categorias.find((c) => `cat:${c.id}` === filtro)?.nome ?? "" : "";
  const filtroInicial = inicial.colecao ? `col:${inicial.colecao}` : inicial.categoria ? `cat:${inicial.categoria}` : "todos";
  const temaInicial = TEMAS.find((t) => t.id === inicial.tema)?.id ?? temaPeloNome(nomeDoGrupo(filtroInicial)) ?? "natal";
  const base0 = TEMAS.find((t) => t.id === temaInicial)!;

  // ---------- o que entra ----------
  const [filtro, setFiltro] = useState(filtroInicial);
  const [ate, setAte] = useState<number | null>(null);
  const [semEsgotados, setSemEsgotados] = useState(true);
  const [ordem, setOrdem] = useState<"padrao" | "menor" | "maior" | "az">("padrao");
  const [fora, setFora] = useState<string[]>([]);
  // ---------- visual ----------
  const [temaId, setTemaId] = useState(temaInicial);
  const [fundo1, setFundo1] = useState<string | null>(null);
  const [fundo2, setFundo2] = useState<string | null>(null);
  const [destaque, setDestaque] = useState<string | null>(null);
  const [fonte, setFonte] = useState("");
  const [enfeites, setEnfeites] = useState<Enfeite[]>(base0.enfeites);
  const [titulo, setTitulo] = useState(base0.titulo);
  const [subtitulo, setSubtitulo] = useState(base0.subtitulo);
  const [prazoLigado, setPrazoLigado] = useState(!!prazoLoja?.ate);
  const [prazo, setPrazo] = useState(() => {
    if (!prazoLoja?.ate) return "Pedidos até 15/12";
    const d = new Date(prazoLoja.ate);
    return `${prazoLoja.texto?.trim() || "Pedidos até"} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [formato, setFormato] = useState<Formato>("feed");
  const [porPagina, setPorPagina] = useState("9");
  const [mostrar, setMostrar] = useState<Mostrar>({ preco: true, opcoes: true, capa: true, final: true, qr: true, numero: true, cartao: true });
  // ---------- resultado ----------
  const [paginas, setPaginas] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);
  const [aberta, setAberta] = useState<number | null>(null);
  const [fazendoPdf, setFazendoPdf] = useState(false);
  const vez = useRef(0);

  // O tema com as personalizações por cima
  const tema = useMemo<Tema>(() => {
    const b = TEMAS.find((x) => x.id === temaId) ?? TEMAS[0];
    const f: [string, string] = b.id === "loja" ? [loja.cor, escurecer(loja.cor, 0.55)] : b.fundo;
    const novoFundo: [string, string] = [fundo1 ?? f[0], fundo2 ?? fundo1 ?? f[1]];
    const mudouFundo = !!(fundo1 || fundo2) || b.id === "loja";
    const texto = mudouFundo ? corDeLeitura(mistura(novoFundo[0], novoFundo[1])) === "#ffffff" ? "#ffffff" : "#1c1917" : b.texto;
    return {
      ...b, fundo: novoFundo, texto, enfeites,
      destaque: destaque ?? b.destaque,
      corTitulo: mudouFundo ? undefined : destaque ?? b.corTitulo,
      fonteTitulo: fonte || b.fonteTitulo,
      coresFesta: destaque ? [destaque, ...(b.coresFesta ?? []).slice(1)] : b.coresFesta,
    };
  }, [temaId, fundo1, fundo2, destaque, fonte, enfeites, loja.cor]);

  function trocarTema(id: string) {
    const antigo = TEMAS.find((t) => t.id === temaId)!, novo = TEMAS.find((t) => t.id === id)!;
    if (titulo === antigo.titulo) setTitulo(novo.titulo); // só troca o texto se a pessoa não tinha mudado
    if (subtitulo === antigo.subtitulo) setSubtitulo(novo.subtitulo);
    setTemaId(id); setEnfeites(novo.enfeites); setFundo1(null); setFundo2(null); setDestaque(null); setFonte("");
  }
  function trocarFiltro(f: string) {
    setFiltro(f); setFora([]);
    const sugerido = temaPeloNome(nomeDoGrupo(f));
    if (sugerido && sugerido !== temaId) trocarTema(sugerido);
  }
  const alternarEnfeite = (e: Enfeite) => setEnfeites((l) => (l.includes(e) ? l.filter((x) => x !== e) : [...l, e]));
  const mudarMostrar = (k: keyof Mostrar) => setMostrar((m) => ({ ...m, [k]: !m[k] }));

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

  const link = filtro.startsWith("col:") ? `${site}/${loja.slug}/colecao/${filtro.slice(4)}` : filtro.startsWith("cat:") ? `${site}/${loja.slug}#categoria-${filtro.slice(4)}` : `${site}/${loja.slug}`;

  // Redesenha sozinho 0,6 s depois de qualquer mudança
  useEffect(() => {
    const minhaVez = ++vez.current;
    const t = setTimeout(async () => {
      setGerando(true);
      try {
        const feitas = await gerarPaginas(loja, escolhidos, { tema, formato, porPagina, titulo, subtitulo, link, prazo: prazoLigado ? prazo : "", mostrar });
        if (minhaVez === vez.current) setPaginas(feitas);
      } finally { if (minhaVez === vez.current) setGerando(false); }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, formato, porPagina, titulo, subtitulo, link, prazo, prazoLigado, mostrar, escolhidos.map((p) => p.id).join(",")]);

  const nomeBase = `catalogo-${loja.slug}-${tema.id}`;
  const nomeArquivo = (i: number) => `${nomeBase}-${String(i + 1).padStart(2, "0")}.jpg`;
  async function arquivosImagens() {
    return Promise.all(paginas.map(async (url, i) => new File([await (await fetch(url)).blob()], nomeArquivo(i), { type: "image/jpeg" })));
  }
  async function arquivoPdf() {
    const { L, A } = FORMATOS[formato];
    const jpgs = await Promise.all(paginas.map(jpgDaUrl));
    return new File([pdfDeImagens(jpgs, { w: L * 0.75, h: A * 0.75 })], `${nomeBase}.pdf`, { type: "application/pdf" });
  }
  function baixarArquivo(arquivo: File) {
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement("a"); a.href = url; a.download = arquivo.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  async function baixarPdf() { setFazendoPdf(true); try { baixarArquivo(await arquivoPdf()); } finally { setFazendoPdf(false); } }
  async function compartilharPdf() {
    setFazendoPdf(true);
    try {
      const pdf = await arquivoPdf();
      if (navigator.canShare?.({ files: [pdf] })) await navigator.share({ files: [pdf], title: titulo, text: `${titulo} · ${loja.nome}\n${link}` }).catch(() => {});
      else baixarArquivo(pdf);
    } finally { setFazendoPdf(false); }
  }
  async function compartilharImagens() {
    const lista = await arquivosImagens();
    if (navigator.canShare?.({ files: lista })) await navigator.share({ files: lista, title: titulo, text: `${titulo} · ${loja.nome}\n${link}` }).catch(() => {});
    else baixarTodas();
  }
  function baixar(i: number) { const a = document.createElement("a"); a.href = paginas[i]; a.download = nomeArquivo(i); a.click(); }
  function baixarTodas() { paginas.forEach((_, i) => setTimeout(() => baixar(i), i * 350)); }

  const cor = loja.cor;
  const caixa = "rounded-xl border bg-white px-3 py-2 text-sm text-stone-900";
  const ocupado = !paginas.length || gerando || fazendoPdf;
  const marcado = (on: boolean) => (on ? { background: cor, color: "#fff", borderColor: cor } : {});
  const [cols, linhas] = GRADES[porPagina][formato];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto max-w-6xl p-4">
        <header className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4 text-white shadow" style={{ background: `linear-gradient(135deg, ${cor}, ${escurecer(cor, 0.4)})` }}>
          {loja.logo_url && <img src={loja.logo_url} alt="" className="h-12 w-12 rounded-full border-2 border-white bg-white object-cover" />}
          <div className="flex-1">
            <h1 className="text-xl font-bold">🎨 Catálogo · {loja.nome}</h1>
            <p className="text-sm opacity-90">Escolha os produtos, o tema e personalize. Sai em PDF e em imagens para o WhatsApp e Instagram.</p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[23rem_1fr]">
          <aside className="space-y-4">
            {/* 1 — O QUE ENTRA */}
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-bold">1. O que entra</h2>
              <select value={filtro} onChange={(e) => trocarFiltro(e.target.value)} className={`${caixa} w-full`}>
                <option value="todos">📦 Todos os produtos</option>
                <option value="destaques">⭐ Só os destaques</option>
                <option value="promocoes">🏷️ Só as promoções</option>
                {colecoes.length > 0 && <optgroup label="Coleções">{colecoes.map((c) => <option key={c.id} value={`col:${c.id}`}>✨ {c.nome}</option>)}</optgroup>}
                {categorias.length > 0 && <optgroup label="Categorias">{categorias.map((c) => <option key={c.id} value={`cat:${c.id}`}>{c.parent_id ? "   ↳ " : "🗂️ "}{c.nome}</option>)}</optgroup>}
              </select>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select value={ate ?? ""} onChange={(e) => setAte(e.target.value ? Number(e.target.value) : null)} className={caixa} aria-label="Faixa de preço">
                  <option value="">💰 Qualquer preço</option><option value="30">🎁 Até R$ 30</option><option value="50">🎁 Até R$ 50</option><option value="100">🎁 Até R$ 100</option><option value="200">🎁 Até R$ 200</option>
                </select>
                <select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} className={caixa} aria-label="Ordem">
                  <option value="padrao">Ordem da loja</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="az">A–Z</option>
                </select>
              </div>
              <label className="mt-2 flex items-center gap-1 text-sm"><input type="checkbox" checked={semEsgotados} onChange={(e) => setSemEsgotados(e.target.checked)} /> Esconder esgotados</label>
              <p className="mt-3 text-xs opacity-60">Toque para tirar/colocar ({escolhidos.length} de {doFiltro.length}):</p>
              <div className="mt-1 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
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

            {/* 2 — TEMA */}
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-bold">2. Tema</h2>
              <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                {TEMAS.map((t) => {
                  const f = t.id === "loja" ? [loja.cor, escurecer(loja.cor, 0.55)] : t.fundo;
                  return (
                    <button key={t.id} type="button" onClick={() => trocarTema(t.id)}
                      className="rounded-xl p-2 text-left text-xs font-semibold shadow-sm transition-transform hover:scale-[1.03]"
                      style={{ background: `linear-gradient(${f[0]}, ${f[1]})`, color: t.id === "loja" ? "#fff" : t.texto, outline: temaId === t.id ? `3px solid ${cor}` : "none", outlineOffset: 2 }}>
                      <span className="text-lg">{t.emoji}</span><br />{t.nome}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3 — PERSONALIZAR */}
            <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="font-bold">3. Personalizar</h2>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <label className="flex flex-col gap-1">Fundo (cima)<input type="color" value={tema.fundo[0]} onChange={(e) => setFundo1(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border" /></label>
                <label className="flex flex-col gap-1">Fundo (baixo)<input type="color" value={tema.fundo[1]} onChange={(e) => setFundo2(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border" /></label>
                <label className="flex flex-col gap-1">Destaque/preço<input type="color" value={tema.destaque} onChange={(e) => setDestaque(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border" /></label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[["#8b1a1a", "#3d0808"], ["#1b5e3a", "#06281a"], ["#0b1a3a", "#020617"], ["#3B1260", "#1a0830"], ["#fffdf7", "#f3e6c8"], ["#bfe8ff", "#fff3b0"], ["#ffe1ea", "#ffc2d1"], ["#ffffff", "#f4f1ec"], ["#161616", "#000000"], [loja.cor, escurecer(loja.cor, 0.55)]].map(([a, b]) => (
                  <button key={a + b} type="button" onClick={() => { setFundo1(a); setFundo2(b); }} title="Usar estas cores" className="h-7 w-7 rounded-full border-2 border-white shadow" style={{ background: `linear-gradient(${a}, ${b})` }} />
                ))}
                {(fundo1 || fundo2 || destaque) && <button type="button" onClick={() => { setFundo1(null); setFundo2(null); setDestaque(null); }} className="rounded-full border px-2 text-xs">↺ Cores do tema</button>}
              </div>
              <label className="block text-sm font-semibold">Fonte do título
                <select value={fonte} onChange={(e) => setFonte(e.target.value)} className={`${caixa} mt-1 w-full`}>
                  {FONTES_TITULO.map((f) => <option key={f.nome} value={f.familia}>{f.nome}</option>)}
                </select>
              </label>
              <div>
                <p className="text-sm font-semibold">Enfeites</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {ENFEITES.map((e) => (
                    <button key={e.id} type="button" onClick={() => alternarEnfeite(e.id)} className="rounded-full border px-2.5 py-1 text-xs" style={marcado(enfeites.includes(e.id))}>{e.nome}</button>
                  ))}
                  <button type="button" onClick={() => setEnfeites([])} className="rounded-full border px-2.5 py-1 text-xs">🚫 Nenhum</button>
                </div>
              </div>
              <label className="block text-sm font-semibold">Título<input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={40} className={`${caixa} mt-1 w-full`} /></label>
              <label className="block text-sm font-semibold">Frase<input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} maxLength={60} className={`${caixa} mt-1 w-full`} /></label>
              <div className="flex items-center gap-2">
                <label className="flex shrink-0 items-center gap-1 text-sm font-semibold"><input type="checkbox" checked={prazoLigado} onChange={(e) => setPrazoLigado(e.target.checked)} /> ⏳ Selo</label>
                <input value={prazo} onChange={(e) => setPrazo(e.target.value)} disabled={!prazoLigado} maxLength={34} placeholder="Ex.: Pedidos até 15/12" className={`${caixa} min-w-0 flex-1 disabled:opacity-40`} />
              </div>
            </section>

            {/* 4 — FORMATO E O QUE MOSTRAR */}
            <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="font-bold">4. Formato</h2>
              <select value={formato} onChange={(e) => setFormato(e.target.value as Formato)} className={`${caixa} w-full`} aria-label="Formato">
                {Object.entries(FORMATOS).map(([k, f]) => <option key={k} value={k}>{f.nome}</option>)}
              </select>
              <div>
                <p className="text-sm font-semibold">Produtos por página</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {Object.keys(GRADES).map((n) => {
                    const [c, l] = GRADES[n][formato];
                    return <button key={n} type="button" onClick={() => setPorPagina(n)} className="rounded-full border px-3 py-1 text-xs font-semibold" style={marcado(porPagina === n)}>{c * l} <span className="opacity-60">({c}×{l})</span></button>;
                  })}
                </div>
                <p className="mt-1 text-xs opacity-60">{escolhidos.length} produtos → {Math.ceil(escolhidos.length / (cols * linhas)) || 0} {Math.ceil(escolhidos.length / (cols * linhas)) === 1 ? "página" : "páginas"} de produtos</p>
              </div>
              <div className="grid grid-cols-2 gap-1 text-sm">
                {([["preco", "💲 Preços"], ["opcoes", "🎨 Cores/tamanhos"], ["cartao", "🔲 Cartão branco"], ["qr", "📷 QR Code"], ["capa", "📕 Capa"], ["final", "📞 Como pedir"], ["numero", "🔢 Nº da página"]] as [keyof Mostrar, string][]).map(([k, r]) => (
                  <label key={k} className="flex items-center gap-1"><input type="checkbox" checked={mostrar[k]} onChange={() => mudarMostrar(k)} /> {r}</label>
                ))}
              </div>
              <p className="break-all text-xs opacity-60">QR Code leva para: {link.replace(/^https?:\/\//, "")}</p>
            </section>
          </aside>

          {/* ---------- RESULTADO ---------- */}
          <main>
            <div className="sticky top-2 z-10 mb-3 space-y-2 rounded-2xl bg-white/95 p-3 shadow backdrop-blur">
              <b className="block text-sm">{gerando ? "⏳ Desenhando as páginas..." : fazendoPdf ? "📄 Montando o PDF..." : `✅ ${paginas.length} ${paginas.length === 1 ? "página pronta" : "páginas prontas"}`}</b>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={ocupado} onClick={baixarPdf} className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" style={{ background: cor }}>📄 Baixar PDF</button>
                <button type="button" disabled={ocupado} onClick={compartilharPdf} className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">📲 Enviar PDF</button>
                <button type="button" disabled={ocupado} onClick={compartilharImagens} className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-40">🖼️ Enviar imagens</button>
                <button type="button" disabled={ocupado} onClick={baixarTodas} className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-40">📥 Baixar imagens</button>
              </div>
            </div>
            <div className={`grid gap-3 ${formato === "story" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 xl:grid-cols-3"}`}>
              {paginas.map((url, i) => (
                <button key={i} type="button" onClick={() => setAberta(i)} className="relative overflow-hidden rounded-xl shadow-md transition-transform hover:scale-[1.02]" style={{ opacity: gerando ? 0.5 : 1 }}>
                  <img src={url} alt={`Página ${i + 1}`} className="w-full" />
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{i + 1}</span>
                </button>
              ))}
            </div>
          </main>
        </div>
      </div>

      {aberta != null && paginas[aberta] && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/85 p-4" onClick={() => setAberta(null)}>
          <img src={paginas[aberta]} alt="" className="max-h-[80vh] max-w-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button type="button" disabled={aberta === 0} onClick={() => setAberta(aberta - 1)} className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-40">◀</button>
            <button type="button" onClick={() => baixar(aberta)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold">📥 Baixar esta</button>
            <button type="button" disabled={aberta === paginas.length - 1} onClick={() => setAberta(aberta + 1)} className="rounded-full bg-white px-4 py-2 text-sm disabled:opacity-40">▶</button>
            <button type="button" onClick={() => setAberta(null)} className="rounded-full bg-white px-4 py-2 text-sm">✕</button>
          </div>
        </div>
      )}
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
    o.mostrar.qr ? carregar(await QRCode.toDataURL(o.link, { margin: 1, width: 400, color: { dark: "#1c1917", light: "#ffffff" } })) : Promise.resolve(null),
  ]);
  const fotos = new Map(await Promise.all(produtos.map(async (p) => [p.id, await carregar(p.foto)] as const)));

  const blocos: ProdutoCatalogo[][] = [];
  for (let i = 0; i < produtos.length; i += porPag) blocos.push(produtos.slice(i, i + porPag));
  const total = (o.mostrar.capa ? 1 : 0) + blocos.length + (o.mostrar.final ? 1 : 0);
  const saida: string[] = [];
  let n = 0;

  const nova = () => {
    const c = document.createElement("canvas");
    c.width = L * ESCALA; c.height = A * ESCALA;
    const ctx = c.getContext("2d")!;
    ctx.scale(ESCALA, ESCALA);
    desenharFundo(ctx, o.tema, L, A, 1234 + n * 97);
    return { c, ctx };
  };
  const fechar = (c: HTMLCanvasElement) => { saida.push(c.toDataURL("image/jpeg", 0.9)); n++; };

  if (o.mostrar.capa) { const { c, ctx } = nova(); desenharCapa(ctx, L, A, loja, produtos, fotos, logo, qr, o); fechar(c); }
  blocos.forEach((bloco) => {
    const { c, ctx } = nova();
    desenharPaginaProdutos(ctx, L, A, cols, linhas, bloco, fotos, logo, qr, loja, o, n + 1, total);
    fechar(c);
  });
  if (o.mostrar.final) { const { c, ctx } = nova(); desenharFinal(ctx, L, A, loja, logo, qr, o); fechar(c); }
  return saida;
}

type Fotos = Map<string, HTMLImageElement | null>;
type Ctx = CanvasRenderingContext2D;
const corTitulo = (t: Tema) => t.corTitulo ?? t.texto;

function sombra(ctx: Ctx, ligar: boolean) {
  ctx.shadowColor = ligar ? "rgba(0,0,0,0.25)" : "transparent";
  ctx.shadowBlur = ligar ? 18 : 0;
  ctx.shadowOffsetY = ligar ? 6 : 0;
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

function precoTexto(p: ProdutoCatalogo, curto: boolean) {
  if (p.preco == null) return "Sob consulta";
  return `${p.aPartir ? (curto ? "a partir " : "a partir de ") : ""}${formatarPreco(p.preco)}`;
}
function textoOpcoes(p: ProdutoCatalogo) {
  const partes: string[] = [];
  if ((p.cores ?? 0) > 1 || p.escolheCor) partes.push("🎨 Várias cores");
  if ((p.tamanhos ?? 0) > 1) partes.push(`📏 ${p.tamanhos} tamanhos`);
  return partes.join(" · ");
}

// Cabeçalho das páginas de produtos: mais baixinho quando tem muitos produtos
function desenharCabecalho(ctx: Ctx, L: number, loja: LojaCatalogo, logo: HTMLImageElement | null, o: Opcoes, compacto: boolean) {
  const t = o.tema;
  if (compacto) {
    logoRedonda(ctx, logo, 92, 88, 40, t.destaque);
    const tam = Math.round(50 * fatorFonte(t.fonteTitulo));
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 6;
    ctx.font = `700 ${tam}px ${t.fonteTitulo}`; ctx.fillStyle = corTitulo(t); ctx.textAlign = "left";
    ctx.fillText(quebrarTexto(ctx, o.titulo, L - 300, 1)[0] ?? "", 150, 80 + tam * 0.35);
    ctx.restore();
    ctx.save(); ctx.letterSpacing = "4px"; ctx.font = "700 18px system-ui, sans-serif"; ctx.fillStyle = t.texto; ctx.globalAlpha = 0.85;
    ctx.fillText(loja.nome.toUpperCase(), 152, 136); ctx.restore();
    return 160;
  }
  logoRedonda(ctx, logo, L / 2, 86, 42, t.destaque);
  ctx.save(); ctx.letterSpacing = "6px";
  textoCentro(ctx, loja.nome.toUpperCase(), L / 2, 154, "700 20px system-ui, sans-serif", t.texto, L - 300);
  ctx.restore();
  const tam = Math.round(58 * fatorFonte(t.fonteTitulo));
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 8;
  textoCentro(ctx, o.titulo, L / 2, 158 + tam * 0.95, `700 ${tam}px ${t.fonteTitulo}`, corTitulo(t), L - 120);
  ctx.restore();
  return 158 + tam * 0.95 + 34;
}

function desenharSelo(ctx: Ctx, t: Tema, L: number, y: number, prazo: string) {
  ctx.font = "800 22px system-ui, sans-serif";
  const txt = `⏳ ${prazo}`, w = ctx.measureText(txt).width + 32;
  ctx.save(); sombra(ctx, true); ctx.fillStyle = t.destaque; retanguloRedondo(ctx, L - 48 - w, y, w, 42, 21); ctx.fill(); ctx.restore();
  ctx.fillStyle = corDeLeitura(t.destaque); ctx.textAlign = "right"; ctx.fillText(txt, L - 64, y + 29); ctx.textAlign = "left";
}

// Rodapé: QR + WhatsApp + @ + link. Devolve a altura que ele ocupa.
const ALTURA_RODAPE = 140;
function desenharRodape(ctx: Ctx, L: number, A: number, loja: LojaCatalogo, qr: HTMLImageElement | null, o: Opcoes, pagina?: number, total?: number) {
  const t = o.tema, y = A - 118, tx = qr ? 160 : 48;
  if (qr) {
    ctx.save(); sombra(ctx, true); ctx.fillStyle = "#fff"; retanguloRedondo(ctx, 48, y - 4, 96, 96, 14); ctx.fill(); ctx.restore();
    ctx.drawImage(qr, 54, y + 2, 84, 84);
  }
  ctx.fillStyle = t.texto; ctx.font = "800 24px system-ui, sans-serif";
  ctx.fillText(loja.whatsapp ? `📲 Peça pelo WhatsApp ${telefoneBonito(loja.whatsapp)}` : "📲 Peça pelo WhatsApp", tx, y + 34);
  ctx.font = "500 20px system-ui, sans-serif"; ctx.globalAlpha = 0.9;
  const insta = usuarioInstagram(loja.instagram);
  ctx.fillText(`${insta ? `@${insta}  ·  ` : ""}${o.link.replace(/^https?:\/\//, "").replace(/#.*/, "")}`, tx, y + 68);
  ctx.globalAlpha = 1;
  if (o.prazo.trim()) desenharSelo(ctx, t, L, y - 62, o.prazo.trim());
  if (o.mostrar.numero && pagina && total) {
    ctx.textAlign = "right"; ctx.font = "700 20px system-ui, sans-serif"; ctx.globalAlpha = 0.75;
    ctx.fillText(`${pagina}/${total}`, L - 48, y + 68); ctx.globalAlpha = 1; ctx.textAlign = "left";
  }
}

function desenharPaginaProdutos(ctx: Ctx, L: number, A: number, cols: number, linhas: number, bloco: ProdutoCatalogo[], fotos: Fotos,
  logo: HTMLImageElement | null, qr: HTMLImageElement | null, loja: LojaCatalogo, o: Opcoes, pagina: number, total: number) {
  const t = o.tema;
  const compacto = cols * linhas >= 9;
  const topo = desenharCabecalho(ctx, L, loja, logo, o, compacto) + (compacto ? 10 : 0);
  const margem = cols >= 4 ? 32 : 40, vao = cols >= 4 ? 12 : cols === 3 ? 16 : 22;
  const base = A - ALTURA_RODAPE - (o.prazo.trim() ? 52 : 0);
  const w = (L - margem * 2 - vao * (cols - 1)) / cols;
  const h = (base - topo - vao * (linhas - 1)) / linhas;
  // Tamanhos das letras acompanham o tamanho do cartão
  const fNome = Math.max(14, Math.min(24, w * 0.064));
  const fPreco = Math.max(14, Math.min(23, w * 0.062));
  const fOpc = Math.max(12, fNome * 0.75);
  const mostrarOpc = o.mostrar.opcoes && bloco.some((p) => textoOpcoes(p));
  const pad = o.mostrar.cartao ? Math.max(6, w * 0.03) : 0;
  // espaço do texto embaixo da foto: nome (2 linhas) + cores/tamanhos + preço
  const areaTexto = 6 + fNome * 2.4 + (mostrarOpc ? fOpc * 1.35 : 0) + (o.mostrar.preco ? fPreco * 1.55 + 8 : 0) + pad;
  const corNome = o.mostrar.cartao ? t.textoCartao : t.texto;

  bloco.forEach((p, i) => {
    const x = margem + (i % cols) * (w + vao), y = topo + Math.floor(i / cols) * (h + vao);
    if (o.mostrar.cartao) { ctx.save(); sombra(ctx, true); ctx.fillStyle = t.cartao; retanguloRedondo(ctx, x, y, w, h, Math.min(24, w * 0.08)); ctx.fill(); ctx.restore(); }
    // foto
    const fx = x + pad, fy = y + pad, fw = w - pad * 2, fh = Math.max(40, h - areaTexto);
    ctx.save(); retanguloRedondo(ctx, fx, fy, fw, fh, Math.min(18, w * 0.06)); ctx.clip();
    ctx.fillStyle = "#f1ece6"; ctx.fillRect(fx, fy, fw, fh);
    const img = fotos.get(p.id);
    if (img) fotoCobrindo(ctx, img, fx, fy, fw, fh);
    else textoCentro(ctx, "📷", fx + fw / 2, fy + fh / 2 + 16, `${Math.round(fw * 0.2)}px system-ui`, "#999");
    if (p.esgotado) {
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(fx, fy, fw, fh);
      textoCentro(ctx, "ESGOTADO", fx + fw / 2, fy + fh / 2 + 10, `800 ${Math.round(fNome * 1.1)}px system-ui`, "#fff");
    }
    ctx.restore();
    if (p.promoPct && o.mostrar.preco) {
      const sw = fPreco * 3.4, sh = fPreco * 1.6;
      ctx.fillStyle = "#e11d48"; retanguloRedondo(ctx, fx + 8, fy + 8, sw, sh, sh / 2); ctx.fill();
      textoCentro(ctx, `-${p.promoPct}%`, fx + 8 + sw / 2, fy + 8 + sh * 0.7, `800 ${Math.round(fPreco * 0.95)}px system-ui`, "#fff");
    }
    // nome (até 2 linhas)
    ctx.fillStyle = corNome; ctx.font = `700 ${fNome}px system-ui, sans-serif`;
    let ty = fy + fh + 6 + fNome;
    quebrarTexto(ctx, p.nome, fw, 2).forEach((l) => { ctx.fillText(l, fx, ty); ty += fNome * 1.2; });
    // 🎨 cores · 📏 tamanhos (logo abaixo do nome, nunca por cima)
    const opc = o.mostrar.opcoes ? textoOpcoes(p) : "";
    if (opc) {
      ctx.font = `600 ${fOpc}px system-ui, sans-serif`; ctx.globalAlpha = 0.72;
      ctx.fillText(quebrarTexto(ctx, opc, fw, 1)[0] ?? "", fx, ty - fNome * 0.2 + fOpc * 0.35);
      ctx.globalAlpha = 1;
    }
    // preço
    if (o.mostrar.preco) {
      ctx.font = `800 ${fPreco}px system-ui, sans-serif`;
      const txt = precoTexto(p, cols >= 4);
      const pw = Math.min(ctx.measureText(txt).width + fPreco, fw), ph = fPreco * 1.55;
      const py = y + h - pad - ph - 2;
      ctx.fillStyle = t.destaque; retanguloRedondo(ctx, fx, py, pw, ph, ph / 2); ctx.fill();
      ctx.fillStyle = corDeLeitura(t.destaque); ctx.fillText(txt, fx + fPreco / 2, py + ph * 0.7);
      if (p.precoCheio && p.precoCheio !== p.preco) {
        ctx.font = `500 ${Math.round(fPreco * 0.75)}px system-ui`;
        const velho = formatarPreco(p.precoCheio), vx = fx + pw + 8, vy = py + ph * 0.68;
        if (vx + ctx.measureText(velho).width <= fx + fw) {
          ctx.fillStyle = o.mostrar.cartao ? "#9a948f" : t.texto; ctx.globalAlpha = o.mostrar.cartao ? 1 : 0.7;
          ctx.fillText(velho, vx, vy); ctx.fillRect(vx, vy - fPreco * 0.25, ctx.measureText(velho).width, 2); ctx.globalAlpha = 1;
        }
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
  linhasTitulo.forEach((l) => { textoCentro(ctx, l, L / 2, ty, `700 ${tam}px ${t.fonteTitulo}`, corTitulo(t)); ty += tam * 0.95; });
  ctx.restore();
  textoCentro(ctx, o.subtitulo, L / 2, ty + 10, "500 34px system-ui, sans-serif", t.texto, L - 140);

  // "Polaroids" com fotos dos produtos
  const comFoto = produtos.filter((p) => fotos.get(p.id)).slice(0, 3);
  const fundoUtil = A - ALTURA_RODAPE - (o.prazo.trim() ? 90 : 40);
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
  textoCentro(ctx, "Como fazer seu pedido", L / 2, A * 0.12 + 100 + tam * 0.8, `700 ${tam}px ${t.fonteTitulo}`, corTitulo(t), L - 100);
  const passos = ["Escolha seus favoritos no catálogo ou no site", "Mande uma mensagem no WhatsApp com o nome do produto", "A gente confirma, prepara com carinho e entrega 💝"];
  let y = A * 0.12 + 170 + tam;
  passos.forEach((p, i) => {
    ctx.save(); sombra(ctx, true); ctx.fillStyle = t.cartao; retanguloRedondo(ctx, 80, y, L - 160, 110, 24); ctx.fill(); ctx.restore();
    ctx.fillStyle = t.destaque; ctx.beginPath(); ctx.arc(140, y + 55, 34, 0, Math.PI * 2); ctx.fill();
    textoCentro(ctx, String(i + 1), 140, y + 68, "800 36px system-ui", corDeLeitura(t.destaque));
    ctx.fillStyle = t.textoCartao; ctx.font = "600 27px system-ui, sans-serif";
    const ls = quebrarTexto(ctx, p, L - 360, 2);
    ls.forEach((l, k) => ctx.fillText(l, 200, y + (ls.length === 1 ? 64 : 48 + k * 34)));
    y += 134;
  });
  const qrGrande = o.mostrar.qr ? qr : null;
  const q = Math.min(300, A - y - ALTURA_RODAPE - (o.prazo.trim() ? 150 : 100));
  if (qrGrande && q > 120) {
    ctx.save(); sombra(ctx, true); ctx.fillStyle = "#fff"; retanguloRedondo(ctx, L / 2 - q / 2 - 16, y + 20, q + 32, q + 32, 24); ctx.fill(); ctx.restore();
    ctx.drawImage(qrGrande, L / 2 - q / 2, y + 36, q, q);
    textoCentro(ctx, "Aponte a câmera e veja tudo no site 📷", L / 2, y + q + 100, "600 28px system-ui, sans-serif", t.texto);
  }
  desenharRodape(ctx, L, A, loja, null, o);
}
