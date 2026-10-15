// =====================================================================
// PÁGINA INICIAL (endereço: /)
// Mostra um círculo para cada loja ATIVA, na ordem definida no banco.
// Tudo vem da tabela "lojas": para mudar nome, descrição, cor ou ordem,
// mude no Supabase (Table Editor > lojas) — não precisa mexer aqui.
// =====================================================================
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Loja } from "@/lib/tipos";

export default function PaginaInicial() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      {/* Cabeçalho do site */}
      <h1 className="text-3xl font-bold">MA Online Store</h1>
      <p className="mt-1 mb-6 text-sm opacity-70">
        Escolha uma loja para ver o catálogo
      </p>

      {/* Suspense: mostra "Carregando..." enquanto busca as lojas no banco */}
      <Suspense fallback={<p className="text-sm opacity-70">Carregando lojas...</p>}>
        <ListaDeLojas />
      </Suspense>
    </main>
  );
}

// ---------------------------------------------------------------------
// Busca as lojas no banco e desenha os círculos.
// ---------------------------------------------------------------------
async function ListaDeLojas() {
  // Avisa o Next.js: esta parte busca dados NOVOS a cada visita (sem guardar cópia antiga).
  // Assim, o que você muda no Supabase aparece no site ao atualizar a página.
  await connection();

  const { data: lojas, error } = await supabase
    .from("lojas") // tabela
    .select("id, slug, nome, descricao, cor, logo_url") // colunas que a página usa
    .eq("ativa", true) // só lojas ativas
    .order("ordem"); // ordem dos círculos

  // Se o banco responder com erro, mostra a mensagem (ajuda a descobrir o problema).
  if (error) {
    return <p className="text-red-600">Erro ao carregar as lojas: {error.message}</p>;
  }

  if (!lojas || lojas.length === 0) {
    return <p>Nenhuma loja cadastrada ainda.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6">
      {(lojas as Loja[]).map((loja) => (
        // Cada círculo é um link para a página da loja: /vitraforma, /gallerie...
        <Link key={loja.id} href={`/${loja.slug}`} className="text-center">
          {/* O círculo: com logo, se tiver; senão, a primeira letra do nome */}
          <div
            className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white text-3xl font-bold"
            style={{ borderColor: loja.cor ?? "#999", color: loja.cor ?? "#333" }}
          >
            {loja.logo_url ? (
              <img src={loja.logo_url} alt={loja.nome} className="h-full w-full object-cover" />
            ) : (
              loja.nome.charAt(0)
            )}
          </div>

          {/* Nome e descrição curta embaixo do círculo */}
          <b className="mt-2 block">{loja.nome}</b>
          <span className="block text-xs opacity-70">{loja.descricao}</span>
        </Link>
      ))}
    </div>
  );
}