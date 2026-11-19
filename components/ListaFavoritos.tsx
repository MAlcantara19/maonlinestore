"use client";
// =====================================================================
// Lista dos produtos favoritados (busca no banco pelos ids guardados).
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { alternarFavorito, usarFavoritos } from "@/lib/favoritos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Produto } from "@/lib/tipos";
import CardDoProduto from "@/components/CardDoProduto";

const COLUNAS = "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, criado_em, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, previa_cor, personalizacao, tempo_min, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";

export default function ListaFavoritos({ slug, lojaId, cor }: { slug: string; lojaId: string; cor: string }) {
  const meus = usarFavoritos(slug);
  // 🎁 Lista compartilhada: /vitraforma/favoritos?lista=id1,id2 (lista de presentes/desejos de alguém)
  const [compartilhada, setCompartilhada] = useState<string[] | null>(null);
  const [dono, setDono] = useState({ nome: "", titulo: "" }); // de quem é a lista recebida
  const [meuNome, setMeuNome] = useState("");
  const [ocasiao, setOcasiao] = useState("Minha lista de Natal 🎄");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const l = q.get("lista");
    if (l) setCompartilhada(l.split(",").filter(Boolean).slice(0, 60));
    setDono({ nome: (q.get("nome") ?? "").slice(0, 30), titulo: (q.get("titulo") ?? "").slice(0, 40) });
    try { setMeuNome(localStorage.getItem("meu-nome-lista") ?? ""); } catch {}
  }, []);
  const ids = compartilhada ?? meus;
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function compartilhar() {
    try { localStorage.setItem("meu-nome-lista", meuNome.trim()); } catch {}
    setEnviando(true);
    // 🎄 Lista com contador ("3 de 8 presentes garantidos") — atualização 34.
    // Se ainda não rodou a 34 no Supabase, manda o link antigo (sem contador).
    const { data: codigo } = await supabaseNavegador().rpc("criar_lista_presentes", { p_slug: slug, p_nome: meuNome.trim(), p_titulo: ocasiao, p_produtos: meus })
      .then((r: { data: string | null }) => r, () => ({ data: null }));
    setEnviando(false);
    const extra = `${meuNome.trim() ? `&nome=${encodeURIComponent(meuNome.trim())}` : ""}&titulo=${encodeURIComponent(ocasiao)}`;
    const url = codigo ? `${window.location.origin}/${slug}/lista/${codigo}` : `${window.location.origin}/${slug}/favoritos?lista=${meus.join(",")}${extra}`;
    const texto = `🎁 ${ocasiao}${meuNome.trim() ? ` — ${meuNome.trim()}` : ""}\nSe quiser me dar um presente, é por aqui 😊`;
    if (navigator.share) await navigator.share({ title: "Minha lista", text: texto, url }).catch(() => {});
    else { await navigator.clipboard.writeText(`${texto}\n${url}`).catch(() => {}); setAviso("✓ Link copiado!"); }
  }
  const [produtos, setProdutos] = useState<Produto[] | null>(null);

  useEffect(() => {
    if (!ids.length) { setProdutos([]); return; }
    supabaseNavegador().from("produtos").select(COLUNAS).eq("loja_id", lojaId).eq("ativo", true).is("excluido_em", null).in("id", ids)
      .then(({ data }: { data: Produto[] | null }) => setProdutos((data ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))));
  }, [ids, lojaId]);

  if (!produtos) return <p className="mt-4 opacity-60">Carregando...</p>;
  if (!produtos.length) {
    return (
      <div className="mt-8 text-center">
        <p className="text-4xl">🤍</p>
        <p className="opacity-70">Você ainda não favoritou nada. Toque no coração dos produtos que gostar!</p>
        <Link href={`/${slug}`} className="mt-3 inline-block font-semibold underline">Ver produtos</Link>
      </div>
    );
  }
  return (
    <>
    {compartilhada ? (
      <div className="mt-3 rounded-2xl p-4 text-white" style={{ background: cor }}>
        <b className="text-lg">🎁 {dono.titulo || "Lista de desejos"}{dono.nome ? ` · ${dono.nome}` : ""}</b>
        <p className="text-sm opacity-90">Toque no ＋ de um produto para colocar no carrinho e presentear. 💜</p>
        <button type="button" className="mt-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold" style={{ color: cor }}
          onClick={() => { compartilhada.forEach((id) => { if (!meus.includes(id)) alternarFavorito(slug, id); }); setAviso("✓ Salvos nos seus favoritos!"); }}>
          ❤️ Salvar todos nos meus favoritos
        </button>
      </div>
    ) : (
      <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: `${cor}55` }}>
        <b className="text-sm">📤 Compartilhe sua lista de desejos</b>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input value={meuNome} onChange={(e) => setMeuNome(e.target.value)} maxLength={30} placeholder="Seu nome (ex.: Ana)" className="rounded-xl border bg-white px-3 py-2 text-sm text-stone-900" />
          <select value={ocasiao} onChange={(e) => setOcasiao(e.target.value)} className="rounded-xl border bg-white px-3 py-2 text-sm text-stone-900">
            {["Minha lista de Natal 🎄", "Meu aniversário 🎂", "Amigo secreto 🎁", "Chá de casa nova 🏡", "Dia das Mães 💐", "Minha lista de desejos ✨"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <p className="mt-1 text-xs opacity-60">Quem abrir o link toca em “Vou dar este” e todo mundo vê o que já foi garantido — ninguém repete presente 😉</p>
        <button type="button" onClick={compartilhar} disabled={enviando} className="mt-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: cor }}>{enviando ? "Criando a lista..." : "📤 Enviar minha lista"}</button>
      </div>
    )}
    {aviso && <p className="mt-2 text-sm">{aviso}</p>}
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
      {produtos.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
    </div>
    </>
  );
}
