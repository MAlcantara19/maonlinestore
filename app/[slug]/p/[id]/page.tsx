// =====================================================================
// PÁGINA DO PRODUTO (endereço: /vitraforma/p/<id-do-produto>)
// Cada produto tem um link próprio: dá para mandar no Instagram/WhatsApp
// e a pessoa cai direto nele — e o link aparece com FOTO e PREÇO na
// prévia da conversa (generateMetadata, logo abaixo).
// =====================================================================
import GaleriaOu360 from "@/components/GaleriaOu360";
import Avaliacoes from "@/components/Avaliacoes";
import BotaoFavorito from "@/components/BotaoFavorito";
import RegistrarVisita from "@/components/RegistrarVisita";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja, Produto } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import { formatarPreco, precoMinimo } from "@/lib/formato";
import EscolhaDoProduto from "@/components/EscolhaDoProduto";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import Galeria from "@/components/Galeria";
import CardDoProduto from "@/components/CardDoProduto";
import BotaoCompartilhar from "@/components/BotaoCompartilhar";
import { EsqueletoProduto } from "@/components/Esqueleto";

type Props = { params: Promise<{ slug: string; id: string }> };

const COLUNAS_LOJA = "id, slug, nome, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, descricao, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, razao_social, documento, endereco, email_contato, fretes";
const COLUNAS_PRODUTO =
  "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";

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

  // Avaliações: as deste produto primeiro; completa com as da loja
  const { data: avs } = await supabase.from("avaliacoes").select("id, nome, texto, foto_url, estrelas, produto_id")
    .eq("loja_id", loja.id).eq("ativo", true).order("criado_em", { ascending: false }).limit(30);
  const avaliacoes = ((avs ?? []) as { id: string; nome: string | null; texto: string; foto_url: string | null; estrelas: number; produto_id: string | null }[])
    .sort((a, b) => Number(b.produto_id === produto.id) - Number(a.produto_id === produto.id)).slice(0, 10);

  // "Aproveite e leve junto": da mesma categoria; se tiver pouco, completa com destaques da loja
  const { data: mesmaCategoria } = produto.categoria_id
    ? await supabase.from("produtos").select(COLUNAS_PRODUTO).eq("loja_id", loja.id).eq("ativo", true)
        .eq("categoria_id", produto.categoria_id).neq("id", produto.id).limit(4)
    : { data: [] };
  let parecidos = (mesmaCategoria ?? []) as Produto[];
  if (parecidos.length < 4) {
    const { data: outros } = await supabase.from("produtos").select(COLUNAS_PRODUTO).eq("loja_id", loja.id).eq("ativo", true)
      .neq("id", produto.id).order("destaque", { ascending: false }).limit(8);
    const ids = new Set(parecidos.map((p) => p.id));
    parecidos = [...parecidos, ...((outros ?? []) as Produto[]).filter((p) => !ids.has(p.id))].slice(0, 4);
  }

  return (
    // LayoutDaLoja: banner, menu lateral e painel direito (iguais aos da loja)
    <LayoutDaLoja loja={loja} menu={menu}>
      <RegistrarVisita slug={slug} produtoId={produto.id} />
        {/* Celular: uma coluna. Computador (md): fotos à esquerda, informações à direita */}
        <div className="mt-3 md:grid md:grid-cols-2 md:items-start md:gap-6">
          {produto.giro_360 && midias.filter((m) => m.tipo === "foto").length >= 4
            ? <GaleriaOu360 midias={midias} nome={produto.nome} cor={cor} produtoId={produto.id} />
            : <Galeria midias={midias} nome={produto.nome} cor={cor} produtoId={produto.id} />}

          <div>
            <div className="mt-4 flex items-start justify-between gap-3 md:mt-0">
              <div>
                {produto.selo && (
                  <span className="brilho-texto mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: cor }}>
                    {produto.selo}
                  </span>
                )}
                <h1 className="text-2xl font-bold">{produto.nome}</h1>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <BotaoCompartilhar titulo={`${produto.nome} · ${loja.nome}`} cor={cor} />
                <BotaoFavorito slug={slug} produtoId={produto.id} comTexto className="rounded-full border px-4 py-2" />
              </div>
            </div>
            {produto.descricao && <p className="mt-2 whitespace-pre-line">{produto.descricao}</p>}

            {/* "Importante saber": avisos do produto (cores, prazos, cuidados) */}
            {produto.restricoes && (
              <div className="mt-3 rounded-xl border-l-4 p-3 text-sm" style={{ borderColor: cor, background: `${cor}12` }}>
                <b className="mb-0.5 block" style={{ color: cor }}>📌 Importante saber</b>
                <p className="whitespace-pre-line">{produto.restricoes}</p>
              </div>
            )}

            <EscolhaDoProduto produto={produto} slug={slug} cor={cor} foto={foto} sincronizarUrl whatsapp={loja.whatsapp} />
          </div>
        </div>
        <Avaliacoes itens={avaliacoes} cor={cor} />

        {/* Aproveite e leve junto */}
        {parecidos.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold">🧩 Aproveite e leve junto</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {parecidos.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
            </div>
          </section>
        )}
    </LayoutDaLoja>
  );
}
