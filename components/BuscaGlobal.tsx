"use client";
// =====================================================================
// BUSCA EM TODAS AS LOJAS (página inicial) — digitou "chocolate",
// aparecem as lojas e os produtos de qualquer loja com isso no nome.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco } from "@/lib/formato";

type Achado = { id: string; nome: string; preco: number | null; foto?: string; loja: { slug: string; nome: string; cor: string | null } };
type LojaSimples = { slug: string; nome: string; cor: string | null };

export default function BuscaGlobal({ lojas }: { lojas: LojaSimples[] }) {
  const [texto, setTexto] = useState("");
  const [achados, setAchados] = useState<Achado[] | null>(null);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const termo = texto.trim();
    const t = setTimeout(async () => {
      if (!termo) return setAchados(null);
      const { data } = await supabaseNavegador().from("produtos")
        .select("id, nome, preco, midias(url, tipo, ordem), lojas!inner(slug, nome, cor, ativa, em_breve)")
        .eq("ativo", true).is("excluido_em", null).eq("lojas.ativa", true).eq("lojas.em_breve", false)
        .ilike("nome", `%${termo}%`).limit(8);
      setAchados(((data ?? []) as unknown as { id: string; nome: string; preco: number | null; midias: { url: string; tipo: string; ordem: number }[]; lojas: LojaSimples }[]).map((p) => ({
        id: p.id, nome: p.nome, preco: p.preco, loja: p.lojas,
        foto: [...p.midias].sort((a, b) => a.ordem - b.ordem).find((m) => m.tipo === "foto")?.url,
      })));
    }, 250);
    return () => clearTimeout(t);
  }, [texto]);

  const termo = texto.trim().toLowerCase();
  const lojasAchadas = termo ? lojas.filter((l) => l.nome.toLowerCase().includes(termo)) : [];

  return (
    <div className="relative mx-auto mt-6 max-w-xl text-left">
      <input type="search" value={texto} onChange={(e) => { setTexto(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)} onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="🔍 Buscar em todas as lojas..." className="w-full rounded-full border border-white/30 bg-white/95 px-5 py-3 text-stone-900 shadow-lg outline-none focus:ring-2 focus:ring-white/60" />
      {aberto && termo && (achados || lojasAchadas.length > 0) && (
        <div className="deslizar absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl bg-white text-stone-900 shadow-2xl">
          {lojasAchadas.map((l) => (
            <Link key={l.slug} href={`/${l.slug}`} className="flex items-center gap-2 border-b px-4 py-2 text-sm font-semibold hover:bg-black/5" style={{ color: l.cor ?? "#333" }}>
              🏬 Loja {l.nome}
            </Link>
          ))}
          {achados?.length === 0 && lojasAchadas.length === 0 && <p className="p-4 text-sm opacity-60">Nada encontrado com “{texto.trim()}” 😕</p>}
          {achados?.map((a, i) => (
            <Link key={a.id} href={`/${a.loja.slug}/p/${a.id}`} className="animar-entrada flex items-center gap-3 px-4 py-2 hover:bg-black/5" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-200">{a.foto && <img src={a.foto} alt="" className="h-full w-full object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{a.nome}</span>
                <span className="text-xs font-semibold" style={{ color: a.loja.cor ?? "#333" }}>{a.loja.nome}</span>
              </span>
              <span className="text-sm font-semibold">{a.preco != null ? formatarPreco(Number(a.preco)) : "Consulte"}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
