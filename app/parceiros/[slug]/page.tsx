// =====================================================================
// PÁGINA DE UM PARCEIRO (endereço: /parceiros/judo-clube-denis)
// Banner com foto, descrição, horários, contatos (WhatsApp, Instagram,
// site) e o MAPA, gerado sozinho a partir do endereço (sem chave de API).
// =====================================================================
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
      {/* Banner com a foto do parceiro (ou só a cor) */}
      <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
        {p.foto_url && <img src={p.foto_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="relative mx-auto max-w-4xl px-4 pt-4 pb-10">
          <Link href="/parceiros" className="rounded-full bg-white/15 px-3 py-1.5 text-sm">← Parceiros</Link>
          <div className="mt-6 flex items-center gap-4">
            {p.logo_url && <img src={p.logo_url} alt="" className="h-20 w-20 shrink-0 rounded-full bg-white object-cover shadow-lg" />}
            <div>
              {p.categoria && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">{p.categoria}</span>}
              <h1 className="mt-1 text-3xl font-bold drop-shadow">{p.nome}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        {/* Botões de contato */}
        <div className="flex flex-wrap gap-2">
          {p.whatsapp && (
            <a className={`${botao} bg-[#1FA855] text-white`} target="_blank" rel="noopener noreferrer"
              href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Vi a indicação no site da ${SITE.nome} 😊`)}`}>
              💬 {telefoneBonito(p.whatsapp)}
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
