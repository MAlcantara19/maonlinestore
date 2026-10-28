// =====================================================================
// MEUS PEDIDOS (endereço: /meus-pedidos)
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import Rodape from "@/components/Rodape";
import EstilosAnimacao from "@/components/EstilosAnimacao";
import MeusPedidosTodos from "@/components/MeusPedidosTodos";
import BotaoTema from "@/components/BotaoTema";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: `Meus pedidos · ${SITE.nome}`, robots: { index: false } };

export default function PaginaMeusPedidos() {
  return (
    <div className="flex min-h-screen flex-col">
      <EstilosAnimacao />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm opacity-70">← Todas as lojas</Link>
          <BotaoTema className="rounded-full border px-3 py-1.5" />
        </div>
        <h1 className="mt-4 text-3xl font-bold">🧾 Meus pedidos</h1>
        <MeusPedidosTodos />
      </main>
      <Rodape />
    </div>
  );
}
