"use client";
// =====================================================================
// BUSCA PREDITIVA E ORDENAÇÃO DA LOJA
//   - Enquanto digita, aparece um painel com até 6 sugestões (foto,
//     nome e preço), surgindo em cascata. Espera a pessoa parar de
//     digitar por 0,2 s antes de buscar (debounce).
//   - Enter ou "Ver todos" filtra a grade inteira.
//   - Sem busca nem ordenação, mostra a página normal (children).
// =====================================================================
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Produto } from "@/lib/tipos";
import { formatarPreco, precoMinimo } from "@/lib/formato";
import CardDoProduto from "@/components/CardDoProduto";
import ImagemSuave from "@/components/ImagemSuave";

type Ordem = "padrao" | "menor" | "maior" | "az";

// Tira acentos e maiúsculas: "Árvore" vira "arvore" (busca mais esperta).
const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const combina = (p: Produto, termo: string) => normalizar(`${p.nome} ${p.descricao ?? ""}`).includes(normalizar(termo.trim()));

export default function ConteudoComBusca({ produtos, slug, cor, children }: {
  produtos: Produto[]; slug: string; cor: string; children: ReactNode;
}) {
  const [texto, setTexto] = useState(""); // o que está escrito na caixa
  const [termo, setTermo] = useState(""); // o texto depois da pausa (debounce)
  const [filtro, setFiltro] = useState(""); // busca aplicada na grade (Enter / Ver todos)
  const [aberto, setAberto] = useState(false); // painel de sugestões
  const [ordem, setOrdem] = useState<Ordem>("padrao");

  // Debounce: só atualiza o termo 200 ms depois que a pessoa para de digitar.
  useEffect(() => {
    const t = setTimeout(() => setTermo(texto), 200);
    return () => clearTimeout(t);
  }, [texto]);

  const buscando = texto !== termo;
  const sugestoes = termo.trim() ? produtos.filter((p) => combina(p, termo)) : [];
  const aplicarBusca = () => { setFiltro(texto); setAberto(false); };

  const ativo = filtro.trim() !== "" || ordem !== "padrao";
  const resultados = produtos
    .filter((p) => combina(p, filtro))
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
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <input type="search" value={texto} placeholder="🔍 Buscar produto..."
            onChange={(e) => { setTexto(e.target.value); setAberto(true); if (!e.target.value) setFiltro(""); }}
            onFocus={() => setAberto(true)}
            onBlur={() => setTimeout(() => setAberto(false), 150)} // dá tempo de clicar numa sugestão
            onKeyDown={(e) => { if (e.key === "Enter") aplicarBusca(); if (e.key === "Escape") setAberto(false); }}
            className="w-full rounded-xl border bg-white/80 px-4 py-2.5 text-sm outline-none focus:ring-2" style={{ borderColor: cor }} />

          {/* Painel de sugestões */}
          {aberto && texto.trim() && (
            <div className="deslizar absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl bg-white text-stone-900 shadow-2xl">
              {buscando ? (
                <p className="p-4 text-sm opacity-60">Buscando...</p>
              ) : sugestoes.length === 0 ? (
                <p className="p-4 text-sm opacity-60">Nenhum produto encontrado 😕</p>
              ) : (
                <>
                  <ul>
                    {sugestoes.slice(0, 6).map((p, i) => {
                      const foto = p.midias.find((m) => m.tipo === "foto");
                      const preco = precoMinimo(p);
                      return (
                        <li key={p.id} className="animar-entrada" style={{ animationDelay: `${i * 40}ms` }}>
                          <Link href={`/${slug}/p/${p.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-black/5">
                            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg" style={{ background: `${cor}22` }}>
                              {foto && <ImagemSuave src={foto.url} alt="" className="h-full w-full object-cover" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm">{p.nome}</span>
                            <span className="text-sm font-semibold" style={{ color: cor }}>{preco != null ? formatarPreco(preco) : "Consulte"}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={aplicarBusca}
                    className="w-full border-t px-3 py-2 text-sm font-semibold" style={{ color: cor }}>
                    Ver todos os {sugestoes.length} resultados →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar produtos"
          className="rounded-xl border bg-white/80 px-3 py-2.5 text-sm" style={{ borderColor: cor }}>
          <option value="padrao">Ordenar: padrão</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="az">Nome (A–Z)</option>
        </select>
      </div>

      {ativo ? (
        <section className="mt-6">
          <p className="text-sm opacity-70">
            {resultados.length} {resultados.length === 1 ? "produto encontrado" : "produtos encontrados"}
            {filtro && <> para “{filtro}” · <button type="button" className="underline" onClick={() => { setFiltro(""); setTexto(""); }}>limpar</button></>}
          </p>
          {resultados.length === 0 ? (
            <p className="mt-6 text-center opacity-70">Nenhum produto encontrado 😕</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
