"use client";
// =====================================================================
// 🤖 PAINEL — ASSISTENTE DE IA (endereço: /admin/vitraforma/assistente)
//   📝 Descrição de produto  (escolhe o produto e já salva nele)
//   📸 Legenda para Instagram
//   💬 Resposta para cliente (cola a mensagem do WhatsApp)
//   💡 Nomes para produto/coleção
//   🗨️ Pergunta livre (ideias de promoção, texto do Natal...)
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco, Campo, estiloInput } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { pedirIA, type TipoIA } from "@/lib/ia";

type ProdutoSimples = { id: string; nome: string; descricao: string | null; restricoes: string | null; preco: number | null };

const MODOS: { id: TipoIA; rotulo: string; ajuda: string }[] = [
  { id: "descricao", rotulo: "📝 Descrição", ajuda: "Escolha um produto: a IA escreve a descrição e você salva com um toque." },
  { id: "legenda", rotulo: "📸 Legenda Instagram", ajuda: "Legenda com chamada e hashtags para o post do produto ou da coleção." },
  { id: "resposta", rotulo: "💬 Responder cliente", ajuda: "Cole a mensagem do cliente e diga o que quer responder." },
  { id: "nomes", rotulo: "💡 Nomes", ajuda: "Ideias de nomes para um produto, kit ou coleção." },
  { id: "livre", rotulo: "🗨️ Pergunta livre", ajuda: "Peça o que quiser: ideias de promoção de Natal, texto para o Status, aviso de prazo..." },
];

const EXEMPLOS_LIVRE = [
  "Me dê 5 ideias de promoção de Natal para a loja",
  "Escreva um aviso simpático de que os pedidos de Natal fecham dia 15/12",
  "Crie 3 textos curtos para o Status do WhatsApp divulgando a coleção de Natal",
  "Como posso aumentar as vendas em dezembro?",
];

export default function PainelAssistente() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<{ id: string; nome: string; cor: string | null } | null>(null);
  const [produtos, setProdutos] = useState<ProdutoSimples[]>([]);
  const [modo, setModo] = useState<TipoIA>("descricao");
  const [produtoId, setProdutoId] = useState("");
  const [nome, setNome] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const sb = supabaseNavegador();
    sb.from("lojas").select("id, nome, cor").eq("slug", slug).maybeSingle().then(({ data }: { data: { id: string; nome: string; cor: string | null } | null }) => {
      setLoja(data);
      if (data) sb.from("produtos").select("id, nome, descricao, restricoes, preco").eq("loja_id", data.id).is("excluido_em", null).order("nome")
        .then(({ data: p }: { data: ProdutoSimples[] | null }) => setProdutos(p ?? []));
    });
  }, [slug]);

  const produto = produtos.find((p) => p.id === produtoId);
  useEffect(() => { if (produto) setNome(produto.nome); }, [produto]);

  async function gerar() {
    setCarregando(true); setAviso(""); setResposta("");
    try {
      const entrada: Record<string, string> = { nome, detalhes, mensagem };
      if (modo === "descricao" && produto) entrada.atual = produto.descricao ?? "";
      if (produto && produto.restricoes) entrada.detalhes = `${detalhes} ${produto.restricoes}`.trim();
      setResposta(await pedirIA(slug, modo, entrada));
    } catch (e) { setAviso(`😕 ${(e as Error).message}`); }
    setCarregando(false);
  }

  async function salvarNoProduto() {
    if (!produto) return;
    const { error } = await supabaseNavegador().from("produtos").update({ descricao: resposta }).eq("id", produto.id);
    if (error) return setAviso(`😕 ${error.message}`);
    setProdutos((l) => l.map((p) => (p.id === produto.id ? { ...p, descricao: resposta } : p)));
    setAviso("✅ Descrição salva no produto!");
  }

  if (!loja) return <p className="p-4 opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#3B1260";
  const info = MODOS.find((m) => m.id === modo)!;
  const podeGerar = modo === "resposta" ? !!mensagem.trim() : modo === "livre" ? !!detalhes.trim() : !!(nome.trim() || detalhes.trim());

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <Bloco titulo="🤖 Assistente de IA">
        <div className="flex flex-wrap gap-2">
          {MODOS.map((m) => (
            <button key={m.id} type="button" onClick={() => { setModo(m.id); setResposta(""); setAviso(""); }}
              className="rounded-full border px-3 py-1.5 text-sm font-semibold" style={modo === m.id ? { background: cor, color: "#fff", borderColor: cor } : {}}>
              {m.rotulo}
            </button>
          ))}
        </div>
        <p className="text-sm opacity-70">{info.ajuda}</p>

        {(modo === "descricao" || modo === "legenda") && (
          <Campo rotulo="Produto">
            <select className={estiloInput} value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
              <option value="">{modo === "legenda" ? "— Nenhum (escrever sobre um tema/coleção) —" : "— Escolha —"}</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </Campo>
        )}
        {modo !== "resposta" && modo !== "livre" && (
          <Campo rotulo={modo === "nomes" ? "Para o quê? (ex.: kit de velas de Natal com 3 aromas)" : "Nome / tema"}>
            <input className={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder={modo === "legenda" ? "ex.: Coleção de Natal" : ""} />
          </Campo>
        )}
        {modo === "resposta" && (
          <Campo rotulo="Mensagem do cliente">
            <textarea rows={4} className={estiloInput} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Cole aqui o que o cliente mandou no WhatsApp" />
          </Campo>
        )}
        <Campo rotulo={modo === "livre" ? "O que você precisa?" : modo === "resposta" ? "O que você quer responder? (opcional)" : "Detalhes que ajudam (material, tamanho, cores, para quem é...)"}>
          <textarea rows={3} className={estiloInput} value={detalhes} onChange={(e) => setDetalhes(e.target.value)} />
        </Campo>
        {modo === "livre" && (
          <div className="flex flex-wrap gap-1.5">
            {EXEMPLOS_LIVRE.map((e) => <button key={e} type="button" onClick={() => setDetalhes(e)} className="rounded-full bg-stone-100 px-3 py-1 text-xs">{e}</button>)}
          </div>
        )}

        <button type="button" onClick={gerar} disabled={carregando || !podeGerar} className="w-full rounded-xl p-3 font-semibold text-white disabled:opacity-50" style={{ background: cor }}>
          {carregando ? "✨ Pensando..." : resposta ? "🔄 Gerar outra versão" : "✨ Gerar"}
        </button>
        {aviso && <p className="text-sm">{aviso}</p>}

        {resposta && (
          <div className="rounded-xl border-2 p-4" style={{ borderColor: `${cor}55` }}>
            <textarea rows={Math.min(16, resposta.split("\n").length + 3)} className={`${estiloInput} whitespace-pre-line`} value={resposta} onChange={(e) => setResposta(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => { navigator.clipboard.writeText(resposta).catch(() => {}); setAviso("📋 Copiado!"); }} className="rounded-full border px-4 py-2 text-sm font-semibold">📋 Copiar</button>
              {modo === "descricao" && produto && <button type="button" onClick={salvarNoProduto} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: cor }}>💾 Salvar no produto</button>}
              {modo === "resposta" && <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(resposta)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">📲 Abrir no WhatsApp</a>}
            </div>
          </div>
        )}
        <p className="text-xs opacity-50">A IA pode errar: confira preços, prazos e medidas antes de publicar. Limite de 40 pedidos por hora.</p>
      </Bloco>
    </>
  );
}
