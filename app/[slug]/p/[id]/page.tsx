// =====================================================================
// PÁGINA DO PRODUTO (endereço: /vitraforma/p/<id-do-produto>)
// Cada produto tem um link próprio: dá para mandar no Instagram/WhatsApp
// e a pessoa cai direto nele.
// Mostra: fotos e vídeos, nome, descrição, restrições e a escolha
// de tamanho/cor (componente EscolhaDoProduto).
// =====================================================================
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja, Produto } from "@/lib/tipos";
import EscolhaDoProduto from "@/components/EscolhaDoProduto";
import BotaoCarrinho from "@/components/BotaoCarrinho";

type Props = { params: Promise<{ slug: string; id: string }> };

export default function PaginaDoProduto({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando produto...</p>}>
      <ConteudoDoProduto params={params} />
    </Suspense>
  );
}

async function ConteudoDoProduto({ params }: Props) {
  await connection(); // dados sempre atualizados
  const { slug, id } = await params;

  // A loja (precisamos da cor e para garantir que o produto é dela).
  const { data: loja } = await supabase
    .from("lojas")
    .select("id, slug, nome, cor, logo_url, descricao")
    .eq("slug", slug)
    .eq("ativa", true)
    .maybeSingle<Loja>();
  if (!loja) notFound();

  // O produto, com variações e mídias. Precisa ser desta loja e estar ativo.
  const { data: produto } = await supabase
    .from("produtos")
    .select(
      "id, nome, descricao, restricoes, preco, disponibilidade, prazo, destaque, categoria_id, variacoes(id, tamanho, cor, preco, disponibilidade, prazo, ativa, ordem), midias(id, tipo, url, ordem)"
    )
    .eq("id", id)
    .eq("loja_id", loja.id)
    .eq("ativo", true)
    .maybeSingle<Produto>();
  if (!produto) notFound();

  const cor = loja.cor ?? "#333";
  const midias = [...produto.midias].sort((a, b) => a.ordem - b.ordem);

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-28">
      <Link href={`/${slug}`} className="text-sm opacity-70">← {loja.nome}</Link>

      {/* Galeria: arraste para o lado para ver as outras fotos/vídeos */}
      <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto">
        {midias.length === 0 && (
          <div className="flex aspect-square w-full shrink-0 items-center justify-center rounded-xl text-sm opacity-80"
            style={{ background: `${cor}22` }}>
            sem foto
          </div>
        )}
        {midias.map((m) =>
          m.tipo === "video" ? (
            // Vídeo curto em loop, sem som, rodando sozinho (ex.: produto girando 360)
            <video key={m.id} src={m.url} autoPlay muted loop playsInline
              className="aspect-square w-full shrink-0 snap-center rounded-xl object-cover" />
          ) : (
            <img key={m.id} src={m.url} alt={produto.nome}
              className="aspect-square w-full shrink-0 snap-center rounded-xl object-cover" />
          )
        )}
      </div>

      <h1 className="mt-4 text-2xl font-bold">{produto.nome}</h1>
      {produto.descricao && <p className="mt-2 whitespace-pre-line">{produto.descricao}</p>}

      {/* Restrições/avisos do produto, se houver */}
      {produto.restricoes && (
        <p className="mt-3 whitespace-pre-line rounded-lg p-3 text-sm" style={{ background: `${cor}14` }}>
          ⚠️ {produto.restricoes}
        </p>
      )}

      <EscolhaDoProduto produto={produto} slug={slug} cor={cor} />
      <BotaoCarrinho slug={slug} cor={cor} />
    </main>
  );
}