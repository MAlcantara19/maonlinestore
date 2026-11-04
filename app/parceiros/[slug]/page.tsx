// =====================================================================
// PÁGINA DE UM PARCEIRO (endereço: /parceiros/judo-clube-denis)
// Banner com foto, descrição, horários, contatos (WhatsApp, Instagram,
// site) e o MAPA, gerado sozinho a partir do endereço (sem chave de API).
// =====================================================================
import { linkWhatsApp } from "@/lib/whatsapp";
import { IconeTelefone } from "@/components/Icones";
import ImagemLogo from "@/components/ImagemLogo";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import { COLUNAS_PARCEIRO } from "@/lib/parceiros";
import { telefoneBonito, usuarioInstagram } from "@/lib/formato";
import type { Parceiro } from "@/lib/tipos";
import IconeInstagram from "@/components/IconeInstagram";
import Rodape from "@/components/Rodape";
import { SITE } from "@/lib/config";
import EfeitoFestivo from "@/components/EfeitoFestivo";
import EstilosAnimacao from "@/components/EstilosAnimacao";

type Props = { params: Promise<{ slug: string }> };

async function buscar(slug: string) {
  const { data } = await supabase.from("parceiros").select(COLUNAS_PARCEIRO).eq("slug", slug).eq("ativo", true).maybeSingle<Parceiro>();
  return data;
}

// Título da aba e prévia do link (com a foto do parceiro)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await buscar(slug);
  if (!p) return { title: "Parceiro não encontrado" };
  const imagem = p.foto_url ?? p.logo_url;
  return {
    title: `${p.nome} · Parceiros ${SITE.nome}`,
    description: p.descricao ?? undefined,
    openGraph: { title: p.nome, description: p.descricao ?? undefined, images: imagem ? [imagem] : undefined },
  };
}

export default function PaginaDoParceiro({ params }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<p className="p-8 text-sm opacity-70">Carregando...</p>}>
        <Conteudo params={params} />
      </Suspense>
      <Rodape />
    </div>
  );
}

async function Conteudo({ params }: Props) {
  await connection();
  const { slug } = await params;
  const p = await buscar(slug);
  if (!p) notFound();

  const cor = p.cor ?? "#1c1917";
  const insta = usuarioInstagram(p.instagram);
  const endereco = p.endereco?.trim();
  // Mapa do Google sem chave de API: "embed" para mostrar, "search" para abrir no app
  const mapaEmbed = endereco ? `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed` : null;
  const mapaLink = endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}` : null;
  const botao = "clicavel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold";

  return (
    <>
      <EstilosAnimacao />
      {p.efeito && p.efeito !== "nenhum" && <EfeitoFestivo tipo={p.efeito} cor={cor} logo={p.logo_url} />}

      {/* Banner INTEIRO (sem cortar) + logo redonda à esquerda e o nome ao lado */}
      <header className="text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <Link href="/parceiros" className="rounded-full bg-white/15 px-3 py-1.5 text-sm">← Parceiros</Link>
          {p.foto_url && (
            // A imagem aparece inteira; as sobras são preenchidas com ela mesma, desfocada
            <div className="animar-entrada relative mt-4 overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: "16 / 10", maxHeight: "62vh", width: "100%" }}>
              <img src={p.foto_url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
              <img src={p.foto_url} alt={p.nome} className="relative h-full w-full object-contain" />
            </div>
          )}
          <div className={`flex items-center gap-4 pb-6 ${p.foto_url ? "-mt-10 px-2 sm:px-6" : "pt-8"}`}>
            {p.logo_url && (
              <span className="animar-entrada relative block h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl sm:h-28 sm:w-28">
                <ImagemLogo src={p.logo_url} ajuste={p.logo_ajuste} zoom={p.logo_zoom} fundo={p.logo_fundo} />
              </span>
            )}
            <div className={`min-w-0 ${p.foto_url ? "pt-10" : ""}`}>
              <div className="flex flex-wrap gap-2">
                {p.categoria && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">{p.categoria}</span>}
                {p.selo && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-stone-900">{p.selo}</span>}
              </div>
              <h1 className="animar-entrada mt-1 text-2xl font-bold drop-shadow-lg sm:text-4xl" style={{ animationDelay: "100ms" }}>{p.nome}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        {/* Botões de contato */}
        <div className="flex flex-wrap gap-2">
          {p.whatsapp && (
            <a className={`${botao} bg-[#1FA855] text-white`} target="_blank" rel="noopener noreferrer"
              href={linkWhatsApp(p.whatsapp.replace(/\D/g, ""), `Olá! Vi a indicação no site da ${SITE.nome} 😊`)}>
              <span className="icone-tremer"><IconeTelefone /></span> {telefoneBonito(p.whatsapp)}
            </a>
          )}
          {insta && (
            <a className={`${botao} border`} style={{ borderColor: cor, color: cor }} target="_blank" rel="noopener noreferrer" href={`https://instagram.com/${insta}`}>
              <IconeInstagram /> @{insta}
            </a>
          )}
          {p.site && (
            <a className={`${botao} border`} style={{ borderColor: cor, color: cor }} target="_blank" rel="noopener noreferrer" href={p.site}>
              🌐 Site
            </a>
          )}
        </div>

        {p.descricao && <p className="mt-6 whitespace-pre-line text-lg leading-relaxed">{p.descricao}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {p.horarios && (
            <section className="rounded-2xl border p-4" style={{ borderColor: `${cor}55` }}>
              <h2 className="mb-2 font-bold">🕒 Horários</h2>
              <p className="whitespace-pre-line text-sm">{p.horarios}</p>
            </section>
          )}
          {endereco && (
            <section className="rounded-2xl border p-4" style={{ borderColor: `${cor}55` }}>
              <h2 className="mb-2 font-bold">📍 Endereço</h2>
              <p className="text-sm">{endereco}</p>
              <a href={mapaLink!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold underline" style={{ color: cor }}>
                Abrir no Google Maps →
              </a>
            </section>
          )}
        </div>

        {/* Mapa */}
        {mapaEmbed && (
          <iframe title={`Mapa: ${p.nome}`} src={mapaEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="mt-6 h-72 w-full rounded-2xl border-0 shadow" />
        )}
      </main>
    </>
  );
}
