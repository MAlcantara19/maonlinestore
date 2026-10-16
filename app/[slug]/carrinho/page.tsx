// =====================================================================
// PÁGINA DO CARRINHO (endereço: /vitraforma/carrinho)
// Busca os dados da loja (nome, cor, WhatsApp, aviso do pedido) e
// entrega para o componente Carrinho, que roda no navegador.
// =====================================================================
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja } from "@/lib/tipos";
import Carrinho from "@/components/Carrinho";
import CabecalhoDaLoja from "@/components/CabecalhoDaLoja";
import TemaDaLoja from "@/components/TemaDaLoja";
import { buscarMenuDaLoja } from "@/lib/menu";

type Props = { params: Promise<{ slug: string }> };

export default function PaginaDoCarrinho({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando carrinho...</p>}>
      <ConteudoDoCarrinho params={params} />
    </Suspense>
  );
}

async function ConteudoDoCarrinho({ params }: Props) {
  await connection();
  const { slug } = await paqrams;

  const { data: loja } = await supabase
    .from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, whatsapp, aviso_pedido, cor_secundaria, cor_fundo, fonte")
    .eq("slug", slug)
    .eq("ativa", true)
    .maybeSingle<Loja>();
  if (!loja) notFound();
  const menu = await buscarMenuDaLoja(loja.id);

  return (
    // TemaDaLoja aplica as cores, o fundo e a fonte desta loja (vêm do banco)
    <TemaDaLoja loja={loja}>
      <CabecalhoDaLoja loja={loja} menu={menu} />
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="text-2xl font-bold" style={{ color: loja.cor ?? "#333" }}>
        🛒 Seu carrinho
      </h2>
      <Carrinho loja={loja} />
    </main>
    </TemaDaLoja>
  );
}