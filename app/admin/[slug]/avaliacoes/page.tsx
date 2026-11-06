"use client";
// =====================================================================
// PAINEL — AVALIAÇÕES (endereço: /admin/vitraforma/avaliacoes)
// Publique os elogios dos clientes (ex.: o print do WhatsApp): nome,
// texto, estrelas e foto. Pode ligar a um produto ou deixar da loja.
// Aparecem na página do produto e no fim da loja.
// =====================================================================
import { TAMANHOS } from "@/lib/tamanhos";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco, Campo, estiloInput } from "@/components/admin/Campos";
import CampoImagem from "@/components/admin/CampoImagem";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";

type Avaliacao = { id: string; nome: string | null; texto: string; foto_url: string | null; estrelas: number; ativo: boolean; produto_id: string | null; criado_em?: string };
const NOVA: Avaliacao = { id: "", nome: "", texto: "", foto_url: null, estrelas: 5, ativo: true, produto_id: null };

export default function PainelAvaliacoes() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [produtos, setProdutos] = useState<{ id: string; nome: string }[]>([]);
  const [editando, setEditando] = useState<Avaliacao>(NOVA);
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async (l: LojaResumo) => {
    const supabase = supabaseNavegador();
    const [a, p] = await Promise.all([
      supabase.from("avaliacoes").select("*").eq("loja_id", l.id).order("criado_em", { ascending: false }),
      supabase.from("produtos").select("id, nome").eq("loja_id", l.id).is("excluido_em", null).order("nome"),
    ]);
    setLista((a.data ?? []) as Avaliacao[]);
    setProdutos((p.data ?? []) as { id: string; nome: string }[]);
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); }); }, [slug, carregar]);
  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  async function salvar() {
    if (!loja || !editando.texto.trim()) return setAviso("Escreva o texto da avaliação.");
    const { id, criado_em: _c, ...campos } = editando;
    const dados = { ...campos, nome: campos.nome?.trim() || null, loja_id: loja.id };
    const r = id ? await supabaseNavegador().from("avaliacoes").update(dados).eq("id", id) : await supabaseNavegador().from("avaliacoes").insert(dados);
    if (r.error) return setAviso(`Erro: ${r.error.message}`);
    setAviso("✓ Avaliação salva!");
    setEditando(NOVA);
    carregar(loja);
  }
  async function excluir(a: Avaliacao) {
    if (!loja || !confirm("Excluir esta avaliação?")) return;
    await supabaseNavegador().from("avaliacoes").delete().eq("id", a.id);
    carregar(loja);
  }

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <Bloco titulo={editando.id ? "✏️ Editando avaliação" : "➕ Nova avaliação"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome do cliente (ou deixe vazio para anônimo)">
            <input className={estiloInput} value={editando.nome ?? ""} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} placeholder="Ex.: Ana P." />
          </Campo>
          <Campo rotulo="Produto (opcional)">
            <select className={estiloInput} value={editando.produto_id ?? ""} onChange={(e) => setEditando({ ...editando, produto_id: e.target.value || null })}>
              <option value="">Avaliação da loja (geral)</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Campo>
        </div>
        <Campo rotulo="O que o cliente disse">
          <textarea rows={3} className={estiloInput} value={editando.texto} onChange={(e) => setEditando({ ...editando, texto: e.target.value })} placeholder="Amei o vaso, chegou super bem embalado! 😍" />
        </Campo>
        <div>
          <span className="text-sm font-semibold">Estrelas</span>
          <div className="mt-1 flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setEditando({ ...editando, estrelas: n })} aria-label={`${n} estrelas`}>{n <= editando.estrelas ? "⭐" : "☆"}</button>
            ))}
          </div>
        </div>
        <CampoImagem rotulo="Foto (print da conversa ou foto do cliente com o produto — peça autorização)" valor={editando.foto_url} aoMudar={(url) => setEditando({ ...editando, foto_url: url })} pasta={`${loja.slug}/avaliacoes`} dica={TAMANHOS.avaliacao} recorte={{ proporcao: 1, largura: 1080, cores: [loja.cor] }} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editando.ativo} onChange={(e) => setEditando({ ...editando, ativo: e.target.checked })} /> Aparecer no site</label>
        {aviso && <p className="text-sm">{aviso}</p>}
        <div className="flex gap-2">
          {editando.id && <button type="button" onClick={() => setEditando(NOVA)} className="rounded-xl border px-4 text-sm">Cancelar</button>}
          <button type="button" onClick={salvar} className="flex-1 rounded-xl p-3 font-semibold text-white" style={{ background: cor }}>Salvar avaliação</button>
        </div>
      </Bloco>

      {lista.some((a) => !a.ativo) && (
        <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          ⭐ Tem avaliação nova esperando! As que os clientes mandam pelo acompanhamento do pedido chegam <b>ocultas</b> (apagadinhas abaixo):
          toque em <b>Editar</b>, marque “Aparecer no site” e salve para publicar.
        </p>
      )}
      <Bloco titulo="💬 Avaliações">
        {lista.length === 0 ? <p className="text-sm opacity-60">Nenhuma ainda.</p> : lista.map((a) => (
          <div key={a.id} className={`flex gap-3 rounded-xl bg-stone-50 p-3 ${a.ativo ? "" : "opacity-50"}`}>
            {a.foto_url && <img src={a.foto_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1 text-sm">
              <span>{"⭐".repeat(a.estrelas)}</span> <b>{a.nome || "Cliente"}</b>
              {a.produto_id && <span className="opacity-60"> · {produtos.find((p) => p.id === a.produto_id)?.nome}</span>}
              <p className="line-clamp-2 opacity-80">{a.texto}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button type="button" onClick={() => setEditando(a)} className="rounded-lg border px-2 py-1 text-xs">Editar</button>
              <button type="button" onClick={() => excluir(a)} className="rounded-lg border px-2 py-1 text-xs text-red-600">🗑️</button>
            </div>
          </div>
        ))}
      </Bloco>
    </>
  );
}
