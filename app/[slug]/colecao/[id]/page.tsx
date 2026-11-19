// =====================================================================
// ✨ PÁGINA DE UMA COLEÇÃO (endereço: /vitraforma/colecao/ID)
// Só os produtos daquela coleção, com faixa no tema da coleção, botão
// de compartilhar e atalho para o catálogo em PDF/imagens.
// Ótima para mandar no WhatsApp/Instagram: "Veja a Coleção de Natal 🎄"
// (a prévia do link mostra o nome e a foto do primeiro produto).
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Colecao, Loja, Produto } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import { nomeColecao } from "@/lib/opcoes";
import { familiaDa } from "@/lib/fontes";
import { TEMAS, temaPeloNome } from "@/lib/catalogo";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import CardDoProduto from "@/components/CardDoProduto";
import CarregarFontes from "@/components/CarregarFontes";
import BotaoCompartilhar from "@/components/BotaoCompartilhar";
import EfeitosDaLoja from "@/components/EfeitosDaLoja";
import RegistrarVisita from "@/components/RegistrarVisita";
import { EsqueletoLoja } from "@/components/Esqueleto";

type Props = { params: Promise<{ slug: string; id: string }> };

const COLUNAS_LOJA = "id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, razao_social, documento, endereco, email_contato, fretes, frete_cep, cep_origem, desconto_pix, boas_vindas_pct, fidelidade_a_cada, fidelidade_premio_pct, aniversario_pct, indicacao_pct, slides, presente";
const COLUNAS_PRODUTO =
  "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, previa_cor, personalizacao, tempo_min, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";
const ehUuid = (t: string) => /^[0-9a-f-]{36}$/i.test(t);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  if (!ehUuid(id)) return { title: "Coleção não encontrada" };
  const { data } = await supabase.from("colecoes").select("nome, descricao, lojas!inner(nome, slug, logo_url), produtos_colecoes(produtos(midias(url, tipo, ordem)))")
    .eq("id", id).eq("lojas.slug", slug).maybeSingle();
  if (!data) return { title: "Coleção não encontrada" };
  const c = data as unknown as { nome: string; descricao: string | null; lojas: { nome: string; logo_url: string | null }; produtos_colecoes: { produtos: { midias: { url: string; tipo: string; ordem: number }[] } | null }[] };
  const foto = c.produtos_colecoes.flatMap((pc) => (pc.produtos?.midias ?? []).filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)).at(0)?.url ?? c.lojas.logo_url;
  const titulo = `${nomeColecao(c.nome)} · ${c.lojas.nome}`;
  return { title: titulo, description: c.descricao ?? `Conheça a ${nomeColecao(c.nome)} da ${c.lojas.nome}. Peça pelo WhatsApp!`, openGraph: { title: titulo, description: c.descricao ?? undefined, images: foto ? [foto] : undefined } };
}

export default function PaginaColecao({ params }: Props) {
  return <Suspense fallback={<EsqueletoLoja />}><Conteudo params={params} /></Suspense>;
}

async function Conteudo({ params }: Props) {
  await connection();
  const { slug, id } = await params;
  if (!ehUuid(id)) notFound();
  const { data: loja } = await supabase.from("lojas").select(COLUNAS_LOJA).eq("slug", slug).eq("ativa", true).maybeSingle<Loja>();
  if (!loja) notFound();
  const { data: colecao } = await supabase.from("colecoes").select("id, nome, descricao, em_destaque, efeito, fonte, produtos_colecoes(produto_id)")
    .eq("id", id).eq("loja_id", loja.id).eq("ativa", true).maybeSingle<Colecao>();
  if (!colecao) notFound();

  const ids = colecao.produtos_colecoes.map((pc) => pc.produto_id);
  const [prodRes, menu, outrasRes, bannerRes] = await Promise.all([
    ids.length ? supabase.from("produtos").select(COLUNAS_PRODUTO).in("id", ids).eq("ativo", true).order("ordem").order("nome") : Promise.resolve({ data: [] }),
    buscarMenuDaLoja(loja.id),
    supabase.from("colecoes").select("id, nome").eq("loja_id", loja.id).eq("ativa", true).neq("id", id).order("ordem"),
    supabase.from("colecoes").select("banner_url").eq("id", id).maybeSingle(), // atualização 32
  ]);
  const banner = bannerRes.error ? null : (bannerRes.data?.banner_url as string | null) ?? null;
  const produtos = (prodRes.data ?? []) as Produto[];
  const cor = loja.cor ?? "#333";
  // A faixa do topo usa as cores do tema da coleção (Natal = vermelho e dourado...)
  const tema = TEMAS.find((t) => t.id === temaPeloNome(colecao.nome)) ?? null;
  const fundo = tema && tema.id !== "loja" ? `linear-gradient(135deg, ${tema.fundo[0]}, ${tema.fundo[1]})` : `linear-gradient(135deg, ${cor}, ${cor}cc)`;
  const textoFaixa = tema ? tema.texto : "#fff";
  const outras = (outrasRes.data ?? []) as { id: string; nome: string }[];

  return (
    <LayoutDaLoja loja={loja} menu={menu}>
      <RegistrarVisita slug={slug} />
      <CarregarFontes fontes={[colecao.fonte]} />
      {colecao.efeito && colecao.efeito !== "nenhum" && <EfeitosDaLoja cor={cor} logo={loja.logo_url} tipoPadrao={colecao.efeito} personalizadoPadrao={null} secoes={{}} borda={{ cor: loja.logo_borda_cor, largura: loja.logo_borda }} />}

      <Link href={`/${slug}`} className="text-sm opacity-70">← Ver a loja toda</Link>
      <section className="relative mt-2 overflow-hidden rounded-3xl p-6 shadow-lg sm:p-10"
        style={banner ? { background: `linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,.15)), url(${JSON.stringify(banner)}) center/cover`, color: "#fff", minHeight: 260 } : { background: fundo, color: textoFaixa }}>
        <span className="pointer-events-none absolute -right-4 -top-6 select-none text-[8rem] opacity-20" aria-hidden>{tema?.emoji ?? "✨"}</span>
        <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">{loja.nome}</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl" style={{ fontFamily: familiaDa(colecao.fonte) }}>{nomeColecao(colecao.nome)}</h1>
        {colecao.descricao && <p className="mt-2 max-w-xl text-lg opacity-90">{colecao.descricao}</p>}
        <p className="mt-2 text-sm opacity-80">{produtos.length} {produtos.length === 1 ? "produto" : "produtos"} · peça pelo WhatsApp</p>
        <div className="mt-4 flex flex-wrap gap-2 [&_button]:border-white/60 [&_button]:bg-white/15" style={{ color: textoFaixa }}>
          <BotaoCompartilhar titulo={`${nomeColecao(colecao.nome)} · ${loja.nome}`} cor={textoFaixa} />
          <Link href={`/${slug}/catalogo?colecao=${colecao.id}`} className="rounded-full border border-white/60 bg-white/15 px-4 py-2 text-sm font-medium">📄 Catálogo em PDF / imagens</Link>
        </div>
      </section>

      {produtos.length === 0 ? (
        <p className="mt-8 text-center opacity-70">Os produtos desta coleção chegam em breve 😊</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4">
          {produtos.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
        </div>
      )}

      {outras.length > 0 && (
        <section className="mt-10">
          <h2 className="font-bold">Outras coleções</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {outras.map((c) => (
              <Link key={c.id} href={`/${slug}/colecao/${c.id}`} className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: `${cor}66`, color: cor }}>✨ {nomeColecao(c.nome)}</Link>
            ))}
          </div>
        </section>
      )}
    </LayoutDaLoja>
  );
}
