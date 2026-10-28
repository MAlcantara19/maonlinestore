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
import { familiaDa } from "@/lib/fontes";
import CarregarFontes from "@/components/CarregarFontes";
import { nomeColecao } from "@/lib/opcoes";
import Avaliacoes from "@/components/Avaliacoes";
import RegistrarVisita from "@/components/RegistrarVisita";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Categoria, Colecao, EfeitoPersonalizado, Loja, Produto } from "@/lib/tipos";
import { montarMenu } from "@/lib/menu";
import { categoriasDoProduto } from "@/lib/opcoes";
import CardDoProduto from "@/components/CardDoProduto";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import ConteudoComBusca from "@/components/ConteudoComBusca";
import EfeitosDaLoja from "@/components/EfeitosDaLoja";
import { EsqueletoLoja } from "@/components/Esqueleto";

// Next.js entrega o slug do endereço dentro de "params".
type Props = { params: Promise<{ slug: string }> };

// Colunas que a página usa (fica num lugar só para não repetir).
const COLUNAS_LOJA = "id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, razao_social, documento, endereco, email_contato, fretes, efeito, efeito_personalizado_id";
const COLUNAS_PRODUTO =
  "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";

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
  const [catRes, prodRes, colRes, efRes, avRes] = await Promise.all([
    supabase.from("categorias").select("id, nome, descricao, parent_id, ordem, efeito_personalizado_id").eq("loja_id", loja.id).order("nome"),
    supabase.from("produtos").select(COLUNAS_PRODUTO).eq("loja_id", loja.id).eq("ativo", true).order("ordem").order("criado_em", { ascending: false }),
    supabase.from("colecoes").select("id, nome, descricao, em_destaque, efeito, efeito_personalizado_id, fonte, produtos_colecoes(produto_id)")
      .eq("loja_id", loja.id).eq("ativa", true).order("ordem"),
    supabase.from("efeitos_personalizados").select("id, nome, imagens, movimento, quantidade, tamanho").eq("loja_id", loja.id),
    supabase.from("avaliacoes").select("id, nome, texto, foto_url, estrelas").eq("loja_id", loja.id).eq("ativo", true).order("criado_em", { ascending: false }).limit(12),
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

  // Efeito animado: o escolhido nas Configurações da loja tem prioridade.
  // Se a loja estiver em "Nenhum", vale o da coleção em destaque (ex.: neve no Natal).
  const efeitoColecao = colecoes.find((c) => c.em_destaque && c.efeito && c.efeito !== "nenhum")?.efeito;
  const efeito = loja.efeito && loja.efeito !== "nenhum" ? loja.efeito : efeitoColecao;

  // Efeitos PERSONALIZADOS (com imagens): o da loja vale para a página toda;
  // os de categoria/subcategoria/coleção ligam quando o cliente chega naquela parte.
  const efeitos = new Map(((efRes.data ?? []) as EfeitoPersonalizado[]).map((e) => [e.id, e]));
  const personalizadoDaLoja = loja.efeito_personalizado_id ? efeitos.get(loja.efeito_personalizado_id) ?? null : null;
  const secoes: Record<string, EfeitoPersonalizado> = {};
  categorias.forEach((c) => {
    const e = c.efeito_personalizado_id && efeitos.get(c.efeito_personalizado_id);
    if (e) secoes[c.parent_id ? `sub-${c.id}` : `categoria-${c.id}`] = e;
  });
  colecoes.forEach((c) => {
    const e = c.efeito_personalizado_id && efeitos.get(c.efeito_personalizado_id);
    if (e) secoes[`colecao-${c.id}`] = e;
  });

  return (
    // LayoutDaLoja: banner (com busca), menu lateral e painel direito
    <LayoutDaLoja loja={loja} menu={menu}>
      <RegistrarVisita slug={slug} />
      {/* Fontes próprias das coleções */}
      <CarregarFontes fontes={colecoes.map((c) => c.fonte)} />
      <EfeitosDaLoja cor={cor} logo={loja.logo_url} tipoPadrao={efeito} personalizadoPadrao={personalizadoDaLoja} secoes={secoes} borda={{ cor: loja.logo_borda_cor, largura: loja.logo_borda }} />

      {produtos.length === 0 ? (
        <p className="mt-8 opacity-70">Nenhum produto cadastrado ainda.</p>
      ) : (
        // Busca/ordenação: enquanto não usa, mostra as seções abaixo normalmente
        <ConteudoComBusca produtos={produtos} slug={slug} cor={cor}>
          {/* ===== ⭐ DESTAQUES: coleções em destaque + produtos em destaque ===== */}
          {(colecoes.some((c) => c.em_destaque) || produtos.some((p) => p.destaque)) && <TituloGrupo icone="⭐" texto="Destaques" cor={cor} />}
          {colecoes.filter((c) => c.em_destaque).map((c) => (
            <Secao key={c.id} id={`colecao-${c.id}`} titulo={`✨ ${nomeColecao(c.nome)}`} descricao={c.descricao} cor={cor} slug={slug}
              fonte={c.fonte} estilo="colecao" produtos={porIds(c.produtos_colecoes.map((pc) => pc.produto_id))} />
          ))}
          <Secao id="destaques" titulo="⭐ Produtos em destaque" cor={cor} slug={slug} estilo="destaque" produtos={produtos.filter((p) => p.destaque)} />

          {/* ===== 🗂️ CATEGORIAS ===== */}
          {principais.length > 0 && <TituloGrupo icone="🗂️" texto="Categorias" cor={cor} />}
          {principais.map((cat) => (
            <SecaoCategoria key={cat.id} categoria={cat} subcategorias={subsDe(cat.id)} produtos={produtos} cor={cor} slug={slug} />
          ))}

          {/* ===== ✨ COLEÇÕES (as que não estão em destaque: Santos, Dia das Crianças...) ===== */}
          {colecoes.some((c) => !c.em_destaque) && <TituloGrupo icone="✨" texto="Coleções" cor={cor} />}
          {colecoes.filter((c) => !c.em_destaque).map((c) => (
            <Secao key={c.id} id={`colecao-${c.id}`} titulo={nomeColecao(c.nome)} descricao={c.descricao} cor={cor} slug={slug}
              fonte={c.fonte} estilo="colecao" produtos={porIds(c.produtos_colecoes.map((pc) => pc.produto_id))} />
          ))}
        </ConteudoComBusca>
      )}

      {/* O que os clientes dizem */}
      <Avaliacoes itens={(avRes.data ?? []) as { id: string; nome: string | null; texto: string; foto_url: string | null; estrelas: number }[]} cor={cor} titulo="💬 O que dizem da gente" />
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
function Secao(props: {
  id: string; titulo: string; descricao?: string | null; cor: string; slug: string; produtos: Produto[];
  fonte?: string | null; // fonte própria (coleções)
  estilo?: "colecao" | "destaque"; // diferença visual: coleção = faixa colorida, destaque = dourado
}) {
  if (props.produtos.length === 0) return null;
  const faixa = props.estilo === "colecao" ? props.cor : props.estilo === "destaque" ? "#f5c542" : null;
  return (
    <section id={props.id} className="mt-8 scroll-mt-28">
      <h2 className="text-xl font-bold" style={{ fontFamily: familiaDa(props.fonte), ...(faixa ? { borderLeft: `5px solid ${faixa}`, paddingLeft: 10 } : {}) }}>{props.titulo}</h2>
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
  // Um produto pode estar em várias categorias: confere a lista toda
  const diretos = produtos.filter((p) => categoriasDoProduto(p).includes(categoria.id));
  const grupos = subcategorias
    .map((sub) => ({ sub, itens: produtos.filter((p) => categoriasDoProduto(p).includes(sub.id)) }))
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

// ---------------------------------------------------------------------
// Título de GRUPO da página (⭐ Destaques · 🗂️ Categorias · ✨ Coleções):
// uma linha com o nome no meio, para separar bem cada parte da loja.
// ---------------------------------------------------------------------
function TituloGrupo({ icone, texto, cor }: { icone: string; texto: string; cor: string }) {
  return (
    <div className="mt-12 flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1" style={{ background: `${cor}55` }} />
      <span className="rounded-full px-4 py-1 text-sm font-bold uppercase tracking-widest text-white shadow" style={{ background: cor }}>{icone} {texto}</span>
      <span className="h-px flex-1" style={{ background: `${cor}55` }} />
    </div>
  );
}
