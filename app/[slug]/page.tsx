// =====================================================================
// PÁGINA DE UMA LOJA (endereço: /vitraforma, /gallerie, /chocolate...)
// A pasta se chama [slug] porque o nome entre colchetes é "variável":
// a mesma página serve para TODAS as lojas, e o slug do endereço diz qual.
//
// Ordem da página:
//   1. Banner com busca + menu lateral + painel direito (LayoutDaLoja)
//   2. Ordenação (a busca fica no banner)
//   3. "Como funciona o pedido" fica no painel direito (ou recolhível no celular)
//   4. Coleções em destaque (ex.: Natal) — com efeito festivo, se tiver
//   5. Destaques, categorias (com subcategorias) e coleções antigas
// Tudo vem do banco: não precisa mexer aqui para cadastrar produto.
// =====================================================================
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Categoria, Colecao, Loja, Produto } from "@/lib/tipos";
import { montarMenu } from "@/lib/menu";
import CardDoProduto from "@/components/CardDoProduto";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import ConteudoComBusca from "@/components/ConteudoComBusca";
import EfeitoFestivo from "@/components/EfeitoFestivo";
import { EsqueletoLoja } from "@/components/Esqueleto";

// Next.js entrega o slug do endereço dentro de "params".
type Props = { params: Promise<{ slug: string }> };

// Colunas que a página usa (fica num lugar só para não repetir).
const COLUNAS_LOJA = "id, slug, nome, descricao, cor, logo_url, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, efeito";
const COLUNAS_PRODUTO =
  "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, variacoes(id, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem), midias(id, tipo, url, ordem)";

// Título da aba e prévia quando o link da loja é compartilhado.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: loja } = await supabase.from("lojas").select("nome, descricao, logo_url").eq("slug", slug).maybeSingle();
  if (!loja) return { title: "Loja não encontrada" };
  return {
    title: `${loja.nome} · MA Online Store`,
    description: loja.descricao ?? undefined,
    openGraph: { title: loja.nome, description: loja.descricao ?? undefined, images: loja.logo_url ? [loja.logo_url] : undefined },
  };
}

export default function PaginaDaLoja({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoLoja />}>
      <ConteudoDaLoja params={params} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------
// Busca tudo da loja no banco e monta a página.
// ---------------------------------------------------------------------
async function ConteudoDaLoja({ params }: Props) {
  await connection(); // dados sempre atualizados a cada visita
  const { slug } = await params;

  // 1) A loja pelo slug. Se não existir ou estiver desativada: página 404.
  const { data: loja } = await supabase.from("lojas").select(COLUNAS_LOJA).eq("slug", slug).eq("ativa", true).maybeSingle<Loja>();
  if (!loja) notFound();

  // 2) Categorias, produtos (com variações e mídias) e coleções, ao mesmo tempo.
  const [catRes, prodRes, colRes] = await Promise.all([
    supabase.from("categorias").select("id, nome, descricao, parent_id, ordem").eq("loja_id", loja.id).order("ordem"),
    supabase.from("produtos").select(COLUNAS_PRODUTO).eq("loja_id", loja.id).eq("ativo", true).order("criado_em", { ascending: false }),
    supabase.from("colecoes").select("id, nome, descricao, em_destaque, efeito, produtos_colecoes(produto_id)")
      .eq("loja_id", loja.id).eq("ativa", true).order("ordem"),
  ]);

  const categorias = (catRes.data ?? []) as Categoria[];
  const produtos = (prodRes.data ?? []) as Produto[];
  const colecoes = (colRes.data ?? []) as Colecao[];
  const cor = loja.cor ?? "#333";

  const porIds = (ids: string[]) => produtos.filter((p) => ids.includes(p.id));
  const principais = categorias.filter((c) => !c.parent_id);
  const subsDe = (id: string) => categorias.filter((c) => c.parent_id === id);

  // Atalhos do menu (lateral no computador, barra + gaveta no celular)
  const menu = montarMenu(categorias, colecoes, produtos);

  // Efeito animado: o da primeira coleção em destaque que tiver um (ex.: neve no Natal);
  // se nenhuma tiver, vale o efeito da própria loja.
  const efeitoColecao = colecoes.find((c) => c.em_destaque && c.efeito && c.efeito !== "nenhum")?.efeito;
  const efeito = efeitoColecao ?? (loja.efeito !== "nenhum" ? loja.efeito : undefined);

  return (
    // LayoutDaLoja: banner (com busca), menu lateral e painel direito
    <LayoutDaLoja loja={loja} menu={menu}>
      {efeito && <EfeitoFestivo tipo={efeito} cor={cor} />}

      {produtos.length === 0 ? (
        <p className="mt-8 opacity-70">Nenhum produto cadastrado ainda.</p>
      ) : (
        // Busca/ordenação: enquanto não usa, mostra as seções abaixo normalmente
        <ConteudoComBusca produtos={produtos} slug={slug} cor={cor}>
          {/* Coleções em destaque */}
          {colecoes.filter((c) => c.em_destaque).map((c) => (
            <Secao key={c.id} id={`colecao-${c.id}`} titulo={`✨ ${c.nome}`} descricao={c.descricao} cor={cor} slug={slug}
              produtos={porIds(c.produtos_colecoes.map((pc) => pc.produto_id))} />
          ))}

          {/* Produtos marcados como destaque */}
          <Secao id="destaques" titulo="⭐ Destaques" cor={cor} slug={slug} produtos={produtos.filter((p) => p.destaque)} />

          {/* Uma seção por categoria (com as subcategorias dentro) */}
          {principais.map((cat) => (
            <SecaoCategoria key={cat.id} categoria={cat} subcategorias={subsDe(cat.id)} produtos={produtos} cor={cor} slug={slug} />
          ))}

          {/* Coleções que não estão em destaque (ex.: Dia das Crianças, Santos) */}
          {colecoes.filter((c) => !c.em_destaque).map((c) => (
            <Secao key={c.id} id={`colecao-${c.id}`} titulo={`Coleção ${c.nome}`} descricao={c.descricao} cor={cor} slug={slug}
              produtos={porIds(c.produtos_colecoes.map((pc) => pc.produto_id))} />
          ))}
        </ConteudoComBusca>
      )}
    </LayoutDaLoja>
  );
}

// ---------------------------------------------------------------------
// Grade de cartões (2 colunas no celular, 3 no tablet, 4 no computador).
// ---------------------------------------------------------------------
function Grade({ produtos, cor, slug }: { produtos: Produto[]; cor: string; slug: string }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4">
      {produtos.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
    </div>
  );
}

// ---------------------------------------------------------------------
// Uma seção simples: título + grade. Se não houver produto, some.
// ---------------------------------------------------------------------
function Secao(props: { id: string; titulo: string; descricao?: string | null; cor: string; slug: string; produtos: Produto[] }) {
  if (props.produtos.length === 0) return null;
  return (
    <section id={props.id} className="mt-8 scroll-mt-28">
      <h2 className="text-xl font-bold">{props.titulo}</h2>
      {props.descricao && <p className="text-sm opacity-70">{props.descricao}</p>}
      <Grade produtos={props.produtos} cor={props.cor} slug={props.slug} />
    </section>
  );
}

// ---------------------------------------------------------------------
// Seção de uma CATEGORIA: primeiro os produtos dela mesma, depois um
// bloco para cada subcategoria (com âncora própria para o menu).
// ---------------------------------------------------------------------
function SecaoCategoria({ categoria, subcategorias, produtos, cor, slug }: {
  categoria: Categoria; subcategorias: Categoria[]; produtos: Produto[]; cor: string; slug: string;
}) {
  const diretos = produtos.filter((p) => p.categoria_id === categoria.id);
  const grupos = subcategorias
    .map((sub) => ({ sub, itens: produtos.filter((p) => p.categoria_id === sub.id) }))
    .filter((g) => g.itens.length > 0);
  if (diretos.length === 0 && grupos.length === 0) return null;

  return (
    <section id={`categoria-${categoria.id}`} className="mt-8 scroll-mt-28">
      <h2 className="text-xl font-bold">{categoria.nome}</h2>
      {categoria.descricao && <p className="text-sm opacity-70">{categoria.descricao}</p>}
      {diretos.length > 0 && <Grade produtos={diretos} cor={cor} slug={slug} />}
      {grupos.map(({ sub, itens }) => (
        <div key={sub.id} id={`sub-${sub.id}`} className="mt-6 scroll-mt-28">
          <h3 className="font-semibold" style={{ color: cor }}>{sub.nome}</h3>
          {sub.descricao && <p className="text-xs opacity-70">{sub.descricao}</p>}
          <Grade produtos={itens} cor={cor} slug={slug} />
        </div>
      ))}
    </section>
  );
}
