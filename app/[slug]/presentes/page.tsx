// =====================================================================
// 🎁 PRESENTES ATÉ R$ X (endereço: /vitraforma/presentes?ate=50)
// Página própria para divulgar: "Presentes até R$ 50 🎁" — com os
// botões R$ 30 / 50 / 100 / 200 e o link pronto para compartilhar.
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja, Produto } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import { precoMinimo } from "@/lib/formato";
import { comPromocao } from "@/lib/promocao";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import CardDoProduto from "@/components/CardDoProduto";
import BotaoCompartilhar from "@/components/BotaoCompartilhar";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ate?: string }> };
const FAIXAS = [30, 50, 100, 200];
const faixa = (v?: string) => (FAIXAS.includes(Number(v)) ? Number(v) : 50);

const COLUNAS_LOJA = "id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, razao_social, documento, endereco, email_contato, fretes, frete_cep, cep_origem, desconto_pix, boas_vindas_pct, fidelidade_a_cada, fidelidade_premio_pct, aniversario_pct, indicacao_pct, slides, presente";
const COLUNAS_PRODUTO =
  "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, criado_em, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, previa_cor, personalizacao, tempo_min, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ate = faixa((await searchParams).ate);
  const { data: loja } = await supabase.from("lojas").select("nome, logo_url").eq("slug", slug).maybeSingle();
  if (!loja) return { title: "Loja não encontrada" };
  const titulo = `🎁 Presentes até R$ ${ate} · ${loja.nome}`;
  return { title: titulo, description: `Ideias de presente até R$ ${ate} na ${loja.nome}. Peça pelo WhatsApp!`, openGraph: { title: titulo, images: loja.logo_url ? [loja.logo_url] : undefined } };
}

export default function PaginaPresentes(props: Props) {
  return <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando...</p>}><Conteudo {...props} /></Suspense>;
}

async function Conteudo({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const ate = faixa((await searchParams).ate);
  const { data: loja } = await supabase.from("lojas").select(COLUNAS_LOJA).eq("slug", slug).eq("ativa", true).maybeSingle<Loja>();
  if (!loja) notFound();
  const [menu, { data }] = await Promise.all([
    buscarMenuDaLoja(loja.id),
    supabase.from("produtos").select(COLUNAS_PRODUTO).eq("loja_id", loja.id).eq("ativo", true).neq("disponibilidade", "esgotado").order("ordem"),
  ]);
  const precoFinal = (p: Produto) => { const v = precoMinimo(p); return v == null ? null : comPromocao(v, p); };
  const produtos = ((data ?? []) as Produto[]).filter((p) => { const v = precoFinal(p); return v != null && v <= ate; })
    .sort((a, b) => (precoFinal(a) ?? 0) - (precoFinal(b) ?? 0));
  const cor = loja.cor ?? "#333";

  return (
    <LayoutDaLoja loja={loja} menu={menu}>
      <section className="relative mt-2 overflow-hidden rounded-3xl p-6 text-white shadow-lg sm:p-8" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
        <span className="pointer-events-none absolute -right-3 -top-4 select-none text-[7rem] opacity-20" aria-hidden>🎁</span>
        <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-80">{loja.nome}</p>
        <h1 className="mt-1 text-4xl font-bold">Presentes até R$ {ate}</h1>
        <p className="mt-1 opacity-90">{produtos.length} {produtos.length === 1 ? "ideia" : "ideias"} de presente, do mais em conta ao mais caprichado 💝</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FAIXAS.map((v) => (
            <Link key={v} href={`/${slug}/presentes?ate=${v}`} className="rounded-full border border-white/60 px-4 py-1.5 text-sm font-semibold" style={v === ate ? { background: "#fff", color: cor } : { background: "rgba(255,255,255,.15)" }}>Até R$ {v}</Link>
          ))}
          <span className="[&_button]:border-white/60 [&_button]:bg-white/15 [&_button]:text-white"><BotaoCompartilhar titulo={`🎁 Presentes até R$ ${ate} · ${loja.nome}`} cor="#ffffff" /></span>
        </div>
      </section>
      {produtos.length === 0 ? (
        <p className="mt-8 text-center opacity-70">Nenhum produto até R$ {ate} no momento. Tente uma faixa maior 😉</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4">
          {produtos.map((p, i) => <CardDoProduto key={p.id} produto={p} cor={cor} slug={slug} indice={i} />)}
        </div>
      )}
    </LayoutDaLoja>
  );
}
