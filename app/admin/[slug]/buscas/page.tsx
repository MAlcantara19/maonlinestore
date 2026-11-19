"use client";
// =====================================================================
// 🔎 PAINEL — O QUE OS CLIENTES BUSCAM (endereço: /admin/vitraforma/buscas)
//   😕 Buscaram e NÃO acharam → ideias de produto para criar
//   🔥 Mais buscados          → o que está em alta (vale destacar)
// Só guarda a palavra buscada (ninguém é identificado).
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";

type Busca = { termo: string; resultados: number | null; criado_em: string };
type Linha = { termo: string; vezes: number; semResultado: number; ultima: string };

export default function PainelBuscas() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [dias, setDias] = useState(30);
  const [buscas, setBuscas] = useState<Busca[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => { lojaPeloSlug(slug).then(setLoja); }, [slug]);
  useEffect(() => {
    if (!loja) return;
    setBuscas(null);
    const desde = new Date(Date.now() - dias * 86400_000).toISOString();
    supabaseNavegador().from("buscas").select("termo, resultados, criado_em").eq("loja_id", loja.id).gt("criado_em", desde).order("criado_em", { ascending: false }).limit(5000)
      .then(({ data, error }: { data: Busca[] | null; error: { message: string } | null }) => {
        if (error) setErro(error.message.includes("resultados") ? "Rode a atualização 33 no Supabase." : "Rode as atualizações 32 e 33 no Supabase.");
        setBuscas(data ?? []);
      });
  }, [loja, dias]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  // Agrupa por termo
  const mapa = new Map<string, Linha>();
  (buscas ?? []).forEach((b) => {
    const l = mapa.get(b.termo) ?? { termo: b.termo, vezes: 0, semResultado: 0, ultima: b.criado_em };
    l.vezes++; if (b.resultados === 0) l.semResultado++;
    if (b.criado_em > l.ultima) l.ultima = b.criado_em;
    mapa.set(b.termo, l);
  });
  const linhas = [...mapa.values()];
  const naoAcharam = linhas.filter((l) => l.semResultado > 0).sort((a, b) => b.semResultado - a.semResultado).slice(0, 40);
  const top = [...linhas].sort((a, b) => b.vezes - a.vezes).slice(0, 30);
  const data = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const maximo = Math.max(1, ...top.map((l) => l.vezes));

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" onClick={() => setDias(d)} className="rounded-full border px-3 py-1.5 text-sm font-semibold" style={dias === d ? { background: cor, color: "#fff", borderColor: cor } : {}}>Últimos {d} dias</button>
        ))}
        <span className="text-sm opacity-60">{buscas ? `${buscas.length} buscas` : "Carregando..."}</span>
      </div>
      {erro && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">⚠️ {erro}</p>}

      <Bloco titulo="😕 Buscaram e não acharam (ideias de produto!)">
        {naoAcharam.length === 0 ? <p className="text-sm opacity-60">Nada por aqui ainda — ótimo sinal (ou ainda tem poucas buscas).</p> : (
          <ul className="divide-y text-sm">
            {naoAcharam.map((l) => (
              <li key={l.termo} className="flex items-center gap-3 py-2">
                <b className="flex-1">“{l.termo}”</b>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{l.semResultado}x sem resultado</span>
                <span className="w-14 text-right text-xs opacity-60">{data(l.ultima)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs opacity-60">💡 Se muita gente busca algo que você não tem: crie o produto, ou cadastre um sinônimo em Configurações (ex.: “xícara = caneca”).</p>
      </Bloco>

      <Bloco titulo="🔥 Mais buscados">
        {top.length === 0 ? <p className="text-sm opacity-60">Ainda sem buscas neste período.</p> : (
          <ul className="space-y-1.5 text-sm">
            {top.map((l) => (
              <li key={l.termo} className="flex items-center gap-2">
                <span className="w-36 shrink-0 truncate font-semibold">{l.termo}</span>
                <span className="h-4 rounded-full" style={{ width: `${(l.vezes / maximo) * 100}%`, minWidth: 6, background: cor, opacity: 0.8 }} />
                <span className="shrink-0 text-xs opacity-70">{l.vezes}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </>
  );
}
