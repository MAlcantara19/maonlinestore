// =====================================================================
// PÁGINA DO CARRINHO (endereço: /vitraforma/carrinho)
// Busca os dados da loja (nome, cor, WhatsApp, aviso do pedido) e
// entrega para o componente Carrinho, que roda no navegador.
// =====================================================================
import ImagemLogo from "@/components/ImagemLogo";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja } from "@/lib/tipos";
import Carrinho from "@/components/Carrinho";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import { buscarMenuDaLoja } from "@/lib/menu";
import { EsqueletoProduto } from "@/components/Esqueleto";

type Props = { params: Promise<{ slug: string }> };

export default function PaginaDoCarrinho({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoProduto />}>
      <ConteudoDoCarrinho params={params} />
    </Suspense>
  );
}

async function ConteudoDoCarrinho({ params }: Props) {
  await connection();
  const { slug } = await params;

  const { data: loja } = await supabase
    .from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, fundo_cor, logo_borda_cor, logo_borda, banner_url, banner_escurecer, razao_social, documento, endereco, email_contato")
    .eq("slug", slug)
    .eq("ativa", true)
    .maybeSingle<Loja>();
  if (!loja) notFound();
  const menu = await buscarMenuDaLoja(loja.id);

  return (
    // LayoutDaLoja: banner, menu lateral e painel direito (iguais aos da loja)
    <LayoutDaLoja loja={loja} menu={menu}>
      <div className="mx-auto max-w-2xl">
        <h2 className="mt-4 flex items-center gap-3 text-2xl font-bold" style={{ color: loja.cor ?? "#333" }}>
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 bg-white text-lg" style={{ borderColor: loja.cor ?? "#333" }}>
            {loja.logo_url ? <ImagemLogo src={loja.logo_url} ajuste={loja.logo_ajuste} zoom={loja.logo_zoom} fundo={loja.logo_fundo} /> : loja.nome.charAt(0)}
          </span>
          🛒 Seu carrinho
        </h2>
        <Carrinho loja={loja} />
      </div>
    </LayoutDaLoja>
  );
}
