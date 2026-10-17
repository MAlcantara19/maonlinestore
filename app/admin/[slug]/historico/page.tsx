"use client";
// =====================================================================
// PAINEL — HISTÓRICO (endereço: /admin/vitraforma/historico)
// O "diário" da loja: quem criou, alterou, mandou para a lixeira ou
// apagou o quê, e quando. Preenchido sozinho pelo banco.
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";

type Registro = { id: number; tabela: string; acao: string; nome: string | null; email: string | null; quando: string };

const TIPO: Record<string, string> = {
  produtos: "📦 produto", categorias: "🗂️ categoria", colecoes: "✨ coleção", cupons: "🏷️ cupom", lojas: "⚙️ configurações da loja",
};
const COR_ACAO: Record<string, string> = { criou: "#16a34a", alterou: "#2563eb", apagou: "#dc2626", "mandou para a lixeira": "#d97706", restaurou: "#7c3aed" };

export default function PainelHistorico() {
  return <AreaAdmin>{() => <Lista />}</AreaAdmin>;
}

function Lista() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    lojaPeloSlug(slug).then(async (l) => {
      setLoja(l);
      if (!l) return;
      const { data } = await supabaseNavegador().from("historico").select("id, tabela, acao, nome, email, quando")
        .eq("loja_id", l.id).order("quando", { ascending: false }).limit(300);
      setRegistros((data ?? []) as Registro[]);
    });
  }, [slug]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const lista = (registros ?? []).filter((r) => `${r.nome} ${r.email} ${r.acao}`.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={loja.cor ?? "#333"} />
      <input type="search" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="🔍 Filtrar por nome, e-mail ou ação..."
        className="mb-4 w-full rounded-xl border bg-white px-4 py-2.5 text-sm" />
      {!registros ? <p className="opacity-60">Carregando...</p> : lista.length === 0 ? <p className="opacity-70">Nada registrado ainda.</p> : (
        <ol className="space-y-2">
          {lista.map((r) => (
            <li key={r.id} className="flex flex-wrap items-baseline gap-x-2 rounded-xl bg-white p-3 text-sm shadow-sm">
              <span className="font-mono text-xs opacity-60">{new Date(r.quando).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
              <b>{r.email ?? "sistema"}</b>
              <span className="font-semibold" style={{ color: COR_ACAO[r.acao] ?? "#333" }}>{r.acao}</span>
              <span>{TIPO[r.tabela] ?? r.tabela}</span>
              {r.nome && <b>“{r.nome}”</b>}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
