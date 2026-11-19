// =====================================================================
// 💌 CARTÃO DE PRESENTE DIGITAL (endereço: /vitraforma/cartao-presente)
// O cliente monta um cartão com a mensagem dele para mandar junto com
// o presente. Aparece no acompanhamento do pedido e no painel direito.
// =====================================================================
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import { FONTES_CATALOGO } from "@/lib/catalogo";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import CarregarFontes from "@/components/CarregarFontes";
import GeradorCartaoPresente from "@/components/GeradorCartaoPresente";

type Props = { params: Promise<{ slug: string }> };
export const metadata: Metadata = { title: "💌 Cartão de presente digital", description: "Monte um cartão com a sua mensagem e mande junto com o presente." };

const COLUNAS_LOJA = "id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, razao_social, documento, endereco, email_contato, fretes, frete_cep, cep_origem, desconto_pix, boas_vindas_pct, fidelidade_a_cada, fidelidade_premio_pct, aniversario_pct, indicacao_pct, slides, presente";

export default function PaginaCartaoPresente({ params }: Props) {
  return <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando...</p>}><Conteudo params={params} /></Suspense>;
}

async function Conteudo({ params }: Props) {
  await connection();
  const { slug } = await params;
  const { data: loja } = await supabase.from("lojas").select(COLUNAS_LOJA).eq("slug", slug).eq("ativa", true).maybeSingle<Loja>();
  if (!loja) notFound();
  const menu = await buscarMenuDaLoja(loja.id);
  const cor = loja.cor ?? "#333";
  return (
    <LayoutDaLoja loja={loja} menu={menu}>
      <CarregarFontes fontes={FONTES_CATALOGO} />
      <section className="py-4">
        <h1 className="text-3xl font-bold" style={{ color: cor }}>💌 Cartão de presente digital</h1>
        <p className="mb-5 mt-1 opacity-70">Escolha a ocasião, escreva sua mensagem e mande o cartão pelo WhatsApp junto com o presente. É grátis!</p>
        <GeradorCartaoPresente loja={{ nome: loja.nome, slug: loja.slug, cor, logo_url: loja.logo_url }} />
      </section>
    </LayoutDaLoja>
  );
}
