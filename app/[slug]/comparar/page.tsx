// =====================================================================
// COMPARAR PRODUTOS (endereço: /vitraforma/comparar)
// =====================================================================
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import LayoutDaLoja from "@/components/LayoutDaLoja";
import TabelaComparar from "@/components/TabelaComparar";

type Props = { params: Promise<{ slug: string }> };

export default function PaginaComparar({ params }: Props) {
  return <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando...</p>}><Conteudo params={params} /></Suspense>;
}

async function Conteudo({ params }: Props) {
  await connection();
  const { slug } = await params;
  const { data: loja } = await supabase.from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram")
    .eq("slug", slug).eq("ativa", true).maybeSingle<Loja>();
  if (!loja) notFound();
  const menu = await buscarMenuDaLoja(loja.id);
  return (
    <LayoutDaLoja loja={loja} menu={menu}>
      <h2 className="mt-4 text-2xl font-bold" style={{ color: loja.cor ?? "#333" }}>⚖️ Comparar produtos</h2>
      <TabelaComparar slug={slug} lojaId={loja.id} cor={loja.cor ?? "#333"} />
    </LayoutDaLoja>
  );
}
