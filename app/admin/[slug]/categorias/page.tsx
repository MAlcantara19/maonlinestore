"use client";
// =====================================================================
// PAINEL — CATEGORIAS E COLEÇÕES (endereço: /admin/vitraforma/categorias)
//   Categorias: principais e subcategorias (ex.: Brinquedos > Tabuleiro)
//   Coleções: grupos de produtos (Natal, Santos...) com destaque e efeito
// Cada linha tem o seu "Salvar" e "Excluir".
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { OPCOES_EFEITO } from "@/lib/opcoes";
import type { Categoria, Efeito } from "@/lib/tipos";

type Colecao = { id: string; nome: string; descricao: string | null; em_destaque: boolean; ativa: boolean; efeito: Efeito; ordem: number };

export default function PainelCategorias() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [colecoes, setColecoes] = useState<Colecao[]>([]);
  const [aviso, setAviso] = useState("");

  async function recarregar(l: LojaResumo) {
    const supabase = supabaseNavegador();
    const [cat, col] = await Promise.all([
      supabase.from("categorias").select("id, nome, descricao, parent_id, ordem").eq("loja_id", l.id).order("ordem"),
      supabase.from("colecoes").select("id, nome, descricao, em_destaque, ativa, efeito, ordem").eq("loja_id", l.id).order("ordem"),
    ]);
    setCategorias((cat.data ?? []) as Categoria[]);
    setColecoes((col.data ?? []) as Colecao[]);
  }

  useEffect(() => {
    lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) recarregar(l); });
  }, [slug]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const supabase = () => supabaseNavegador();
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  // ---- Ações das categorias ----
  async function criarCategoria(nome: string, parent_id: string | null) {
    if (!nome.trim() || !loja) return;
    const { error } = await supabase().from("categorias").insert({ loja_id: loja.id, nome: nome.trim(), parent_id, ordem: categorias.length + 1 });
    if (error) return avisar(`Erro: ${error.message}`);
    avisar("✓ Criada!"); recarregar(loja);
  }
  async function salvarCategoria(c: Categoria) {
    const { error } = await supabase().from("categorias").update({ nome: c.nome, descricao: c.descricao, ordem: c.ordem }).eq("id", c.id);
    avisar(error ? `Erro: ${error.message}` : "✓ Salva!");
  }
  async function excluirCategoria(c: Categoria) {
    if (!loja || !confirm(`Excluir "${c.nome}"? As subcategorias dela também somem. Os produtos ficam "sem categoria".`)) return;
    await supabase().from("categorias").delete().eq("id", c.id);
    recarregar(loja);
  }

  // ---- Ações das coleções ----
  async function criarColecao(nome: string) {
    if (!nome.trim() || !loja) return;
    const { error } = await supabase().from("colecoes").insert({ loja_id: loja.id, nome: nome.trim(), ordem: colecoes.length + 1 });
    if (error) return avisar(`Erro: ${error.message}`);
    avisar("✓ Criada!"); recarregar(loja);
  }
  async function salvarColecao(c: Colecao) {
    const { id, ...campos } = c;
    const { error } = await supabase().from("colecoes").update(campos).eq("id", id);
    avisar(error ? `Erro: ${error.message}` : "✓ Salva!");
  }
  async function excluirColecao(c: Colecao) {
    if (!loja || !confirm(`Excluir a coleção "${c.nome}"? Os produtos continuam na loja.`)) return;
    await supabase().from("colecoes").delete().eq("id", c.id);
    recarregar(loja);
  }

  const mudarCat = (id: string, campo: keyof Categoria, valor: string | number | null) =>
    setCategorias(categorias.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));
  const mudarCol = <K extends keyof Colecao>(id: string, campo: K, valor: Colecao[K]) =>
    setColecoes(colecoes.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));

  const principais = categorias.filter((c) => !c.parent_id);
  const celula = "rounded-lg border bg-white px-2 py-1.5 text-sm";
  const botao = "rounded-lg border px-3 py-1.5 text-sm";

  // Linha de uma categoria ou subcategoria
  const linhaCategoria = (c: Categoria, sub = false) => (
    <div key={c.id} className={`flex flex-wrap items-center gap-2 ${sub ? "ml-6 border-l-2 pl-3" : ""}`} style={sub ? { borderColor: cor } : {}}>
      <input className={`${celula} min-w-0 flex-1 font-semibold`} value={c.nome} onChange={(e) => mudarCat(c.id, "nome", e.target.value)} />
      <input className={`${celula} min-w-0 flex-[2]`} placeholder="Descrição (opcional)" value={c.descricao ?? ""} onChange={(e) => mudarCat(c.id, "descricao", e.target.value || null)} />
      <input className={`${celula} w-16`} type="number" title="Ordem" value={c.ordem} onChange={(e) => mudarCat(c.id, "ordem", Number(e.target.value) || 0)} />
      <button type="button" className={botao} onClick={() => salvarCategoria(c)}>Salvar</button>
      <button type="button" className={`${botao} text-red-600`} onClick={() => excluirCategoria(c)}>🗑️</button>
    </div>
  );

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      {aviso && <p className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">{aviso}</p>}

      <Bloco titulo="🗂️ Categorias e subcategorias">
        {principais.map((c) => (
          <div key={c.id} className="space-y-2 rounded-xl bg-stone-50 p-2">
            {linhaCategoria(c)}
            {categorias.filter((s) => s.parent_id === c.id).map((s) => linhaCategoria(s, true))}
            <NovoItem placeholder={`Nova subcategoria em ${c.nome}`} aoCriar={(n) => criarCategoria(n, c.id)} recuo />
          </div>
        ))}
        <NovoItem placeholder="Nova categoria (ex.: Brinquedos)" aoCriar={(n) => criarCategoria(n, null)} />
      </Bloco>

      <Bloco titulo="✨ Coleções">
        <p className="text-xs opacity-60">"Em destaque" aparece no topo da loja. "Efeito" anima a loja enquanto a coleção estiver em destaque.</p>
        {colecoes.map((c) => (
          <div key={c.id} className="space-y-2 rounded-xl bg-stone-50 p-3">
            <div className="flex flex-wrap gap-2">
              <input className={`${celula} min-w-0 flex-1 font-semibold`} value={c.nome} onChange={(e) => mudarCol(c.id, "nome", e.target.value)} />
              <input className={`${celula} min-w-0 flex-[2]`} placeholder="Descrição" value={c.descricao ?? ""} onChange={(e) => mudarCol(c.id, "descricao", e.target.value || null)} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={c.em_destaque} onChange={(e) => mudarCol(c.id, "em_destaque", e.target.checked)} /> Em destaque</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={c.ativa} onChange={(e) => mudarCol(c.id, "ativa", e.target.checked)} /> Visível</label>
              <select className={celula} value={c.efeito} onChange={(e) => mudarCol(c.id, "efeito", e.target.value as Efeito)}>
                {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
              </select>
              <input className={`${celula} w-16`} type="number" title="Ordem" value={c.ordem} onChange={(e) => mudarCol(c.id, "ordem", Number(e.target.value) || 0)} />
              <span className="flex-1" />
              <button type="button" className={botao} onClick={() => salvarColecao(c)}>Salvar</button>
              <button type="button" className={`${botao} text-red-600`} onClick={() => excluirColecao(c)}>🗑️</button>
            </div>
          </div>
        ))}
        <NovoItem placeholder="Nova coleção (ex.: Dia das Mães)" aoCriar={criarColecao} />
        <p className="text-xs opacity-60">Para colocar produtos numa coleção, abra o produto e marque a coleção.</p>
      </Bloco>
    </>
  );
}

// Campo + botão "Criar"
function NovoItem({ placeholder, aoCriar, recuo }: { placeholder: string; aoCriar: (nome: string) => void; recuo?: boolean }) {
  const [nome, setNome] = useState("");
  return (
    <div className={`flex gap-2 ${recuo ? "ml-6 pl-3" : ""}`}>
      <input className="min-w-0 flex-1 rounded-lg border bg-white px-2 py-1.5 text-sm" placeholder={placeholder} value={nome}
        onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { aoCriar(nome); setNome(""); } }} />
      <button type="button" className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm text-white" onClick={() => { aoCriar(nome); setNome(""); }}>+ Criar</button>
    </div>
  );
}
