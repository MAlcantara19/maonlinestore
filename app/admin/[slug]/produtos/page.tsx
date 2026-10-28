"use client";
// =====================================================================
// PAINEL — PRODUTOS DA LOJA (endereço: /admin/vitraforma/produtos)
//   Produtos: lista com foto, preço e situação; busca; "+ Novo produto".
//   🗑️ Lixeira: produtos excluídos nos últimos 15 dias. Dá para
//   RESTAURAR ou apagar de vez. Depois de 15 dias, somem sozinhos.
// =====================================================================
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { formatarPreco, precoMinimo } from "@/lib/formato";
import { promocaoAtiva } from "@/lib/promocao";
import { estoqueTotal } from "@/lib/estoque";
import type { Produto } from "@/lib/tipos";

const DIAS_NA_LIXEIRA = 15;
type ProdutoAdmin = Produto & { ativo: boolean; excluido_em: string | null };

export default function PainelProdutos() {
  return <AreaAdmin>{() => <Lista />}</AreaAdmin>;
}

function Lista() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [produtos, setProdutos] = useState<ProdutoAdmin[] | null>(null);
  const [busca, setBusca] = useState("");
  const [verLixeira, setVerLixeira] = useState(false);
  // Ordem e filtros (lembrados neste aparelho)
  const [ordem, setOrdem] = useState("recentes");
  const [filtro, setFiltro] = useState("todos");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState<{ id: string; nome: string; parent_id: string | null }[]>([]);
  const [marcados, setMarcados] = useState<string[]>([]); // seleção para editar vários de uma vez
  const [trabalhando, setTrabalhando] = useState("");
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem("painel-produtos-filtros") ?? "{}");
      if (salvo.ordem) setOrdem(salvo.ordem);
      if (salvo.filtro) setFiltro(salvo.filtro);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("painel-produtos-filtros", JSON.stringify({ ordem, filtro })); } catch {}
  }, [ordem, filtro]);

  const carregar = useCallback(async (l: LojaResumo) => {
    const supabase = supabaseNavegador();
    // Limpeza automática: apaga de vez o que está na lixeira há mais de 15 dias
    const limite = new Date(Date.now() - DIAS_NA_LIXEIRA * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("produtos").delete().eq("loja_id", l.id).lt("excluido_em", limite);

    const { data } = await supabase.from("produtos")
      .select("id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, ativo, excluido_em, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem)")
      .eq("loja_id", l.id).order("criado_em", { ascending: false });
    setProdutos((data ?? []) as ProdutoAdmin[]);
    const { data: cats } = await supabase.from("categorias").select("id, nome, parent_id").eq("loja_id", l.id).order("nome");
    setCategorias((cats ?? []) as { id: string; nome: string; parent_id: string | null }[]);
  }, []);

  useEffect(() => {
    lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); });
  }, [slug, carregar]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const naLixeira = (produtos ?? []).filter((p) => p.excluido_em);
  // Filtros
  const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const passaFiltro = (p: ProdutoAdmin) => {
    switch (filtro) {
      case "visiveis": return p.ativo;
      case "ocultos": return !p.ativo;
      case "destaque": return p.destaque;
      case "pronta_entrega": case "sob_encomenda": case "esgotado": return p.disponibilidade === filtro;
      case "sem_foto": return !p.midias.some((m) => m.tipo === "foto");
      case "sem_preco": return precoMinimo(p) == null;
      case "estoque_baixo": { const n = estoqueTotal(p); return n != null && n <= 3; }
      default: return true;
    }
  };
  const naCategoria = (p: ProdutoAdmin) => {
    if (!categoria) return true;
    const subs = categorias.filter((c) => c.parent_id === categoria).map((c) => c.id);
    const doProduto = [...(p.produtos_categorias ?? []).map((x) => x.categoria_id), ...(p.categoria_id ? [p.categoria_id] : [])];
    return doProduto.some((c) => c === categoria || subs.includes(c));
  };
  // Ordem: sem preço vai sempre para o fim nas ordens por valor
  const comparar = (a: ProdutoAdmin, b: ProdutoAdmin) => {
    const pa = precoMinimo(a), pb = precoMinimo(b);
    switch (ordem) {
      case "az": return a.nome.localeCompare(b.nome, "pt-BR");
      case "za": return b.nome.localeCompare(a.nome, "pt-BR");
      case "menor": return (pa ?? Infinity) - (pb ?? Infinity);
      case "maior": return (pb ?? -Infinity) - (pa ?? -Infinity);
      case "antigos": return 0; // a lista já vem do mais novo; invertida abaixo
      case "manual": return (a.ordem ?? 0) - (b.ordem ?? 0);
      default: return 0;
    }
  };
  let lista = (produtos ?? [])
    .filter((p) => (verLixeira ? p.excluido_em : !p.excluido_em))
    .filter((p) => semAcento(p.nome).includes(semAcento(busca)))
    .filter(passaFiltro)
    .filter(naCategoria);
  lista = ordem === "antigos" ? [...lista].reverse() : [...lista].sort(comparar);

  // ---- Editar vários de uma vez ----
  const marcar = (id: string) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  async function emMassa(rotulo: string, mudancas: Record<string, unknown>) {
    if (!loja || !marcados.length) return;
    setTrabalhando(rotulo);
    await supabaseNavegador().from("produtos").update(mudancas).in("id", marcados);
    setTrabalhando(""); setMarcados([]); carregar(loja);
  }
  async function categoriaEmMassa(categoriaId: string) {
    if (!loja || !categoriaId || !marcados.length) return;
    setTrabalhando("categoria");
    await supabaseNavegador().from("produtos_categorias").upsert(marcados.map((id) => ({ produto_id: id, categoria_id: categoriaId })), { ignoreDuplicates: true });
    setTrabalhando(""); setMarcados([]); carregar(loja);
  }
  async function promocaoEmMassa() {
    const pct = prompt("Desconto em % para os produtos marcados (ex.: 15). Deixe vazio para TIRAR a promoção:");
    if (pct === null) return;
    const n = Math.round(Number(pct));
    if (pct.trim() && !(n >= 1 && n <= 90)) return alert("Use um número de 1 a 90.");
    const dias = pct.trim() ? prompt("Por quantos dias? (vazio = sem data para acabar)") : "";
    const ate = dias && Number(dias) > 0 ? new Date(Date.now() + Number(dias) * 86400000).toISOString() : null;
    emMassa("promoção", pct.trim() ? { promocao_pct: n, promocao_ate: ate } : { promocao_pct: null, promocao_ate: null });
  }

  // ---- Ordem manual: ▲▼ trocam de lugar e a ordem nova é salva ----
  async function mover(indice: number, direcao: -1 | 1) {
    if (!loja) return;
    const j = indice + direcao;
    if (j < 0 || j >= lista.length) return;
    const nova = [...lista];
    [nova[indice], nova[j]] = [nova[j], nova[indice]];
    setProdutos((ps) => (ps ?? []).map((p) => { const k = nova.findIndex((x) => x.id === p.id); return k >= 0 ? { ...p, ordem: (k + 1) * 10 } : p; }));
    await Promise.all(nova.map((p, k) => (p.ordem === (k + 1) * 10 ? null : supabaseNavegador().from("produtos").update({ ordem: (k + 1) * 10 }).eq("id", p.id))));
  }

  async function restaurar(p: ProdutoAdmin) {
    await supabaseNavegador().from("produtos").update({ excluido_em: null }).eq("id", p.id);
    if (loja) carregar(loja);
  }
  async function apagarDeVez(p: ProdutoAdmin) {
    if (!confirm(`Apagar "${p.nome}" PARA SEMPRE? Isso não tem volta.`)) return;
    await supabaseNavegador().from("produtos").delete().eq("id", p.id);
    if (loja) carregar(loja);
  }
  const diasRestantes = (data: string) =>
    Math.max(0, DIAS_NA_LIXEIRA - Math.floor((Date.now() - new Date(data).getTime()) / (24 * 60 * 60 * 1000)));

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔍 Buscar produto..."
          className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm" />
        <button type="button" onClick={() => setVerLixeira(!verLixeira)} className="rounded-xl border bg-white px-4 py-2.5 text-sm">
          {verLixeira ? "← Produtos" : `🗑️ Lixeira (${naLixeira.length})`}
        </button>
        {!verLixeira && (
          <Link href={`/admin/${slug}/produtos/novo`} className="clicavel rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: cor }}>
            + Novo produto
          </Link>
        )}
      </div>

      {/* Ordem e filtros */}
      {!verLixeira && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className="rounded-xl border bg-white px-3 py-2" aria-label="Ordem">
            <option value="recentes">🕓 Mais recentes</option>
            <option value="antigos">🕰️ Mais antigos</option>
            <option value="az">🔤 Nome A → Z</option>
            <option value="za">🔤 Nome Z → A</option>
            <option value="menor">💰 Menor preço</option>
            <option value="maior">💎 Maior preço</option>
            <option value="manual">📌 Ordem da loja (arrastar ▲▼)</option>
          </select>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-xl border bg-white px-3 py-2" aria-label="Filtro">
            <option value="todos">Todos</option>
            <option value="visiveis">👀 Visíveis na loja</option>
            <option value="ocultos">🙈 Ocultos</option>
            <option value="destaque">⭐ Em destaque</option>
            <option value="pronta_entrega">✅ Pronta entrega</option>
            <option value="sob_encomenda">⏳ Sob encomenda</option>
            <option value="esgotado">🚫 Esgotados</option>
            <option value="sem_foto">📷 Sem foto</option>
            <option value="sem_preco">❓ Sem preço</option>
            <option value="estoque_baixo">📦 Estoque acabando (até 3)</option>
          </select>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="rounded-xl border bg-white px-3 py-2" aria-label="Categoria">
            <option value="">🗂️ Todas as categorias</option>
            {categorias.filter((c) => !c.parent_id).map((c) => [
              <option key={c.id} value={c.id}>{c.nome}</option>,
              ...categorias.filter((s) => s.parent_id === c.id).map((s) => <option key={s.id} value={s.id}>↳ {s.nome}</option>),
            ])}
          </select>
          <span className="opacity-60">{lista.length} {lista.length === 1 ? "produto" : "produtos"}</span>
          {(filtro !== "todos" || categoria || busca) && (
            <button type="button" onClick={() => { setFiltro("todos"); setCategoria(""); setBusca(""); }} className="underline opacity-70">Limpar filtros</button>
          )}
        </div>
      )}

      {ordem === "manual" && !verLixeira && (
        <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">📌 Use ▲▼ para escolher a ordem em que os produtos aparecem na loja (quem fica em cima aparece primeiro). Dica: filtre por categoria para arrumar uma de cada vez.</p>
      )}

      {/* Barra de ações para os produtos marcados */}
      {marcados.length > 0 && !verLixeira && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-stone-900 p-3 text-sm text-white shadow-xl">
          <b>{marcados.length} marcado{marcados.length > 1 ? "s" : ""}</b>
          <button type="button" onClick={() => emMassa("mostrar", { ativo: true })} className="rounded-full bg-white/15 px-3 py-1.5">👀 Mostrar</button>
          <button type="button" onClick={() => emMassa("ocultar", { ativo: false })} className="rounded-full bg-white/15 px-3 py-1.5">🙈 Ocultar</button>
          <button type="button" onClick={() => emMassa("destacar", { destaque: true })} className="rounded-full bg-white/15 px-3 py-1.5">⭐ Destacar</button>
          <button type="button" onClick={() => emMassa("tirar destaque", { destaque: false })} className="rounded-full bg-white/15 px-3 py-1.5">☆ Tirar destaque</button>
          <button type="button" onClick={promocaoEmMassa} className="rounded-full bg-red-600 px-3 py-1.5">🔥 Promoção</button>
          <select className="rounded-full bg-white/15 px-3 py-1.5" value="" onChange={(e) => e.target.value && emMassa("situação", { disponibilidade: e.target.value })}>
            <option value="" className="text-stone-900">Situação...</option>
            <option value="pronta_entrega" className="text-stone-900">✅ Pronta entrega</option>
            <option value="sob_encomenda" className="text-stone-900">⏳ Sob encomenda</option>
            <option value="esgotado" className="text-stone-900">🚫 Esgotado</option>
          </select>
          <select className="rounded-full bg-white/15 px-3 py-1.5" value="" onChange={(e) => categoriaEmMassa(e.target.value)}>
            <option value="" className="text-stone-900">+ Categoria...</option>
            {categorias.map((c) => <option key={c.id} value={c.id} className="text-stone-900">{c.parent_id ? "↳ " : ""}{c.nome}</option>)}
          </select>
          <button type="button" onClick={() => confirm(`Mandar ${marcados.length} produto(s) para a lixeira?`) && emMassa("lixeira", { excluido_em: new Date().toISOString() })}
            className="rounded-full bg-white/15 px-3 py-1.5">🗑️ Lixeira</button>
          <span className="flex-1" />
          {trabalhando ? <span className="opacity-70">Salvando...</span> : <button type="button" onClick={() => setMarcados([])} className="underline opacity-70">Desmarcar</button>}
        </div>
      )}
      {!verLixeira && lista.length > 0 && (
        <label className="mb-2 flex items-center gap-2 text-sm opacity-80">
          <input type="checkbox" checked={lista.every((p) => marcados.includes(p.id))}
            onChange={(e) => setMarcados(e.target.checked ? lista.map((p) => p.id) : [])} /> Marcar todos da lista
        </label>
      )}

      {verLixeira && <p className="mb-3 text-sm opacity-70">Produtos excluídos ficam aqui por {DIAS_NA_LIXEIRA} dias. Depois são apagados de vez.</p>}

      {!produtos ? <p className="opacity-60">Carregando produtos...</p> : lista.length === 0 ? (
        <p className="opacity-70">{verLixeira ? "A lixeira está vazia. 🎉" : "Nenhum produto encontrado."}</p>
      ) : (
        <div className="space-y-2">
          {lista.map((p, indice) => {
            const foto = [...p.midias].sort((a, b) => a.ordem - b.ordem).find((m) => m.tipo === "foto");
            const preco = precoMinimo(p);
            const miniatura = (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[10px]" style={{ background: `${cor}22` }}>
                {foto ? <img src={foto.url} alt="" className="h-full w-full object-cover" /> : "sem foto"}
              </span>
            );

            // Na lixeira: restaurar ou apagar de vez
            if (verLixeira) {
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-2 pr-3 shadow-sm">
                  {miniatura}
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{p.nome}</b>
                    <span className="text-xs text-red-600">Apagado de vez em {diasRestantes(p.excluido_em!)} dias</span>
                  </span>
                  <button type="button" onClick={() => restaurar(p)} className="rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">↩️ Restaurar</button>
                  <button type="button" onClick={() => apagarDeVez(p)} className="rounded-full border border-red-300 px-3 py-1.5 text-sm text-red-600">Apagar de vez</button>
                </div>
              );
            }

            return (
              <div key={p.id} className="flex items-center gap-2">
                {/* Marcar para editar vários de uma vez */}
                <input type="checkbox" checked={marcados.includes(p.id)} onChange={() => marcar(p.id)} className="h-5 w-5 shrink-0" aria-label={`Marcar ${p.nome}`} />
                {ordem === "manual" && (
                  <span className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => mover(indice, -1)} className="px-1 text-sm" aria-label="Subir">▲</button>
                    <button type="button" onClick={() => mover(indice, 1)} className="px-1 text-sm" aria-label="Descer">▼</button>
                  </span>
                )}
              <Link href={`/admin/${slug}/produtos/${p.id}`}
                className={`clicavel flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-sm ${p.ativo ? "" : "opacity-50"}`}>
                {miniatura}
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{p.nome}</b>
                  <span className="text-xs opacity-60">
                    {preco != null ? formatarPreco(preco) : "Sob consulta"} · {p.variacoes.length} variações · {p.midias.length} fotos/vídeos
                  </span>
                </span>
                {!p.ativo && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Oculto</span>}
                {p.destaque && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">⭐</span>}
                {promocaoAtiva(p) && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">🔥 -{p.promocao_pct}%</span>}
                {estoqueTotal(p) != null && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${estoqueTotal(p)! <= 3 ? "bg-orange-100 text-orange-800" : "bg-stone-100 text-stone-700"}`}>📦 {estoqueTotal(p)} un.</span>
                )}
              </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
