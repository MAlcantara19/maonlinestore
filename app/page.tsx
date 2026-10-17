// =====================================================================
// PÁGINA INICIAL (endereço: /)
//   1. Topo colorido com título, subtítulo, arte de fundo e efeito
//      animado (tudo configurável no painel: Página inicial)
//   2. Um círculo para cada loja ATIVA ("Em breve" aparece apagadinha)
//   3. Faixa de parceiros (quantidade configurável)
// =====================================================================
import ImagemLogo from "@/components/ImagemLogo";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ConfigSite, Loja } from "@/lib/tipos";
import { buscarConfigSite, CONFIG_PADRAO } from "@/lib/site";
import { buscarParceiros } from "@/lib/parceiros";
import Rodape from "@/components/Rodape";
import CartaoParceiro from "@/components/CartaoParceiro";
import EfeitoFestivo from "@/components/EfeitoFestivo";
import EstilosAnimacao from "@/components/EstilosAnimacao";

export default function PaginaInicial() {
  return (
    // flex-col + min-h-screen: o rodapé fica sempre no fim da tela
    <div className="flex min-h-screen flex-col">
      <EstilosAnimacao />
      <Suspense fallback={<div className="h-56 animate-pulse bg-black/10" />}>
        <Topo />
      </Suspense>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Suspense fallback={<p className="text-sm opacity-70">Carregando lojas...</p>}>
          <ListaDeLojas />
        </Suspense>
        <Suspense fallback={null}>
          <FaixaDeParceiros />
        </Suspense>
      </main>
      <Rodape />
    </div>
  );
}

// ---------------------------------------------------------------------
// Topo: degradê nas cores do site + bolhas de arte + imagem (opcional)
// + efeito animado. Tudo vem da tabela "site_config".
// ---------------------------------------------------------------------
async function Topo() {
  await connection();
  const c: ConfigSite = await buscarConfigSite().catch(() => CONFIG_PADRAO);
  const cor = c.cor ?? "#3B1260";
  const cor2 = c.cor_secundaria ?? cor;
  const bolhas =
    "radial-gradient(circle at 10% 30%, rgb(255 255 255 / 0.18) 0 70px, transparent 71px)," +
    "radial-gradient(circle at 90% 15%, rgb(255 255 255 / 0.14) 0 110px, transparent 111px)," +
    "radial-gradient(circle at 70% 120%, rgb(255 255 255 / 0.12) 0 150px, transparent 151px)";

  return (
    <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor2})` }}>
      {c.banner_url && <img src={c.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
      <div aria-hidden className="parallax-fundo pointer-events-none absolute inset-0" style={{ backgroundImage: bolhas }} />
      <div className="parallax-conteudo relative mx-auto max-w-5xl px-4 py-14 text-center">
        <h1 className="animar-entrada text-4xl font-bold drop-shadow sm:text-5xl">{c.titulo}</h1>
        {c.subtitulo && (
          <p className="animar-entrada mt-3 text-lg opacity-90" style={{ animationDelay: "120ms" }}>{c.subtitulo}</p>
        )}
        <Link href="/parceiros" className="animar-entrada clicavel mt-6 inline-block rounded-full bg-white/15 px-4 py-2 text-sm hover:bg-white/25"
          style={{ animationDelay: "240ms" }}>
          🤝 Conheça nossos parceiros
        </Link>
      </div>
      {c.efeito !== "nenhum" && <EfeitoFestivo tipo={c.efeito} cor={cor} />}
    </header>
  );
}

// ---------------------------------------------------------------------
// Busca as lojas no banco e desenha os círculos.
// ---------------------------------------------------------------------
async function ListaDeLojas() {
  await connection(); // dados novos a cada visita
  const { data: lojas, error } = await supabase
    .from("lojas")
    .select("id, slug, nome, descricao, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, em_breve")
    .eq("ativa", true)
    .order("ordem");

  if (error) return <p className="text-red-600">Erro ao carregar as lojas: {error.message}</p>;
  if (!lojas || lojas.length === 0) return <p>Nenhuma loja cadastrada ainda.</p>;

  return (
    <section>
      <h2 className="mb-4 text-center text-2xl font-bold">Nossas lojas</h2>
      {/* Celular: 2 colunas · tablet (sm): 3 · computador (lg): 5 */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {(lojas as Loja[]).map((loja, i) => {
          const circulo = (
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white text-3xl font-bold shadow-md"
              style={{ borderColor: loja.cor ?? "#999", color: loja.cor ?? "#333" }}>
              {loja.logo_url ? <ImagemLogo src={loja.logo_url} alt={loja.nome} ajuste={loja.logo_ajuste} zoom={loja.logo_zoom} fundo={loja.logo_fundo} /> : loja.nome.charAt(0)}
            </div>
          );
          const atraso = { animationDelay: `${i * 70}ms` };

          // Loja "em breve": apagadinha, com selo, sem abrir
          if (loja.em_breve) {
            return (
              <div key={loja.id} className="animar-entrada relative cursor-default p-2 text-center opacity-60 grayscale" style={atraso} title="Em breve">
                {circulo}
                <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-bold text-white">Em breve</span>
                <b className="mt-2 block">{loja.nome}</b>
                <span className="block text-xs opacity-70">{loja.descricao}</span>
              </div>
            );
          }

          return (
            <div key={loja.id} className="animar-entrada" style={atraso}>
              <Link href={`/${loja.slug}`} className="clicavel cartao block rounded-xl p-2 text-center">
                {circulo}
                <b className="mt-2 block">{loja.nome}</b>
                <span className="block text-xs opacity-70">{loja.descricao}</span>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Faixa "Parceiros": quantidade definida no painel (0 = todos).
// ---------------------------------------------------------------------
async function FaixaDeParceiros() {
  await connection();
  const config = await buscarConfigSite().catch(() => CONFIG_PADRAO);
  const parceiros = await buscarParceiros(config.parceiros_na_home);
  if (parceiros.length === 0) return null;
  return (
    <section className="mt-14">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">🤝 Parceiros</h2>
          <p className="text-sm opacity-70">Gente e lugares que a gente conhece, confia e indica.</p>
        </div>
        <Link href="/parceiros" className="shrink-0 text-sm font-semibold underline">Ver todos →</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parceiros.map((p, i) => <CartaoParceiro key={p.id} parceiro={p} indice={i} />)}
      </div>
    </section>
  );
}
