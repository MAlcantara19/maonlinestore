// =====================================================================
// PÁGINA DE PARCEIROS (endereço: /parceiros)
// Todos os parceiros ativos, em cartões. Cadastro: tabela "parceiros".
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { buscarParceiros } from "@/lib/parceiros";
import CartaoParceiro from "@/components/CartaoParceiro";
import Rodape from "@/components/Rodape";
import { SITE } from "@/lib/config";
import EstilosAnimacao from "@/components/EstilosAnimacao";

export const metadata: Metadata = { title: `Parceiros · ${SITE.nome}` };

export default function PaginaParceiros() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Link href="/" className="text-sm opacity-70">← Todas as lojas</Link>
        <h1 className="mt-2 text-3xl font-bold">🤝 Parceiros</h1>
        <p className="mt-1 mb-6 text-sm opacity-70">Gente e lugares que a gente conhece, confia e indica.</p>
        <Suspense fallback={<p className="text-sm opacity-70">Carregando parceiros...</p>}>
          <Lista />
        </Suspense>
      </main>
      <Rodape />
      <EstilosAnimacao />
    </div>
  );
}

async function Lista() {
  await connection();
  const parceiros = await buscarParceiros();
  if (parceiros.length === 0) return <p className="opacity-70">Nenhum parceiro cadastrado ainda.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {parceiros.map((p, i) => <CartaoParceiro key={p.id} parceiro={p} indice={i} />)}
    </div>
  );
}
