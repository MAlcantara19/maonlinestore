// =====================================================================
// CATÁLOGO EM PDF (endereço: /vitraforma/catalogo)
// Todos os produtos visíveis, com foto e preço, prontos para "Salvar como
// PDF" e mandar no WhatsApp. Tem QR Code de cada produto.
// =====================================================================
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { formatarPreco, precoMinimo } from "@/lib/formato";
import { SITE } from "@/lib/config";
import BotaoImprimir from "@/components/BotaoImprimir";
import type { Produto } from "@/lib/tipos";

type Props = { params: Promise<{ slug: string }> };
export const metadata: Metadata = { title: `Catálogo · ${SITE.nome}`, robots: { index: false } };

export default function PaginaCatalogo({ params }: Props) {
  return <Suspense fallback={<p className="p-8">Montando o catálogo...</p>}><Catalogo params={params} /></Suspense>;
}

async function Catalogo({ params }: Props) {
  await connection();
  const { slug } = await params;
  const { data: loja } = await supabase.from("lojas").select("id, nome, descricao, cor, logo_url, whatsapp, instagram").eq("slug", slug).eq("ativa", true).maybeSingle();
  if (!loja) notFound();
  const { data } = await supabase.from("produtos").select("id, nome, preco, disponibilidade, variacoes(preco, ativa), midias(url, tipo, ordem)")
    .eq("loja_id", loja.id).eq("ativo", true).order("ordem").order("nome");
  const produtos = (data ?? []) as unknown as Produto[];
  const cor = loja.cor ?? "#333";
  const qrLoja = await QRCode.toDataURL(`${SITE.url}/${slug}`, { margin: 1, width: 200 });

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 text-stone-900">
      <style>{`@media print { .nao-imprimir { display: none !important; } @page { margin: 10mm; } }`}</style>
      <div className="mb-4 text-center"><BotaoImprimir cor={cor} /></div>
      <header className="flex items-center gap-4 rounded-2xl p-5 text-white" style={{ background: cor }}>
        {loja.logo_url && <img src={loja.logo_url} alt="" className="h-20 w-20 rounded-full border-4 border-white object-cover" />}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{loja.nome}</h1>
          <p className="opacity-90">{loja.descricao}</p>
          <p className="mt-1 text-sm opacity-90">Catálogo · {new Date().toLocaleDateString("pt-BR")} · Peça pelo WhatsApp</p>
        </div>
        <img src={qrLoja} alt="QR da loja" className="h-24 w-24 rounded-lg bg-white p-1" />
      </header>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {produtos.map((p) => {
          const capa = [...p.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem)[0]?.url;
          const preco = precoMinimo(p);
          return (
            <div key={p.id} className="overflow-hidden rounded-xl border" style={{ breakInside: "avoid" }}>
              <div className="aspect-square bg-stone-100">{capa && <img src={capa} alt="" className="h-full w-full object-cover" />}</div>
              <div className="p-2">
                <b className="block text-sm">{p.nome}</b>
                <span className="text-sm font-bold" style={{ color: cor }}>{preco != null ? `${p.variacoes.some((v) => v.preco != null) ? "a partir de " : ""}${formatarPreco(preco)}` : "Sob consulta"}</span>
                {p.disponibilidade === "esgotado" && <span className="ml-1 text-xs text-red-600">esgotado</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sm opacity-70">Veja tudo e faça seu pedido: {SITE.url.replace(/^https?:\/\//, "")}/{slug}</p>
    </div>
  );
}
