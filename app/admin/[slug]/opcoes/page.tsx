"use client";
// =====================================================================
// PAINEL — CORES E TAMANHOS DA LOJA (endereço: /admin/vitraforma/opcoes)
// A lista que aparece no cadastro de produto. Trocou de filamento ou
// chegou produto de cor nova? Acrescente aqui (ou só digite no produto:
// cor/tamanho novo entra nesta lista sozinho ao salvar).
// =====================================================================
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { comMaiuscula, tamanhoComUnidade } from "@/lib/opcoes";

type Opcao = { id: string; tipo: "cor" | "tamanho"; valor: string };

export default function PainelOpcoes() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);

  const carregar = useCallback(async (l: LojaResumo) => {
    const { data } = await supabaseNavegador().from("opcoes_loja").select("id, tipo, valor").eq("loja_id", l.id).order("valor");
    setOpcoes(((data ?? []) as Opcao[]).sort((a, b) => a.valor.localeCompare(b.valor, "pt-BR", { sensitivity: "base", numeric: true })));
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); }); }, [slug, carregar]);
  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  async function adicionar(tipo: Opcao["tipo"], valor: string) {
    if (!valor.trim() || !loja) return;
    const final = tipo === "tamanho" ? tamanhoComUnidade(valor, loja.unidade_tamanho) : comMaiuscula(valor);
    await supabaseNavegador().from("opcoes_loja").upsert({ loja_id: loja.id, tipo, valor: final }, { onConflict: "loja_id,tipo,valor", ignoreDuplicates: true });
    carregar(loja);
  }
  async function remover(o: Opcao) {
    await supabaseNavegador().from("opcoes_loja").delete().eq("id", o.id);
    if (loja) carregar(loja);
  }

  const secao = (tipo: Opcao["tipo"], titulo: string, exemplo: string) => (
    <Bloco titulo={titulo}>
      <div className="flex flex-wrap gap-2">
        {opcoes.filter((o) => o.tipo === tipo).map((o) => (
          <span key={o.id} className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-sm" style={{ borderColor: `${cor}66` }}>
            {o.valor}
            <button type="button" onClick={() => remover(o)} aria-label={`Remover ${o.valor}`} className="ml-1 opacity-50 hover:opacity-100">✕</button>
          </span>
        ))}
        {opcoes.filter((o) => o.tipo === tipo).length === 0 && <p className="text-sm opacity-60">Nenhuma ainda.</p>}
      </div>
      <NovoValor placeholder={exemplo} aoAdicionar={(v) => adicionar(tipo, v)} cor={cor} />
    </Bloco>
  );

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <p className="mb-4 text-sm opacity-70">Remover daqui só tira da lista de sugestões: os produtos que já usam continuam iguais.</p>
      {secao("cor", "🎨 Cores", "Nova cor (ex.: Azul turquesa)")}
      {secao("tamanho", "📏 Tamanhos", loja.unidade_tamanho ? `Novo tamanho (digite só o número: 25 → 25 ${loja.unidade_tamanho})` : "Novo tamanho (ex.: P, M, G)")}
    </>
  );
}

function NovoValor({ placeholder, aoAdicionar, cor }: { placeholder: string; aoAdicionar: (v: string) => void; cor: string }) {
  const [valor, setValor] = useState("");
  const enviar = () => { aoAdicionar(valor); setValor(""); };
  return (
    <div className="flex gap-2">
      <input className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm" placeholder={placeholder} value={valor}
        onChange={(e) => setValor(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()} />
      <button type="button" onClick={enviar} className="rounded-lg px-4 text-sm font-semibold text-white" style={{ background: cor }}>+ Adicionar</button>
    </div>
  );
}
