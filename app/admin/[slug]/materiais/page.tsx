"use client";
// =====================================================================
// PAINEL — MATERIAIS (endereço: /admin/vitraforma/materiais)
// Estoque de filamento (em gramas), embalagens, argolas... Ao imprimir,
// a 🧮 Calculadora 3D "baixa" o peso usado. Abaixo do mínimo = aviso
// e entra na 🛒 Lista de compras.
// =====================================================================
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { corDoNome } from "@/lib/cores";
import { formatarPreco } from "@/lib/formato";

type Material = { id: string; nome: string; cor: string | null; unidade: "g" | "un" | "m"; quantidade: number; minimo: number | null; custo_kg: number | null };
const mostrarQtd = (m: { unidade: string; quantidade: number }) =>
  m.unidade === "g" ? (Math.abs(m.quantidade) >= 1000 ? `${(m.quantidade / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : `${Math.round(m.quantidade)} g`) : `${m.quantidade} ${m.unidade}`;

export default function PainelMateriais() {
  return <AreaAdmin>{() => <Materiais />}</AreaAdmin>;
}

function Materiais() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [lista, setLista] = useState<Material[] | null>(null);
  const [novo, setNovo] = useState({ nome: "", unidade: "g", quantidade: "1000", minimo: "300", custo_kg: "150" });

  const carregar = useCallback(async (l: LojaResumo) => {
    const { data } = await supabaseNavegador().from("materiais").select("*").eq("loja_id", l.id).order("nome");
    setLista((data ?? []) as Material[]);
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); }); }, [slug, carregar]);
  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  async function criar() {
    if (!loja || !novo.nome.trim()) return;
    await supabaseNavegador().from("materiais").insert({
      loja_id: loja.id, nome: novo.nome.trim(), cor: corDoNome(novo.nome) ?? null, unidade: novo.unidade,
      quantidade: Number(novo.quantidade.replace(",", ".")) || 0, minimo: Number(novo.minimo.replace(",", ".")) || null, custo_kg: Number(novo.custo_kg.replace(",", ".")) || null,
    });
    setNovo({ ...novo, nome: "" });
    carregar(loja);
  }
  async function ajustar(m: Material, delta: number) {
    if (!loja) return;
    await supabaseNavegador().from("materiais").update({ quantidade: Math.max(0, Number(m.quantidade) + delta) }).eq("id", m.id);
    carregar(loja);
  }
  async function apagar(m: Material) {
    if (!loja || !confirm(`Apagar "${m.nome}"?`)) return;
    await supabaseNavegador().from("materiais").delete().eq("id", m.id);
    carregar(loja);
  }

  const baixos = (lista ?? []).filter((m) => m.minimo != null && Number(m.quantidade) <= Number(m.minimo));
  const valorEstoque = (lista ?? []).filter((m) => m.unidade === "g" && m.custo_kg).reduce((s, m) => s + (Number(m.quantidade) / 1000) * Number(m.custo_kg), 0);

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      {baixos.length > 0 && <p className="mb-3 rounded-xl bg-orange-50 p-3 text-sm text-orange-900">⚠️ Acabando: <b>{baixos.map((m) => m.nome).join(", ")}</b> — já estão na 🛒 Lista de compras.</p>}
      <Bloco titulo={`🧵 Materiais${valorEstoque ? ` · em estoque ≈ ${formatarPreco(valorEstoque)}` : ""}`}>
        {!lista ? <p className="opacity-60">Carregando...</p> : lista.length === 0 ? <p className="text-sm opacity-60">Cadastre seus filamentos e materiais abaixo.</p> : (
          <ul className="space-y-2">
            {lista.map((m) => {
              const baixo = m.minimo != null && Number(m.quantidade) <= Number(m.minimo);
              const pct = m.minimo ? Math.min(100, (Number(m.quantidade) / (Number(m.minimo) * 3)) * 100) : 100;
              return (
                <li key={m.id} className={`rounded-xl p-3 text-sm ${baixo ? "bg-orange-50" : "bg-stone-50"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-5 w-5 rounded-full border" style={{ background: m.cor ?? "#ccc" }} />
                    <b className="flex-1">{m.nome}</b>
                    <b className={baixo ? "text-orange-700" : ""}>{mostrarQtd(m)}</b>
                    <button type="button" onClick={() => apagar(m)} className="text-red-600" aria-label="Apagar">🗑️</button>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: baixo ? "#ea580c" : cor }} /></div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(m.unidade === "g" ? [-100, -50, 250, 1000] : [-1, 1, 10]).map((d) => (
                      <button key={d} type="button" onClick={() => ajustar(m, d)} className="rounded-full border bg-white px-2 py-0.5 text-xs">
                        {d > 0 ? "+" : "−"}{m.unidade === "g" ? (Math.abs(d) >= 1000 ? `${Math.abs(d) / 1000} kg` : `${Math.abs(d)} g`) : Math.abs(d)}
                      </button>
                    ))}
                    {m.minimo != null && <span className="ml-auto text-xs opacity-60">mínimo {mostrarQtd({ unidade: m.unidade, quantidade: Number(m.minimo) })}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Bloco>
      <Bloco titulo="➕ Novo material">
        <div className="grid gap-2 sm:grid-cols-5">
          <input className="rounded-lg border px-3 py-2 sm:col-span-2" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Ex.: PLA Roxo, PETG Branco, Caixinha P" />
          <select className="rounded-lg border px-2 py-2" value={novo.unidade} onChange={(e) => setNovo({ ...novo, unidade: e.target.value })}>
            <option value="g">gramas</option><option value="un">unidades</option><option value="m">metros</option>
          </select>
          <input className="rounded-lg border px-3 py-2" inputMode="decimal" value={novo.quantidade} onChange={(e) => setNovo({ ...novo, quantidade: e.target.value })} placeholder="Quantidade" />
          <input className="rounded-lg border px-3 py-2" inputMode="decimal" value={novo.minimo} onChange={(e) => setNovo({ ...novo, minimo: e.target.value })} placeholder="Mínimo" />
        </div>
        {novo.unidade === "g" && <label className="text-sm">Custo do kg (R$) <input className="ml-1 w-24 rounded-lg border px-2 py-1" inputMode="decimal" value={novo.custo_kg} onChange={(e) => setNovo({ ...novo, custo_kg: e.target.value })} /></label>}
        <button type="button" onClick={criar} className="w-full rounded-xl p-3 font-semibold text-white" style={{ background: cor }}>Adicionar</button>
        <p className="text-xs opacity-60">Dica: um rolo de 1 kg = 1000 g. Na 🧮 Calculadora, escolha o material e toque em “Baixar do estoque” depois de imprimir.</p>
      </Bloco>
    </>
  );
}
