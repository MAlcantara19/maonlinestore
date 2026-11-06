// =====================================================================
// QUEM SOMOS (endereço: /quem-somos) — a história da MA Online Store.
// Texto e foto editáveis em Painel → Página inicial → "Quem somos".
// =====================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { buscarConfigSite, CONFIG_PADRAO } from "@/lib/site";
import { supabase } from "@/lib/supabase";
import Rodape from "@/components/Rodape";
import EstilosAnimacao from "@/components/EstilosAnimacao";
import BotaoTema from "@/components/BotaoTema";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: `Quem somos · ${SITE.nome}` };

export default function QuemSomos() {
  return (
    <div className="flex min-h-screen flex-col">
      <EstilosAnimacao />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm opacity-70">← Todas as lojas</Link>
          <BotaoTema className="rounded-full border px-3 py-1.5" />
        </div>
        <Suspense fallback={<p className="mt-6 opacity-60">Carregando...</p>}><Conteudo /></Suspense>
      </main>
      <Rodape />
    </div>
  );
}

async function Conteudo() {
  await connection();
  const [c, { data: lojas }] = await Promise.all([
    buscarConfigSite().catch(() => CONFIG_PADRAO),
    supabase.from("lojas").select("slug, nome, descricao, logo_url, cor, em_breve").eq("ativa", true).order("ordem"),
  ]);
  const cor = c.cor ?? "#3B1260";
  const texto = c.quem_somos_texto ||
    "A MA Online Store nasceu para reunir, num só lugar, lojas de gente que faz com carinho: impressão 3D, joias e acessórios, doces, aromas e chocolates. Aqui você escolhe, monta o seu pedido e fala direto com quem produz, pelo WhatsApp — sem intermediários e com atendimento de verdade.";
  return (
    <article className="mt-6">
      {c.quem_somos_foto && <img src={c.quem_somos_foto} alt="" className="animar-entrada mb-6 w-full rounded-3xl object-cover shadow-xl" style={{ aspectRatio: "16 / 9" }} />}
      <h1 className="text-4xl font-bold" style={{ color: cor }}>{c.quem_somos_titulo || "Quem somos"}</h1>
      <div className="mt-4 space-y-3 whitespace-pre-line text-lg leading-relaxed">{texto}</div>
      <h2 className="mt-10 text-2xl font-bold">🏬 Nossas lojas</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(lojas ?? []).map((l) => (
          <Link key={l.slug} href={`/${l.slug}`} className="clicavel flex items-center gap-3 rounded-2xl border bg-white/70 p-3">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 bg-white" style={{ borderColor: l.cor ?? "#ddd" }}>{l.logo_url && <img src={l.logo_url} alt="" className="h-full w-full object-cover" />}</span>
            <span><b className="block">{l.nome}</b><span className="text-sm opacity-70">{l.em_breve ? "⏳ Em breve" : l.descricao}</span></span>
          </Link>
        ))}
      </div>
    </article>
  );
}
