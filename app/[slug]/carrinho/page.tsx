// =====================================================================
// PÁGINA DO CARRINHO (endereço: /vitraforma/carrinho)
// Busca os dados da loja (nome, cor, WhatsApp, aviso do pedido) e
// entrega para o componente Carrinho, que roda no navegador.
// =====================================================================
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja } from "@/lib/tipos";
import Carrinho from "@/components/Carrinho";

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
  const { slug } = await params;

  const { data: loja } = await supabase
    .from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, whatsapp, aviso_pedido")
    .eq("slug", slug)
    .eq("ativa", true)
    .maybeSingle<Loja>();
  if (!loja) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href={`/${slug}`} className="text-sm opacity-70">← Continuar comprando</Link>
      <h1 className="mt-2 text-2xl font-bold" style={{ color: loja.cor ?? "#333" }}>
        Carrinho · {loja.nome}
      </h1>
      <Carrinho loja={loja} />
    </main>
  );
}