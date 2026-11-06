"use client";
// =====================================================================
// PAINEL — LISTA DE COMPRAS (endereço: /admin/vitraforma/compras)
//   - Produtos com estoque baixo entram sozinhos (quanto falta)
//   - Materiais avulsos (filamento, embalagem, argola...) você adiciona
//   - Marque o que já comprou, mande a lista no WhatsApp e registre a
//     compra no 💰 Financeiro com um toque
// A lista fica salva neste aparelho.
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, paraNumero, type LojaResumo } from "@/lib/admin";
import { formatarPreco } from "@/lib/formato";
import { linkWhatsApp } from "@/lib/whatsapp";
import { estoqueTotal } from "@/lib/estoque";
import type { Produto } from "@/lib/tipos";

type Material = { nome: string; quantidade: string; comprado: boolean };
const SUGESTOES = ["🧵 Filamento PLA", "🧵 Filamento PETG", "📦 Caixinhas", "🎀 Fita / laço", "🏷️ Etiquetas", "🔗 Argolas de chaveiro", "🧲 Ímãs", "🫧 Plástico bolha", "🖌️ Tinta / verniz"];

export default function PainelCompras() {
  return <AreaAdmin>{() => <Compras />}</AreaAdmin>;
}

function Compras() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [baixos, setBaixos] = useState<(Produto & { falta: number })[] | null>(null);
  const [limite, setLimite] = useState(3);
  const [itens, setItens] = useState<Material[]>([]);
  const [novo, setNovo] = useState("");
  const [valor, setValor] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => { try { setItens(JSON.parse(localStorage.getItem(`compras:${slug}`) ?? "[]")); } catch {} }, [slug]);
  const guardar = (l: Material[]) => { setItens(l); try { localStorage.setItem(`compras:${slug}`, JSON.stringify(l)); } catch {} };

  useEffect(() => {
    lojaPeloSlug(slug).then((l) => {
      setLoja(l);
      if (!l) return;
      supabaseNavegador().from("produtos").select("id, nome, estoque, preco, disponibilidade, variacoes(id, nome, tamanho, cor, estoque, ativa, ordem, preco, disponibilidade, prazo)")
        .eq("loja_id", l.id).is("excluido_em", null).eq("ativo", true)
        .then(({ data }: { data: Produto[] | null }) => {
          const lista = (data ?? []).map((p) => ({ ...p, variacoes: p.variacoes ?? [] }))
            .map((p) => ({ ...p, total: estoqueTotal(p as Produto) }))
            .filter((p) => p.total != null && p.total <= limite)
            .map((p) => ({ ...(p as unknown as Produto), falta: Math.max(1, limite * 2 - (p.total ?? 0)) }));
          setBaixos(lista);
        });
    });
  }, [slug, limite]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 2500); };

  const textoLista = [
    `🛒 *Lista de compras — ${loja.nome}*`,
    ...(baixos ?? []).map((p) => `☐ ${p.nome} — repor ${p.falta} (tem ${estoqueTotal(p) ?? 0})`),
    ...itens.filter((i) => !i.comprado).map((i) => `☐ ${i.nome}${i.quantidade ? ` — ${i.quantidade}` : ""}`),
  ].join("\n");

  async function registrarCompra() {
    const v = paraNumero(valor);
    if (!loja || !v) return avisar("Coloque quanto gastou.");
    const comprados = itens.filter((i) => i.comprado);
    const { error } = await supabaseNavegador().from("movimentacoes").insert({
      loja_id: loja.id, tipo: "saida", categoria: "material", valor: v, forma_pagamento: "pix",
      descricao: comprados.length ? `Compra: ${comprados.map((i) => i.nome.replace(/^\S+\s/, "")).join(", ")}` : "Compra de material",
    });
    if (error) return avisar(`Erro: ${error.message}`);
    guardar(itens.filter((i) => !i.comprado));
    setValor("");
    avisar("✓ Compra registrada no Financeiro (saída) e itens comprados tirados da lista!");
  }

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      {aviso && <p className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">{aviso}</p>}

      <Bloco titulo="📦 Produtos acabando (entram sozinhos)">
        <label className="text-sm">Avisar quando o estoque for até{" "}
          <input className="w-14 rounded border px-1 text-center" inputMode="numeric" value={limite} onChange={(e) => setLimite(Number(e.target.value.replace(/\D/g, "")) || 0)} /> unidades
        </label>
        {!baixos ? <p className="text-sm opacity-60">Carregando...</p> : baixos.length === 0 ? <p className="text-sm opacity-60">Nenhum produto com estoque baixo. 🎉 (Só entram produtos com estoque controlado.)</p> : (
          <ul className="space-y-1 text-sm">
            {baixos.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
                <span className="flex-1"><b>{p.nome}</b> <span className="opacity-60">· tem {estoqueTotal(p) ?? 0}</span></span>
                <span>repor <b>{p.falta}</b></span>
                <a href={`/admin/${slug}/produtos/${p.id}`} className="text-xs underline">abrir</a>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco titulo="🧵 Materiais para comprar">
        <div className="flex flex-wrap gap-1">
          {SUGESTOES.map((s) => <button key={s} type="button" onClick={() => guardar([...itens, { nome: s, quantidade: "", comprado: false }])} className="rounded-full border px-2 py-1 text-xs">+ {s}</button>)}
        </div>
        <div className="flex gap-2">
          <input className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2" value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Outro item (ex.: PLA roxo 1 kg)"
            onKeyDown={(e) => { if (e.key === "Enter" && novo.trim()) { guardar([...itens, { nome: novo.trim(), quantidade: "", comprado: false }]); setNovo(""); } }} />
          <button type="button" onClick={() => { if (novo.trim()) { guardar([...itens, { nome: novo.trim(), quantidade: "", comprado: false }]); setNovo(""); } }} className="rounded-lg px-4 font-semibold text-white" style={{ background: cor }}>+</button>
        </div>
        <ul className="space-y-1 text-sm">
          {itens.map((i, n) => (
            <li key={n} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2">
              <input type="checkbox" checked={i.comprado} onChange={() => guardar(itens.map((x, j) => (j === n ? { ...x, comprado: !x.comprado } : x)))} className="h-5 w-5" />
              <span className={`flex-1 ${i.comprado ? "line-through opacity-50" : ""}`}>{i.nome}</span>
              <input className="w-24 rounded border px-2 py-1" value={i.quantidade} onChange={(e) => guardar(itens.map((x, j) => (j === n ? { ...x, quantidade: e.target.value } : x)))} placeholder="qtd" />
              <button type="button" onClick={() => guardar(itens.filter((_, j) => j !== n))} className="text-red-600" aria-label="Tirar">✕</button>
            </li>
          ))}
        </ul>
      </Bloco>

      <Bloco titulo="📲 Enviar e registrar">
        <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-white p-3 font-sans text-sm">{textoLista}</pre>
        <a href={linkWhatsApp("", textoLista)} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-green-600 p-3 text-center font-semibold text-white">📲 Mandar a lista no WhatsApp</a>
        <div className="flex gap-2">
          <input className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Quanto gastou na compra (R$)" />
          <button type="button" onClick={registrarCompra} className="rounded-lg bg-red-700 px-4 font-semibold text-white">⬇️ Registrar no Financeiro</button>
        </div>
        <p className="text-xs opacity-60">Registra uma <b>saída</b> de “Filamento / material” com os itens marcados como comprados {valor && paraNumero(valor) ? `(${formatarPreco(paraNumero(valor)!)})` : ""} e tira esses itens da lista.</p>
      </Bloco>
    </>
  );
}
