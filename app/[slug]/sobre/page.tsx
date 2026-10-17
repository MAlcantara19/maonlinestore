// =====================================================================
// SOBRE A LOJA (endereço: /vitraforma/sobre)
// Texto escrito no painel (Configurações > "Sobre a loja").
// =====================================================================
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja } from "@/lib/tipos";
import { buscarMenuDaLoja } from "@/lib/menu";
import LayoutDaLoja from "@/components/LayoutDaLoja";

type Props = { params: Promise<{ slug: string }> };

export default function PaginaSobre({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando...</p>}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: Props) {
  await connection();
  const { slug } = await params;
  const { data: loja } = await supabase.from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte, instagram, fundo_tipo, fundo_url, fundo_opacidade, fundo_animacao, sobre")
    .eq("slug", slug).eq("ativa", true).maybeSingle<Loja>();
  if (!loja) notFound();
  const menu = await buscarMenuDaLoja(loja.id);

  return (
    <LayoutDaLoja loja={loja} menu={menu}>
      <article className="mx-auto max-w-2xl py-6">
        <h2 className="text-3xl font-bold" style={{ color: loja.cor ?? "#333" }}>Sobre a {loja.nome}</h2>
        {loja.sobre ? (
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{loja.sobre}</p>
        ) : (
          <p className="mt-4 opacity-70">Em breve, a nossa história por aqui 😊</p>
        )}
      </article>
    </LayoutDaLoja>
  );
}
