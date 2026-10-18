// =====================================================================
// MINHA SACOLA (endereço: /sacola) — os carrinhos de todas as lojas
// num lugar só, cada um com o seu botão de finalizar.
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import Rodape from "@/components/Rodape";
import EstilosAnimacao from "@/components/EstilosAnimacao";
import SacolaUnica from "@/components/SacolaUnica";
import BotaoTema from "@/components/BotaoTema";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: `Minha sacola · ${SITE.nome}` };

export default function PaginaSacola() {
  return (
    <div className="flex min-h-screen flex-col">
      <EstilosAnimacao />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm opacity-70">← Todas as lojas</Link>
          <BotaoTema className="rounded-full border px-3 py-1.5" />
        </div>
        <h1 className="mt-4 text-3xl font-bold">🛍️ Minha sacola</h1>
        <SacolaUnica />
      </main>
      <Rodape />
    </div>
  );
}
