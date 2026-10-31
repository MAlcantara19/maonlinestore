"use client";
// =====================================================================
// MENU DA LOJA NO PAINEL (vertical)
//   - Tela grande: menu lateral fixo à esquerda
//   - Celular/tela menor: botão "☰ Menu da loja" que abre a lista
// A "🧮 Calculadora 3D" só aparece nas lojas com ela ligada (VitraForma).
// =====================================================================
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

const calculadoraLigada = new Map<string, boolean>(); // lembra entre as páginas

export default function AbasLoja({ slug, nome, cor }: { slug: string; nome: string; cor: string }) {
  const caminho = usePathname();
  const base = `/admin/${slug}`;
  const [aberto, setAberto] = useState(false);
  const [calc, setCalc] = useState(calculadoraLigada.get(slug) ?? false);

  useEffect(() => {
    if (calculadoraLigada.has(slug)) return;
    supabaseNavegador().from("lojas").select("calculadora_3d").eq("slug", slug).maybeSingle()
      .then(({ data }: { data: { calculadora_3d?: boolean } | null }) => { calculadoraLigada.set(slug, !!data?.calculadora_3d); setCalc(!!data?.calculadora_3d); }, () => {});
  }, [slug]);

  const grupos = [
    { titulo: "Loja", itens: [
      { href: base, rotulo: "⚙️ Configurações", exato: true },
      { href: `${base}/estatisticas`, rotulo: "📊 Estatísticas" },
      { href: `${base}/pedidos`, rotulo: "🧾 Pedidos" },
    ] },
    { titulo: "Catálogo", itens: [
      { href: `${base}/produtos`, rotulo: "📦 Produtos" },
      { href: `${base}/categorias`, rotulo: "🗂️ Categorias e coleções" },
      { href: `${base}/opcoes`, rotulo: "🎨 Cores e tamanhos" },
      ...(calc ? [{ href: `${base}/calculadora`, rotulo: "🧮 Calculadora 3D" }] : []),
    ] },
    { titulo: "Vendas e visual", itens: [
      { href: `${base}/cupons`, rotulo: "🏷️ Cupons" },
      { href: `${base}/avaliacoes`, rotulo: "💬 Avaliações" },
      { href: `${base}/efeitos`, rotulo: "✨ Efeitos" },
      { href: `${base}/cartao`, rotulo: "📇 Cartão com QR" },
      { href: `${base}/historico`, rotulo: "📜 Histórico" },
    ] },
  ];
  const ativo = (h: string, exato?: boolean) => (exato ? caminho === h : caminho.startsWith(h));
  const atual = grupos.flatMap((g) => g.itens).find((i) => ativo(i.href, "exato" in i ? i.exato : false));

  const lista = (
    <nav className="space-y-3">
      {grupos.map((g) => (
        <div key={g.titulo}>
          <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wide opacity-50">{g.titulo}</p>
          {g.itens.map((i) => {
            const marcado = ativo(i.href, "exato" in i ? i.exato : false);
            return (
              <Link key={i.href} href={i.href} onClick={() => setAberto(false)}
                className="block rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-black/5"
                style={marcado ? { background: cor, color: "white" } : {}}>
                {i.rotulo}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="mb-5">
      <Link href="/admin" className="text-sm opacity-60">← Suas lojas</Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{nome}</h1>
        <Link href={`/${slug}`} target="_blank" className="rounded-full border px-3 py-1.5 text-sm">👁️ Ver loja</Link>
      </div>

      {/* Tela grande: menu lateral fixo */}
      <aside className="fixed left-4 top-24 z-20 hidden max-h-[calc(100vh-7rem)] w-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-lg 2xl:block">
        <p className="truncate px-3 pb-2 pt-1 font-bold" style={{ color: cor }}>{nome}</p>
        {lista}
      </aside>

      {/* Celular e telas menores: botão que abre o menu */}
      <div className="relative mt-3 2xl:hidden">
        <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto}
          className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left font-semibold text-white shadow" style={{ background: cor }}>
          <span>☰</span><span className="flex-1">{atual?.rotulo ?? "Menu da loja"}</span>
          <span className="transition-transform" style={{ transform: aberto ? "rotate(180deg)" : "none" }}>▾</span>
        </button>
        {aberto && (
          <div className="deslizar absolute inset-x-0 top-full z-30 mt-2 rounded-2xl bg-white p-2 shadow-2xl">{lista}</div>
        )}
      </div>
    </div>
  );
}
