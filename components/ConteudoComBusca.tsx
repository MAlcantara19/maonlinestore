"use client";
// =====================================================================
// GRADE COM BUSCA E ORDENAÇÃO (página da loja)
//   - A caixa de busca fica no banner (BuscaNoBanner). A cada letra,
//     ela avisa aqui (evento "busca-loja") e a grade mostra SÓ os
//     produtos que têm o texto no NOME.
//   - Sem busca e sem ordenação, mostra a loja normal (destaques,
//     categorias, coleções), que chega como "children".
// =====================================================================
import { useEffect, useState, type ReactNode } from "react";
import type { Produto } from "@/lib/tipos";
import { precoMinimo } from "@/lib/formato";
import CardDoProduto from "@/components/CardDoProduto";

type Ordem = "padrao" | "menor" | "maior" | "az";

// Tira acentos e maiúsculas: "Árvore" vira "arvore"
const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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
  const resultados = produtos
    .filter((p) => normalizar(p.nome).includes(busca)) // só pelo NOME
    .sort((a, b) => {
      const pa = precoMinimo(a) ?? Infinity; // "sob consulta" vai para o fim
      const pb = precoMinimo(b) ?? Infinity;
      if (ordem === "menor") return pa - pb;
      if (ordem === "maior") return (pb === Infinity ? -1 : pb) - (pa === Infinity ? -1 : pa);
      if (ordem === "az") return a.nome.localeCompare(b.nome, "pt-BR");
      return 0;
    });

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
            <p className="mt-6 text-center opacity-70">Nenhum produto encontrado 😕</p>
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
