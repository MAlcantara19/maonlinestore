// =====================================================================
// PÁGINA DO PRODUTO (endereço: /vitraforma/p/<id-do-produto>)
// Cada produto tem um link próprio: dá para mandar no Instagram/WhatsApp
// e a pessoa cai direto nele — e o link aparece com FOTO e PREÇO na
// prévia da conversa (generateMetadata, logo abaixo).
// =====================================================================
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja, Produto } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import { formatarPreco, precoMinimo } from "@/lib/formato";
import EscolhaDoProduto from "@/components/EscolhaDoProduto";
import CabecalhoDaLoja from "@/components/CabecalhoDaLoja";
import TemaDaLoja from "@/components/TemaDaLoja";
import Galeria from "@/components/Galeria";
import BotaoCompartilhar from "@/components/BotaoCompartilhar";
import { EsqueletoProduto } from "@/components/Esqueleto";

type Props = { params: Promise<{ slug: string; id: string }> };

const COLUNAS_LOJA = "id, slug, nome, cor, logo_url, descricao, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte";
const COLUNAS_PRODUTO =
  "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, variacoes(id, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem), midias(id, tipo, url, ordem)";

// Busca loja + produto (usado pela prévia do link e pela página).
async function buscar(slug: string, id: string) {
  const { data: loja } = await supabase.from("lojas").select(COLUNAS_LOJA).eq("slug", slug).eq("ativa", true).maybeSingle<Loja>();
  if (!loja) return null;
  const { data: produto } = await supabase.from("produtos").select(COLUNAS_PRODUTO)
    .eq("id", id).eq("loja_id", loja.id).eq("ativo", true).maybeSingle<Produto>();
  if (!produto) return null;
  return { loja, produto };
}

// Prévia do link: título, descrição com preço e a primeira foto.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const dados = await buscar(slug, id);
  if (!dados) return { title: "Produto não encontrado" };
  const { loja, produto } = dados;
  const preco = precoMinimo(produto);
  const foto = produto.midias.filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0];
  const descricao = `${preco != null ? formatarPreco(preco) + " · " : ""}${produto.descricao ?? ""}`.slice(0, 160);
  return {
    title: `${produto.nome} · ${loja.nome}`,
    description: descricao,
    openGraph: { title: `${produto.nome} · ${loja.nome}`, description: descricao, images: foto ? [foto.url] : undefined },
  };
}

export default function PaginaDoProduto({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoProduto />}>
      <ConteudoDoProduto params={params} />
    </Suspense>
  );
}

async function ConteudoDoProduto({ params }: Props) {
  await connection(); // dados sempre atualizados
  const { slug, id } = await params;
  const dados = await buscar(slug, id);
  if (!dados) notFound();
  const { loja, produto } = dados;

  const cor = loja.cor ?? "#333";
  const menu = await buscarMenuDaLoja(loja.id); // atalhos do menu rápido
  const midias = [...produto.midias].sort((a, b) => a.ordem - b.ordem);
  const foto = midias.find((m) => m.tipo === "foto")?.url; // miniatura que "voa" até o carrinho

  return (
    // TemaDaLoja aplica as cores, o fundo e a fonte desta loja (vêm do banco)
    <TemaDaLoja loja={loja}>
      <CabecalhoDaLoja loja={loja} menu={menu} />
      <main className="mx-auto max-w-5xl px-4 pt-4 pb-28">
        {/* Celular: uma coluna. Computador (md): fotos à esquerda, informações à direita */}
        <div className="mt-3 md:grid md:grid-cols-2 md:items-start md:gap-8">
          <Galeria midias={midias} nome={produto.nome} cor={cor} />

          <div>
            <div className="mt-4 flex items-start justify-between gap-3 md:mt-0">
              <div>
                {produto.selo && (
                  <span className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: cor }}>
                    {produto.selo}
                  </span>
                )}
                <h1 className="text-2xl font-bold">{produto.nome}</h1>
              </div>
              <BotaoCompartilhar titulo={`${produto.nome} · ${loja.nome}`} cor={cor} />
            </div>
            {produto.descricao && <p className="mt-2 whitespace-pre-line">{produto.descricao}</p>}

            {/* Restrições/avisos do produto, se houver */}
            {produto.restricoes && (
              <p className="mt-3 whitespace-pre-line rounded-lg p-3 text-sm" style={{ background: `${cor}14` }}>
                ⚠️ {produto.restricoes}
              </p>
            )}

            <EscolhaDoProduto produto={produto} slug={slug} cor={cor} foto={foto} />
          </div>
        </div>
      </main>
    </TemaDaLoja>
  );
}
