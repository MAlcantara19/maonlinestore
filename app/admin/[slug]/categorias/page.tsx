"use client";
// =====================================================================
// PAINEL — CATEGORIAS E COLEÇÕES (endereço: /admin/vitraforma/categorias)
//
// CATEGORIAS: sempre em ORDEM ALFABÉTICA, numeradas sozinhas:
//   1. Brinquedos      1.1 Adultos    1.2 Bebês
//   2. Chaveiros
//   3. Decoração ...
// Na loja e no menu elas também aparecem em ordem alfabética.
//
// COLEÇÕES: ordem escolhida por vocês, com ▲ ▼ (os números se ajeitam
// sozinhos, nunca repetem) ou o botão "Ordenar A–Z".
// =====================================================================
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { OPCOES_EFEITO, OPCOES_FONTE, nomeColecao } from "@/lib/opcoes";
import type { Categoria, Efeito, EfeitoPersonalizado } from "@/lib/tipos";

type Colecao = { id: string; nome: string; descricao: string | null; em_destaque: boolean; ativa: boolean; efeito: Efeito; ordem: number; efeito_personalizado_id: string | null; fonte: string | null };
const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });

export default function PainelCategorias() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [colecoes, setColecoes] = useState<Colecao[]>([]);
  const [aviso, setAviso] = useState("");
  const [personalizados, setPersonalizados] = useState<EfeitoPersonalizado[]>([]);

  const recarregar = useCallback(async (l: LojaResumo) => {
    const supabase = supabaseNavegador();
    const [cat, col, ef] = await Promise.all([
      supabase.from("categorias").select("id, nome, descricao, parent_id, ordem, efeito_personalizado_id").eq("loja_id", l.id),
      supabase.from("colecoes").select("id, nome, descricao, em_destaque, ativa, efeito, ordem, efeito_personalizado_id, fonte").eq("loja_id", l.id).order("ordem").order("nome"),
      supabase.from("efeitos_personalizados").select("id, nome, imagens, movimento, quantidade, tamanho").eq("loja_id", l.id),
    ]);
    setPersonalizados((ef.data ?? []) as EfeitoPersonalizado[]);
    setCategorias(((cat.data ?? []) as Categoria[]).sort(porNome));
    setColecoes((col.data ?? []) as Colecao[]);
  }, []);

  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) recarregar(l); }); }, [slug, recarregar]);
  if (!loja) return <p className="opacity-60">Carregando...</p>;

  const cor = loja.cor ?? "#333";
  const supabase = () => supabaseNavegador();
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  // ---- Categorias ----
  async function criarCategoria(nome: string, parent_id: string | null) {
    if (!nome.trim() || !loja) return;
    const { error } = await supabase().from("categorias").insert({ loja_id: loja.id, nome: nome.trim(), parent_id });
    if (error) return avisar(`Erro: ${error.message}`);
    avisar("✓ Criada! (já entrou na ordem alfabética)"); recarregar(loja);
  }
  async function salvarCategoria(c: Categoria) {
    const { error } = await supabase().from("categorias").update({ nome: c.nome.trim(), descricao: c.descricao, efeito_personalizado_id: c.efeito_personalizado_id ?? null }).eq("id", c.id);
    avisar(error ? `Erro: ${error.message}` : "✓ Salva!");
    if (!error && loja) recarregar(loja); // reordena se o nome mudou
  }
  async function excluirCategoria(c: Categoria) {
    if (!loja || !confirm(`Excluir "${c.nome}"? As subcategorias dela também somem. Os produtos ficam "sem categoria".`)) return;
    await supabase().from("categorias").delete().eq("id", c.id);
    recarregar(loja);
  }
  const mudarCat = (id: string, campo: keyof Categoria, valor: string | null) =>
    setCategorias(categorias.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));

  // ---- Coleções ----
  // Grava a ordem 1, 2, 3... de toda a lista (nunca fica número repetido)
  async function gravarOrdem(lista: Colecao[]) {
    const numerada = lista.map((c, i) => ({ ...c, ordem: i + 1 }));
    setColecoes(numerada);
    await Promise.all(numerada.map((c) => supabase().from("colecoes").update({ ordem: c.ordem }).eq("id", c.id)));
  }
  const mover = (i: number, direcao: -1 | 1) => {
    const j = i + direcao;
    if (j < 0 || j >= colecoes.length) return;
    const nova = [...colecoes];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    gravarOrdem(nova);
  };
  async function criarColecao(nome: string) {
    if (!nome.trim() || !loja) return;
    const { error } = await supabase().from("colecoes").insert({ loja_id: loja.id, nome: nome.trim(), ordem: colecoes.length + 1 });
    if (error) return avisar(`Erro: ${error.message}`);
    avisar("✓ Criada! (entrou no fim da lista)"); recarregar(loja);
  }
  async function salvarColecao(c: Colecao) {
    const { id, ordem: _o, ...campos } = c;
    const { error } = await supabase().from("colecoes").update(campos).eq("id", id);
    avisar(error ? `Erro: ${error.message}` : "✓ Salva!");
  }
  async function excluirColecao(c: Colecao) {
    if (!loja || !confirm(`Excluir a coleção "${c.nome}"? Os produtos continuam na loja.`)) return;
    await supabase().from("colecoes").delete().eq("id", c.id);
    gravarOrdem(colecoes.filter((x) => x.id !== c.id));
  }
  const mudarCol = <K extends keyof Colecao>(id: string, campo: K, valor: Colecao[K]) =>
    setColecoes(colecoes.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)));

  const principais = categorias.filter((c) => !c.parent_id);
  const celula = "rounded-lg border bg-white px-2 py-1.5 text-sm";
  const botao = "rounded-lg border px-3 py-1.5 text-sm";

  // Copia o link direto para a categoria (para anúncios e stories)
  const copiarLink = async (ancora: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/${slug}#${ancora}`);
    avisar("✓ Link copiado! Cole no Instagram, WhatsApp...");
  };
  // Seletor de efeito personalizado (liga quando o cliente chega nessa parte da loja)
  const seletorEfeito = (valor: string | null | undefined, aoMudar: (v: string | null) => void) =>
    personalizados.length > 0 && (
      <select className={celula} value={valor ?? ""} onChange={(e) => aoMudar(e.target.value || null)} title="Efeito personalizado nesta parte da loja">
        <option value="">✨ Sem efeito próprio</option>
        {personalizados.map((e) => <option key={e.id} value={e.id}>✨ {e.nome}</option>)}
      </select>
    );

  // Uma linha de categoria/subcategoria, com o número automático (1, 1.1...)
  const linhaCategoria = (c: Categoria, numero: string, sub = false) => (
    <div key={c.id} className={`flex flex-wrap items-center gap-2 ${sub ? "ml-6 border-l-2 pl-3" : ""}`} style={sub ? { borderColor: cor } : {}}>
      <span className="w-10 shrink-0 text-right font-mono text-sm font-bold" style={{ color: cor }}>{numero}</span>
      <input className={`${celula} min-w-0 flex-1 font-semibold`} value={c.nome} onChange={(e) => mudarCat(c.id, "nome", e.target.value)} />
      <input className={`${celula} min-w-0 flex-[2]`} placeholder="Descrição (opcional)" value={c.descricao ?? ""} onChange={(e) => mudarCat(c.id, "descricao", e.target.value || null)} />
      {seletorEfeito(c.efeito_personalizado_id, (v) => setCategorias(categorias.map((x) => (x.id === c.id ? { ...x, efeito_personalizado_id: v } : x))))}
      <button type="button" className={botao} onClick={() => copiarLink(sub ? `sub-${c.id}` : `categoria-${c.id}`)} title="Copiar link direto">🔗</button>
      <button type="button" className={botao} onClick={() => salvarCategoria(c)}>Salvar</button>
      <button type="button" className={`${botao} text-red-600`} onClick={() => excluirCategoria(c)}>🗑️</button>
    </div>
  );

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      {aviso && <p className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">{aviso}</p>}

      <Bloco titulo="🗂️ Categorias e subcategorias (ordem alfabética automática) · borda azul">
        {principais.map((c, i) => (
          <div key={c.id} className="space-y-2 rounded-xl border-l-4 border-sky-400 bg-sky-50/50 p-2">
            {linhaCategoria(c, `${i + 1}.`)}
            {categorias.filter((s) => s.parent_id === c.id).map((s, j) => linhaCategoria(s, `${i + 1}.${j + 1}`, true))}
            <NovoItem placeholder={`Nova subcategoria em ${c.nome}`} aoCriar={(n) => criarCategoria(n, c.id)} recuo />
          </div>
        ))}
        <NovoItem placeholder="Nova categoria (ex.: Brinquedos)" aoCriar={(n) => criarCategoria(n, null)} />
      </Bloco>

      <Bloco titulo="✨ Coleções · borda dourada = em destaque">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs opacity-60">Use ▲ ▼ para mudar a ordem. "Em destaque" aparece no topo da loja.</p>
          <button type="button" className={botao} onClick={() => gravarOrdem([...colecoes].sort(porNome))}>🔤 Ordenar A–Z</button>
        </div>
        {colecoes.map((c, i) => (
          <div key={c.id} className="space-y-2 rounded-xl border-l-4 bg-amber-50/60 p-3" style={{ borderColor: c.em_destaque ? "#f5c542" : cor }}>
            <p className="pl-10 text-xs font-semibold opacity-60">Na loja aparece como: {c.em_destaque ? "✨ " : ""}{nomeColecao(c.nome || "...")}{c.em_destaque ? " (em Destaques)" : " (em Coleções)"}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 shrink-0 text-center font-mono text-sm font-bold" style={{ color: cor }}>{i + 1}.</span>
              <div className="flex flex-col">
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="px-1 text-xs disabled:opacity-20" aria-label="Subir">▲</button>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === colecoes.length - 1} className="px-1 text-xs disabled:opacity-20" aria-label="Descer">▼</button>
              </div>
              <input className={`${celula} min-w-0 flex-1 font-semibold`} value={c.nome} onChange={(e) => mudarCol(c.id, "nome", e.target.value)} />
              <input className={`${celula} min-w-0 flex-[2]`} placeholder="Descrição" value={c.descricao ?? ""} onChange={(e) => mudarCol(c.id, "descricao", e.target.value || null)} />
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-10">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={c.em_destaque} onChange={(e) => mudarCol(c.id, "em_destaque", e.target.checked)} /> Em destaque</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={c.ativa} onChange={(e) => mudarCol(c.id, "ativa", e.target.checked)} /> Visível</label>
              <select className={celula} value={c.efeito} onChange={(e) => mudarCol(c.id, "efeito", e.target.value as Efeito)}>
                {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
              </select>
              {seletorEfeito(c.efeito_personalizado_id, (v) => mudarCol(c.id, "efeito_personalizado_id", v))}
              <select className={celula} value={c.fonte ?? ""} onChange={(e) => mudarCol(c.id, "fonte", e.target.value || null)} title="Fonte do título desta coleção">
                <option value="">🔤 Fonte da loja</option>
                {OPCOES_FONTE.map((f) => <option key={f.valor} value={f.valor}>🔤 {f.rotulo}</option>)}
              </select>
              <span className="flex-1" />
              <button type="button" className={botao} onClick={() => copiarLink(`colecao-${c.id}`)} title="Copiar link direto">🔗</button>
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
