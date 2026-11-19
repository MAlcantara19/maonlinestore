// =====================================================================
// 🎄 LISTA DE NATAL / DE PRESENTES (endereço: /vitraforma/lista/AB12CD7)
// Criada pelo cliente nos ❤️ Favoritos → "Enviar minha lista".
// Mostra quantos presentes já foram garantidos e quantas pessoas já
// presentearam (precisa da atualização 34 no Supabase).
// =====================================================================
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja, Produto } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import ListaDePresentes from "@/components/ListaDePresentes";

type Props = { params: Promise<{ slug: string; codigo: string }> };
type Dados = { nome: string | null; titulo: string | null; produtos: string[]; slug: string; marcas: Record<string, number> | null; pessoas: number };

const COLUNAS_LOJA = "id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, razao_social, documento, endereco, email_contato, fretes, frete_cep, cep_origem, desconto_pix, boas_vindas_pct, fidelidade_a_cada, fidelidade_premio_pct, aniversario_pct, indicacao_pct, slides, presente";
const COLUNAS_PRODUTO =
  "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, selo, criado_em, categoria_id, ordem, promocao_pct, promocao_ate, giro_360, estoque, previa_cor, personalizacao, tempo_min, variacoes(id, tipo, nome, descricao, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem, estoque), produtos_categorias(categoria_id), midias(id, tipo, url, ordem, cor)";

async function buscarLista(codigo: string) {
  const { data, error } = await supabase.rpc("ver_lista_presentes", { p_codigo: codigo.slice(0, 12) });
  return error || !data ? null : (data as Dados);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, codigo } = await params;
  const [lista, { data: loja }] = await Promise.all([buscarLista(codigo), supabase.from("lojas").select("nome, logo_url").eq("slug", slug).maybeSingle()]);
  if (!lista || !loja) return { title: "Lista não encontrada" };
  const titulo = `🎁 ${lista.titulo || "Lista de presentes"}${lista.nome ? ` · ${lista.nome}` : ""}`;
  return { title: titulo, description: `Escolha um presente na ${loja.nome} 💝`, robots: { index: false }, openGraph: { title: titulo, images: loja.logo_url ? [loja.logo_url] : undefined } };
}

export default function PaginaLista(props: Props) {
  return <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando a lista...</p>}><Conteudo {...props} /></Suspense>;
}

async function Conteudo({ params }: Props) {
  await connection();
  const { slug, codigo } = await params;
  const [{ data: loja }, lista] = await Promise.all([
    supabase.from("lojas").select(COLUNAS_LOJA).eq("slug", slug).eq("ativa", true).maybeSingle<Loja>(),
    buscarLista(codigo),
  ]);
  if (!loja || !lista || lista.slug !== slug) notFound();
  const [menu, { data }] = await Promise.all([
    buscarMenuDaLoja(loja.id),
    supabase.from("produtos").select(COLUNAS_PRODUTO).eq("loja_id", loja.id).eq("ativo", true).in("id", lista.produtos),
  ]);
  const ordem = lista.produtos;
  const produtos = ((data ?? []) as Produto[]).sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));

  return (
    <LayoutDaLoja loja={loja} menu={menu}>
      <ListaDePresentes codigo={codigo.toUpperCase()} slug={slug} cor={loja.cor ?? "#333"} nome={lista.nome} titulo={lista.titulo}
        produtos={produtos} marcas={lista.marcas ?? {}} pessoas={lista.pessoas ?? 0} />
    </LayoutDaLoja>
  );
}
