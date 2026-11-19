"use client";
// =====================================================================
// 🎄 LISTA DE PRESENTES (Lista de Natal) — quem recebe o link vê os
// produtos e toca em "🎁 Vou dar este". O contador mostra quantos
// presentes já foram garantidos e quantas pessoas já presentearam,
// para ninguém dar o mesmo presente. Ninguém é identificado.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Produto } from "@/lib/tipos";
import CardDoProduto from "@/components/CardDoProduto";
import BotaoCompartilhar from "@/components/BotaoCompartilhar";

type Props = {
  codigo: string; slug: string; cor: string; nome: string | null; titulo: string | null;
  produtos: Produto[]; marcas: Record<string, number>; pessoas: number;
};

export default function ListaDePresentes(p: Props) {
  const chave = `lista-marcas:${p.codigo}`;
  const [marcas, setMarcas] = useState(p.marcas);
  const [pessoas, setPessoas] = useState(p.pessoas);
  const [minhas, setMinhas] = useState<string[]>([]); // o que ESTE aparelho marcou
  useEffect(() => { try { setMinhas(JSON.parse(localStorage.getItem(chave) ?? "[]")); } catch {} }, [chave]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  const garantidos = p.produtos.filter((x) => (marcas[x.id] ?? 0) > 0).length;
  const total = p.produtos.length;
  const pct = total ? Math.round((garantidos / total) * 100) : 0;
  const titulo = p.titulo || "Lista de presentes 🎁";

  async function marcar(id: string) {
    const desfazer = minhas.includes(id);
    setOcupado(id);
    try {
      const sb = supabaseNavegador();
      const { error } = await sb.rpc("marcar_presente", { p_codigo: p.codigo, p_produto: id, p_desfazer: desfazer });
      if (error) { setAviso("Não deu certo agora. Tente de novo em instantes."); return; }
      const novas = desfazer ? minhas.filter((x) => x !== id) : [...minhas, id];
      setMinhas(novas);
      try { localStorage.setItem(chave, JSON.stringify(novas)); } catch {}
      const { data } = await sb.rpc("ver_lista_presentes", { p_codigo: p.codigo });
      if (data) { setMarcas((data as { marcas: Record<string, number> }).marcas ?? {}); setPessoas((data as { pessoas: number }).pessoas ?? 0); }
      setAviso(desfazer ? "Tudo bem, desmarcado." : "🎉 Anotado! Agora toque no ＋ do produto para colocar no carrinho.");
    } finally { setOcupado(null); }
  }

  return (
    <>
      <section className="relative mt-3 overflow-hidden rounded-3xl p-6 text-white shadow-lg sm:p-8" style={{ background: `linear-gradient(135deg, ${p.cor}, ${p.cor}bb)` }}>
        <span className="pointer-events-none absolute -right-3 -top-4 select-none text-[7rem] opacity-20" aria-hidden>🎄</span>
        <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">Lista de presentes</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{titulo}</h1>
        {p.nome && <p className="mt-1 text-lg opacity-95">de <b>{p.nome}</b></p>}

        {/* 🎁 Contador */}
        <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <b className="text-lg">🎁 {garantidos} de {total} {total === 1 ? "presente garantido" : "presentes garantidos"}</b>
            <span className="text-sm opacity-90">👥 {pessoas} {pessoas === 1 ? "pessoa já presenteou" : "pessoas já presentearam"}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Presentes garantidos">
            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 [&_button]:border-white/60 [&_button]:bg-white/15 [&_button]:text-white">
          <BotaoCompartilhar titulo={`${titulo}${p.nome ? ` · ${p.nome}` : ""}`} cor="#ffffff" />
          <Link href={`/${p.slug}/favoritos`} className="rounded-full border border-white/60 bg-white/15 px-4 py-2 text-sm font-medium">✨ Criar a minha lista</Link>
        </div>
      </section>

      {/* Como funciona (para quem nunca usou) */}
      <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        {["Escolha um presente da lista", "Toque em “🎁 Vou dar este” — assim ninguém repete", "Toque no ＋ para colocar no carrinho e pedir"].map((t, i) => (
          <li key={t} className="flex items-center gap-2 rounded-xl border bg-white/70 p-3 text-stone-900">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: p.cor }}>{i + 1}</span>{t}
          </li>
        ))}
      </ol>
      {aviso && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">{aviso}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
        {p.produtos.map((x, i) => {
          const n = marcas[x.id] ?? 0, meu = minhas.includes(x.id);
          return (
            <div key={x.id} className="flex flex-col gap-1.5">
              <CardDoProduto produto={x} cor={p.cor} slug={p.slug} indice={i} />
              {n > 0 && !meu && <span className="text-center text-xs font-semibold text-emerald-700">✓ Já garantido{n > 1 ? ` por ${n} pessoas` : ""}</span>}
              <button type="button" disabled={ocupado === x.id} onClick={() => marcar(x.id)}
                className="min-h-11 rounded-full px-3 py-2 text-sm font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                style={meu ? { background: "#059669", color: "#fff" } : { background: "#fff", color: p.cor, border: `2px solid ${p.cor}` }}>
                {ocupado === x.id ? "..." : meu ? "✓ Eu vou dar (desfazer)" : "🎁 Vou dar este"}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
