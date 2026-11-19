"use client";
// =====================================================================
// 👀 PAINEL — PRODUTOS QUE NINGUÉM VÊ (endereço: /admin/vitraforma/sem-visitas)
//   😴 Ninguém abriu        → destaque, promoção ou tire da loja
//   🤔 Abrem mas não compram → reveja foto, preço ou descrição
// Um toque resolve: ⭐ destacar · 🏷️ 10% por 7 dias · 🙈 esconder.
// (precisa da atualização 34 no Supabase para contar tudo certinho)
// =====================================================================
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { promocaoAtiva } from "@/lib/promocao";

type P = {
  id: string; nome: string; destaque: boolean; ativo: boolean; criado_em: string; promocao_pct: number | null; promocao_ate: string | null;
  midias: { url: string; tipo: string; ordem: number }[];
};
type Visitas = { produto_id: string; vistas: number; carrinho: number };

export default function PainelSemVisitas() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [dias, setDias] = useState(30);
  const [produtos, setProdutos] = useState<P[] | null>(null);
  const [visitas, setVisitas] = useState<Map<string, Visitas>>(new Map());
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => { lojaPeloSlug(slug).then(setLoja); }, [slug]);
  const carregar = useCallback(async (l: LojaResumo, d: number) => {
    const sb = supabaseNavegador();
    setProdutos(null); setErro("");
    const [{ data: ps }, rv] = await Promise.all([
      sb.from("produtos").select("id, nome, destaque, ativo, criado_em, promocao_pct, promocao_ate, midias(url, tipo, ordem)").eq("loja_id", l.id).eq("ativo", true).is("excluido_em", null).order("nome"),
      sb.rpc("visitas_por_produto", { p_loja: l.id, p_dias: d }),
    ]);
    let lista = (rv.data ?? []) as Visitas[];
    if (rv.error) {
      // Sem a atualização 34: conta pelas visitas mais recentes (pode ficar incompleto)
      setErro("Rode a atualização 34 no Supabase para a contagem ficar completa.");
      const desde = new Date(Date.now() - d * 86400_000).toISOString();
      const { data: ev } = await sb.from("eventos").select("produto_id, tipo").eq("loja_id", l.id).in("tipo", ["visita_produto", "carrinho_add"]).gt("criado_em", desde).limit(1000);
      const m = new Map<string, Visitas>();
      ((ev ?? []) as { produto_id: string | null; tipo: string }[]).forEach((e) => {
        if (!e.produto_id) return;
        const v = m.get(e.produto_id) ?? { produto_id: e.produto_id, vistas: 0, carrinho: 0 };
        if (e.tipo === "visita_produto") v.vistas++; else v.carrinho++;
        m.set(e.produto_id, v);
      });
      lista = [...m.values()];
    }
    setVisitas(new Map(lista.map((v) => [v.produto_id, { ...v, vistas: Number(v.vistas), carrinho: Number(v.carrinho) }])));
    setProdutos((ps ?? []) as P[]);
  }, []);
  useEffect(() => { if (loja) carregar(loja, dias); }, [loja, dias, carregar]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(""), 3000); };

  async function mudar(p: P, campos: Partial<P>, msg: string) {
    const { error } = await supabaseNavegador().from("produtos").update(campos).eq("id", p.id);
    if (error) return avisar("❌ Não deu para salvar: " + error.message);
    setProdutos((l) => (l ?? []).map((x) => (x.id === p.id ? { ...x, ...campos } : x)).filter((x) => x.ativo));
    avisar(msg);
  }

  const v = (id: string) => visitas.get(id) ?? { produto_id: id, vistas: 0, carrinho: 0 };
  const recente = (p: P) => Date.now() - new Date(p.criado_em).getTime() < 7 * 86400_000;
  const todos = produtos ?? [];
  const ninguem = todos.filter((p) => v(p.id).vistas === 0).sort((a, b) => Number(recente(a)) - Number(recente(b)));
  const naoCompram = todos.filter((p) => v(p.id).vistas >= 5 && v(p.id).carrinho === 0).sort((a, b) => v(b.id).vistas - v(a.id).vistas);
  const poucas = todos.filter((p) => v(p.id).vistas > 0 && v(p.id).vistas < 5 && v(p.id).carrinho === 0).sort((a, b) => v(a.id).vistas - v(b.id).vistas);

  const linha = (p: P) => {
    const foto = [...p.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0]?.url;
    const x = v(p.id), promo = promocaoAtiva(p);
    return (
      <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">{foto && <img src={foto} alt="" className="h-full w-full object-cover" />}</span>
        <div className="min-w-0 flex-1">
          <b className="block truncate">{p.nome}</b>
          <span className="text-xs opacity-70">
            👀 {x.vistas} {x.vistas === 1 ? "visita" : "visitas"} · 🛒 {x.carrinho} no carrinho
            {recente(p) && " · 🆕 cadastrado há poucos dias"}{p.destaque && " · ⭐ já em destaque"}{promo && ` · 🏷️ em promoção (${p.promocao_pct}%)`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!p.destaque && <button type="button" onClick={() => mudar(p, { destaque: true }, `⭐ “${p.nome}” agora aparece nos destaques`)} className="rounded-full border px-3 py-1.5 text-xs font-semibold">⭐ Destacar</button>}
          {!promo && <button type="button" onClick={() => mudar(p, { promocao_pct: 10, promocao_ate: new Date(Date.now() + 7 * 86400_000).toISOString() }, `🏷️ 10% de desconto em “${p.nome}” por 7 dias`)} className="rounded-full border px-3 py-1.5 text-xs font-semibold">🏷️ 10% por 7 dias</button>}
          <button type="button" onClick={() => { if (confirm(`Esconder “${p.nome}” da loja? Você pode mostrar de novo em Produtos.`)) mudar(p, { ativo: false }, `🙈 “${p.nome}” saiu da loja`); }} className="rounded-full border px-3 py-1.5 text-xs font-semibold">🙈 Esconder</button>
          <Link href={`/admin/${slug}/produtos/${p.id}`} className="rounded-full border px-3 py-1.5 text-xs font-semibold">✏️ Melhorar foto/texto</Link>
        </div>
      </li>
    );
  };

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" onClick={() => setDias(d)} className="rounded-full border px-3 py-1.5 text-sm font-semibold" style={dias === d ? { background: cor, color: "#fff", borderColor: cor } : {}}>Últimos {d} dias</button>
        ))}
        <span className="text-sm opacity-60">{produtos ? `${todos.length} produtos na loja` : "Carregando..."}</span>
      </div>
      {erro && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">⚠️ {erro}</p>}
      {aviso && <p role="status" className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-sm text-white shadow-lg">{aviso}</p>}

      {produtos && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {[["😴", "Ninguém abriu", ninguem.length, "#dc2626"], ["🤔", "Abrem e não compram", naoCompram.length, "#d97706"], ["🌱", "Poucas visitas", poucas.length, "#2563eb"]].map(([i, t, n, c]) => (
            <div key={t as string} className="rounded-2xl bg-white p-4 shadow-sm">
              <span className="text-2xl">{i}</span>
              <b className="block text-3xl" style={{ color: c as string }}>{n}</b>
              <span className="text-sm opacity-70">{t}</span>
            </div>
          ))}
        </div>
      )}

      <Bloco titulo={`😴 Ninguém abriu nos últimos ${dias} dias`}>
        {!produtos ? <p className="text-sm opacity-60">Carregando...</p> : ninguem.length === 0 ? <p className="text-sm opacity-60">🎉 Todos os produtos foram vistos pelo menos uma vez!</p> : (
          <ul className="divide-y text-sm">{ninguem.map(linha)}</ul>
        )}
        <p className="text-xs opacity-60">💡 Dica: ⭐ destacar coloca o produto no topo da loja. Se nem assim vender, vale uma promoção ou tirar da loja.</p>
      </Bloco>

      <Bloco titulo="🤔 Muita gente abre, mas ninguém coloca no carrinho">
        {!produtos ? <p className="text-sm opacity-60">Carregando...</p> : naoCompram.length === 0 ? <p className="text-sm opacity-60">Nada por aqui — ótimo sinal.</p> : (
          <ul className="divide-y text-sm">{naoCompram.map(linha)}</ul>
        )}
        <p className="text-xs opacity-60">💡 Geralmente é a foto, o preço ou falta de informação (tamanho, prazo). Tente uma foto mais clara ou uma promoção curta.</p>
      </Bloco>

      {poucas.length > 0 && (
        <Bloco titulo="🌱 Poucas visitas (menos de 5)">
          <ul className="divide-y text-sm">{poucas.map(linha)}</ul>
        </Bloco>
      )}
    </>
  );
}
