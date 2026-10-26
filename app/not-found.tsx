// =====================================================================
// PÁGINA "NÃO ENCONTRADA" (404) — quando o endereço não existe
// (produto apagado, link digitado errado...). Bonita e com saída.
// =====================================================================
import Link from "next/link";
import EstilosAnimacao from "@/components/EstilosAnimacao";

export default function NaoEncontrada() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <EstilosAnimacao />
      <p className="flutuar text-7xl">🔎</p>
      <h1 className="mt-4 text-3xl font-bold">Ops! Não achamos esta página</h1>
      <p className="mt-2 max-w-md opacity-70">O produto pode ter saído do catálogo ou o link foi digitado errado. Mas tem muita coisa legal esperando por você!</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="clicavel rounded-full bg-[#3B1260] px-6 py-3 font-semibold text-white shadow-lg">🏬 Ver todas as lojas</Link>
        <Link href="/sacola" className="clicavel rounded-full border px-6 py-3 font-semibold">🛍️ Minha sacola</Link>
      </div>
    </div>
  );
}
