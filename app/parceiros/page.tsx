// =====================================================================
// PÁGINA DE PARCEIROS (endereço: /parceiros)
// Título, subtítulo, fundo (foto, logo repetida ou vídeo) e efeito são
// escolhidos no painel: Página inicial → "🤝 Página de parceiros".
// =====================================================================
import BotaoSacola from "@/components/BotaoSacola";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { buscarParceiros } from "@/lib/parceiros";
import { buscarConfigSite, CONFIG_PADRAO } from "@/lib/site";
import CartaoParceiro from "@/components/CartaoParceiro";
import Rodape from "@/components/Rodape";
import EstilosAnimacao from "@/components/EstilosAnimacao";
import FundoDaPagina from "@/components/FundoDaPagina";
import EfeitoFestivo from "@/components/EfeitoFestivo";
import BotaoTema from "@/components/BotaoTema";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: `Parceiros · ${SITE.nome}` };

export default function PaginaParceiros() {
  return (
    <div className="flex min-h-screen flex-col">
      <EstilosAnimacao />
      <BotaoSacola />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm opacity-70">← Todas as lojas</Link>
          <BotaoTema className="rounded-full border px-3 py-1.5" />
        </div>
        <Suspense fallback={<p className="mt-6 text-sm opacity-70">Carregando parceiros...</p>}>
          <Conteudo />
        </Suspense>
      </main>
      <Rodape />
    </div>
  );
}

async function Conteudo() {
  await connection();
  const [c, parceiros] = await Promise.all([buscarConfigSite().catch(() => CONFIG_PADRAO), buscarParceiros()]);
  const cor = c.cor ?? "#3B1260";
  return (
    <>
      {/* Fundo e efeito escolhidos no painel */}
      <FundoDaPagina tipo={c.parceiros_fundo_tipo} url={c.parceiros_fundo_url} logo={c.logo_url} opacidade={c.parceiros_fundo_opacidade} animacao={c.parceiros_fundo_animacao}
        corMosaico={c.parceiros_fundo_cor} borda={{ cor: c.logo_borda_cor, largura: c.logo_borda }} />
      {c.parceiros_efeito && c.parceiros_efeito !== "nenhum" && <EfeitoFestivo tipo={c.parceiros_efeito} cor={cor} logo={c.logo_url} borda={{ cor: c.logo_borda_cor, largura: c.logo_borda }} />}

      <div className="mt-4 flex items-center gap-4">
        {c.logo_url && (
          <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white shadow" style={{ border: `${c.logo_borda ?? 3}px solid ${c.logo_borda_cor ?? cor}` }}>
            <img src={c.logo_url} alt="" className="h-full w-full object-cover" />
          </span>
        )}
        <div>
          <h1 className="text-3xl font-bold">{c.parceiros_titulo || "🤝 Parceiros"}</h1>
          {c.parceiros_subtitulo && <p className="mt-1 text-sm opacity-70">{c.parceiros_subtitulo}</p>}
        </div>
      </div>

      {parceiros.length === 0 ? (
        <p className="mt-6 opacity-70">Nenhum parceiro cadastrado ainda.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parceiros.map((p, i) => <CartaoParceiro key={p.id} parceiro={p} indice={i} />)}
        </div>
      )}
    </>
  );
}
