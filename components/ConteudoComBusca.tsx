"use client";
// =====================================================================
// GRADE COM BUSCA E ORDENAÇÃO (página da loja)
//   - A caixa de busca fica no banner (BuscaNoBanner). A cada letra,
//     ela avisa aqui (evento "busca-loja") e a grade mostra SÓ os
//     produtos que têm o texto no NOME — com a busca inteligente
//     (aceita erro de digitação, sem acento, plural e sinônimos).
//   - Sem busca e sem ordenação, mostra a loja normal (destaques,
//     categorias, coleções), que chega como "children".
// =====================================================================
import { useEffect, useState, type ReactNode } from "react";
import type { Produto } from "@/lib/tipos";
import { precoMinimo } from "@/lib/formato";
import CardDoProduto from "@/components/CardDoProduto";
import { buscarNaLista, lerSinonimos, normalizar, sugestao, type Sinonimos } from "@/lib/busca";
import { comPromocao } from "@/lib/promocao";
import { supabaseNavegador } from "@/lib/supabase-navegador";

// 🎁 Faixas de preço ("Presentes até R$ 50")
const FAIXAS = [50, 100, 200];

type Ordem = "padrao" | "menor" | "maior" | "az";

export default function ConteudoComBusca({ produtos, slug, cor, children }: {
  produtos: Produto[]; slug: string; cor: string; children: ReactNode;
}) {
  const [termo, setTermo] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("padrao");
  const [ate, setAte] = useState<number | null>(null);
  const [sinonimos, setSinonimos] = useState<Sinonimos>([]);
  const [populares, setPopulares] = useState<string[]>([]);

  // Sinônimos da loja e 🔥 "mais buscados" (atualização 32; sem ela, só não aparece)
  useEffect(() => {
    const sb = supabaseNavegador();
    sb.from("lojas").select("sinonimos").eq("slug", slug).maybeSingle()
      .then(({ data }: { data: { sinonimos: string | null } | null }) => setSinonimos(lerSinonimos(data?.sinonimos)), () => {});
    sb.rpc("mais_buscados", { p_slug: slug })
      .then(({ data }: { data: { termo: string }[] | null }) => setPopulares((data ?? []).map((d) => d.termo)), () => {});
  }, [slug]);

  // Começa com ?busca=... (vindo de outra página) e escuta a caixa do banner
  useEffect(() => {
    const inicial = new URLSearchParams(window.location.search).get("busca");
    if (inicial) setTermo(inicial);
    const ouvir = (e: Event) => setTermo((e as CustomEvent<string>).detail);
    window.addEventListener("busca-loja", ouvir);
    return () => window.removeEventListener("busca-loja", ouvir);
  }, []);

  // Limpa tudo e volta para a loja normal (avisa a caixa do banner também)
  function limpar() {
    setOrdem("padrao");
    setAte(null);
    window.dispatchEvent(new CustomEvent("busca-loja", { detail: "" }));
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }

  const busca = normalizar(termo.trim());
  const ativo = busca !== "" || ordem !== "padrao" || ate != null;
  const precoFinal = (p: Produto) => { const v = precoMinimo(p); return v == null ? null : comPromocao(v, p); };
  // Busca inteligente: os que mais combinam vêm primeiro
  const resultados = buscarNaLista(produtos, termo, (p) => p.nome, sinonimos)
    .filter((p) => { if (ate == null) return true; const v = precoFinal(p); return v != null && v <= ate; })
    .sort((a, b) => {
      const pa = precoMinimo(a) ?? Infinity; // "sob consulta" vai para o fim
      const pb = precoMinimo(b) ?? Infinity;
      if (ordem === "menor") return pa - pb;
      if (ordem === "maior") return (pb === Infinity ? -1 : pb) - (pa === Infinity ? -1 : pa);
      if (ordem === "az") return a.nome.localeCompare(b.nome, "pt-BR");
      return 0;
    });
  const quisDizer = busca && resultados.length === 0 ? sugestao(termo, produtos.map((p) => p.nome)) : null;
  const buscar = (t: string) => window.dispatchEvent(new CustomEvent("busca-loja", { detail: t }));

  return (
    <>
      {/* 🎁 Presentes por faixa de preço + Ordenar */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-sm">
        <div className="mr-auto flex flex-wrap gap-1.5">
          {FAIXAS.map((v) => (
            <button key={v} type="button" onClick={() => setAte(ate === v ? null : v)}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
              style={ate === v ? { background: cor, color: "#fff", borderColor: cor } : { borderColor: `${cor}66`, color: cor }}>
              🎁 Até R$ {v}
            </button>
          ))}
        </div>
        {ativo && <button type="button" onClick={limpar} className="underline opacity-70">✕ Limpar</button>}
        <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar produtos"
          className="rounded-full border bg-white/80 px-3 py-1.5 text-sm" style={{ borderColor: `${cor}66` }}>
          <option value="padrao">Ordenar: padrão</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="az">Nome (A–Z)</option>
        </select>
      </div>

      {ativo ? (
        <section className="mt-2">
          <p className="text-sm opacity-70">
            {resultados.length} {resultados.length === 1 ? "produto" : "produtos"}
            {busca && <> com “{termo.trim()}” no nome</>}
            {ate != null && <> · até R$ {ate}</>}
          </p>
          {resultados.length === 0 ? (
            <div className="mt-6 text-center">
              <p className="opacity-70">Nenhum produto encontrado 😕</p>
              {quisDizer && (
                <button type="button" onClick={() => buscar(quisDizer)} className="mt-2 rounded-full border px-4 py-1.5 text-sm" style={{ borderColor: cor, color: cor }}>
                  Você quis dizer <b>“{quisDizer}”</b>?
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4">
              {resultados.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* 🔥 O que os clientes mais procuram nesta loja */}
          {populares.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold opacity-70">🔥 Mais buscados:</span>
              {populares.map((t) => (
                <button key={t} type="button" onClick={() => buscar(t)} className="rounded-full bg-black/5 px-2.5 py-1 hover:bg-black/10">{t}</button>
              ))}
            </div>
          )}
          {children}
        </>
      )}
    </>
  );
}
