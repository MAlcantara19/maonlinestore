"use client";
// =====================================================================
// ABAS DA LOJA NO PAINEL
// =====================================================================
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AbasLoja({ slug, nome, cor }: { slug: string; nome: string; cor: string }) {
  const caminho = usePathname();
  const base = `/admin/${slug}`;
  const abas = [
    { href: base, rotulo: "⚙️ Configurações", ativa: caminho === base },
    { href: `${base}/pedidos`, rotulo: "🧾 Pedidos" },
    { href: `${base}/produtos`, rotulo: "📦 Produtos" },
    { href: `${base}/categorias`, rotulo: "🗂️ Categorias e coleções" },
    { href: `${base}/opcoes`, rotulo: "🎨 Cores e tamanhos" },
    { href: `${base}/cupons`, rotulo: "🏷️ Cupons" },
    { href: `${base}/efeitos`, rotulo: "✨ Efeitos" },
    { href: `${base}/historico`, rotulo: "📜 Histórico" },
  ].map((a) => ({ ...a, ativa: a.ativa ?? caminho.startsWith(a.href) }));

  return (
    <div className="mb-5">
      <Link href="/admin" className="text-sm opacity-60">← Suas lojas</Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{nome}</h1>
        <Link href={`/${slug}`} target="_blank" className="rounded-full border px-3 py-1.5 text-sm">👁️ Ver loja</Link>
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {abas.map((a) => (
          <Link key={a.href} href={a.href} className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            style={a.ativa ? { background: cor, color: "white" } : { background: "white" }}>
            {a.rotulo}
          </Link>
        ))}
      </nav>
    </div>
  );
}
