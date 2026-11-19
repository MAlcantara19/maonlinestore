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
import { buscarNaLista, normalizar, sugestao } from "@/lib/busca";

type Ordem = "padrao" | "menor" | "maior" | "az";

export default function ConteudoComBusca({ produtos, slug, cor, children }: {
  produtos: Produto[]; slug: string; cor: string; children: ReactNode;
}) {
  const [termo, setTermo] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("padrao");

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
    window.dispatchEvent(new CustomEvent("busca-loja", { detail: "" }));
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }

  const busca = normalizar(termo.trim());
  const ativo = busca !== "" || ordem !== "padrao";
  // Busca inteligente: os que mais combinam vêm primeiro
  const resultados = buscarNaLista(produtos, termo, (p) => p.nome)
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
      {/* Ordenar: pequeno, no canto direito */}
      <div className="mt-4 flex items-center justify-end gap-2 text-sm">
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
        children
      )}
    </>
  );
}
