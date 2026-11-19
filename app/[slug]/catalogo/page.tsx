// =====================================================================
// 🎄 CATÁLOGO TEMÁTICO (endereço: /vitraforma/catalogo)
// Monta o catálogo com fundos prontos (Natal, Criança, Páscoa...) por
// coleção ou categoria, e salva em PDF ou em imagens.
// Atalhos no endereço:
//   /vitraforma/catalogo?colecao=ID   → já abre com a coleção escolhida
//   /vitraforma/catalogo?categoria=ID → já abre com a categoria
//   /vitraforma/catalogo?tema=natal   → já abre com o tema
// =====================================================================
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import { precoMinimo } from "@/lib/formato";
import { comPromocao, promocaoAtiva } from "@/lib/promocao";
import { categoriasDoProduto } from "@/lib/opcoes";
import { SITE } from "@/lib/config";
import { FONTES_CATALOGO } from "@/lib/catalogo";
import { ehNovidade } from "@/lib/novidade";
import CarregarFontes from "@/components/CarregarFontes";
import GeradorCatalogo, { type ProdutoCatalogo } from "@/components/GeradorCatalogo";
import type { Produto } from "@/lib/tipos";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };
export const metadata: Metadata = { title: `Catálogo · ${SITE.nome}`, robots: { index: false } };

export default function PaginaCatalogo(props: Props) {
  return <Suspense fallback={<p className="p-8">🎨 Montando o catálogo...</p>}><Catalogo {...props} /></Suspense>;
}

async function Catalogo({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const busca = await searchParams;
  const { data: loja } = await supabase.from("lojas").select("id, slug, nome, cor, logo_url, whatsapp, instagram").eq("slug", slug).eq("ativa", true).maybeSingle();
  if (!loja) notFound();

  const [prodRes, colRes, catRes, prazoRes] = await Promise.all([
    supabase.from("produtos").select("id, nome, preco, disponibilidade, destaque, criado_em, categoria_id, promocao_pct, promocao_ate, previa_cor, variacoes(preco, ativa, cor, tamanho), midias(url, tipo, ordem), produtos_categorias(categoria_id)")
      .eq("loja_id", loja.id).eq("ativo", true).order("ordem").order("nome"),
    supabase.from("colecoes").select("id, nome, descricao, produtos_colecoes(produto_id)").eq("loja_id", loja.id).eq("ativa", true).order("ordem"),
    supabase.from("categorias").select("id, nome, parent_id, ordem").eq("loja_id", loja.id).order("ordem").order("nome"),
    // contagem regressiva da loja (atualização 32; se não rodou, vem erro e só não mostra)
    supabase.from("lojas").select("contagem_ate, contagem_texto").eq("id", loja.id).maybeSingle(),
  ]);
  const prazo = prazoRes.error || !prazoRes.data ? null : { ate: prazoRes.data.contagem_ate as string | null, texto: prazoRes.data.contagem_texto as string | null };

  const colecoes = (colRes.data ?? []) as { id: string; nome: string; descricao: string | null; produtos_colecoes: { produto_id: string }[] }[];
  const produtos: ProdutoCatalogo[] = ((prodRes.data ?? []) as unknown as Produto[]).map((p) => {
    const cheio = precoMinimo(p);
    const emPromo = cheio != null && promocaoAtiva(p);
    return {
      id: p.id, nome: p.nome,
      preco: cheio != null ? comPromocao(cheio, p) : null,
      precoCheio: emPromo ? cheio : null,
      aPartir: p.variacoes.filter((v) => v.ativa && v.preco != null).length > 1,
      promoPct: emPromo ? p.promocao_pct ?? null : null,
      esgotado: p.disponibilidade === "esgotado",
      destaque: !!p.destaque,
      foto: [...p.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0]?.url ?? null,
      categorias: categoriasDoProduto(p),
      colecoes: colecoes.filter((c) => c.produtos_colecoes.some((pc) => pc.produto_id === p.id)).map((c) => c.id),
      // 🎨 quantas cores e 📏 quantos tamanhos o cliente pode escolher
      cores: new Set(p.variacoes.filter((v) => v.ativa && v.cor).map((v) => v.cor!.trim().toLowerCase())).size,
      tamanhos: new Set(p.variacoes.filter((v) => v.ativa && v.tamanho).map((v) => v.tamanho!.trim().toLowerCase())).size,
      escolheCor: !!p.previa_cor,
      novo: ehNovidade(p.criado_em), // 🆕 cadastrado há poucos dias
    };
  });
  // Categorias em ordem de "árvore": a principal e logo abaixo as subcategorias
  const todas = (catRes.data ?? []) as { id: string; nome: string; parent_id: string | null }[];
  const categorias = todas.filter((c) => !c.parent_id).flatMap((c) => [c, ...todas.filter((s) => s.parent_id === c.id)]);

  return (
    <>
      <CarregarFontes fontes={FONTES_CATALOGO} />
      <GeradorCatalogo
        loja={{ nome: loja.nome, slug: loja.slug, cor: loja.cor ?? "#3B1260", logo_url: loja.logo_url, whatsapp: loja.whatsapp, instagram: loja.instagram }}
        produtos={produtos}
        colecoes={colecoes.map(({ id, nome, descricao }) => ({ id, nome, descricao }))}
        categorias={categorias}
        site={SITE.url}
        inicial={{ colecao: busca.colecao, categoria: busca.categoria, tema: busca.tema }}
        prazoLoja={prazo && prazo.ate && new Date(prazo.ate).getTime() > Date.now() ? prazo : null}
      />
    </>
  );
}
