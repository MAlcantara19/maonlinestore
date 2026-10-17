// =====================================================================
// ACOMPANHAR PEDIDO (endereço: /pedido/A3F9K2)
// O link vai na mensagem do WhatsApp. O cliente vê o andamento:
//   📥 Recebido → 🛠️ Em produção → 🎁 Pronto → ✅ Entregue
// A loja muda o andamento no painel (aba Pedidos).
// =====================================================================
import { IconeTelefone } from "@/components/Icones";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { supabase } from "@/lib/supabase";
import { formatarPreco } from "@/lib/formato";
import Rodape from "@/components/Rodape";

type Props = { params: Promise<{ codigo: string }> };
type Item = { nome: string; quantidade: number; tamanho: string | null; cor: string | null; preco: number | null; observacao: string };

export const metadata: Metadata = { title: "Acompanhar pedido · MA Online Store", robots: { index: false } };

const ETAPAS = [
  { valor: "recebido", rotulo: "Recebido", icone: "📥" },
  { valor: "em_producao", rotulo: "Em produção", icone: "🛠️" },
  { valor: "pronto", rotulo: "Pronto", icone: "🎁" },
  { valor: "entregue", rotulo: "Entregue", icone: "✅" },
];

export default function PaginaPedido({ params }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <Suspense fallback={<p className="p-8 text-center opacity-60">Carregando pedido...</p>}>
        <Conteudo params={params} />
      </Suspense>
      <Rodape />
    </div>
  );
}

async function Conteudo({ params }: Props) {
  await connection();
  const { codigo } = await params;
  const { data } = await supabase.rpc("consultar_pedido", { p_codigo: codigo });
  const p = (data as Record<string, unknown>[] | null)?.[0];

  if (!p) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <p className="text-4xl">🔎</p>
        <h1 className="mt-2 text-xl font-bold">Pedido não encontrado</h1>
        <p className="opacity-70">Confira o código na mensagem do WhatsApp.</p>
        <Link href="/" className="mt-4 inline-block underline">Ir para as lojas</Link>
      </main>
    );
  }

  const cor = (p.loja_cor as string) ?? "#333";
  const status = p.status as string;
  const indice = ETAPAS.findIndex((e) => e.valor === status);
  const itens = p.itens as Item[];
  const data_ = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <>
      <header className="text-white" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}cc)` }}>
        <div className="mx-auto max-w-xl px-4 py-8">
          <Link href={`/${p.loja_slug}`} className="rounded-full bg-white/15 px-3 py-1.5 text-sm">← {p.loja_nome as string}</Link>
          <h1 className="mt-4 text-2xl font-bold">{p.tipo === "orcamento" ? "📝 Orçamento" : "🧾 Pedido"} #{p.codigo as string}</h1>
          <p className="text-sm opacity-90">Feito em {data_(p.criado_em as string)}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-6">
        {/* Andamento */}
        {status === "cancelado" ? (
          <p className="rounded-xl bg-red-50 p-4 text-center font-semibold text-red-700">❌ Este pedido foi cancelado.</p>
        ) : (
          <ol className="relative space-y-4 border-l-2 pl-6" style={{ borderColor: `${cor}44` }}>
            {ETAPAS.map((e, i) => {
              const feito = i <= indice;
              return (
                <li key={e.valor} className="relative">
                  <span className="absolute -left-[2.15rem] flex h-8 w-8 items-center justify-center rounded-full text-sm shadow"
                    style={{ background: feito ? cor : "#e7e5e4" }}>{e.icone}</span>
                  <b className={feito ? "" : "opacity-40"}>{e.rotulo}</b>
                  {i === indice && <span className="ml-2 rounded-full px-2 py-0.5 text-xs text-white" style={{ background: cor }}>agora</span>}
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-2 text-xs opacity-60">Atualizado em {data_(p.atualizado_em as string)}</p>

        {/* Recado da loja */}
        {p.nota_loja ? (
          <div className="mt-4 rounded-xl border-l-4 bg-white p-3 text-sm shadow-sm" style={{ borderColor: cor }}>
            <b className="block" style={{ color: cor }}>💬 Recado da loja</b>
            <p className="whitespace-pre-line">{p.nota_loja as string}</p>
          </div>
        ) : null}

        {/* Itens */}
        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold">📦 Itens</h2>
          {itens.map((i, n) => (
            <div key={n} className="border-b py-2 text-sm last:border-0">
              <b>{i.quantidade}x {i.nome}</b>
              <p className="opacity-70">{[i.tamanho, i.cor].filter(Boolean).join(" · ")}{i.preco != null ? ` · ${formatarPreco(Number(i.preco))}` : " · sob consulta"}</p>
              {i.observacao && <p className="text-xs opacity-70">✏️ {i.observacao}</p>}
            </div>
          ))}
          {Number(p.desconto) > 0 && <p className="mt-2 text-sm text-green-700">🏷️ Cupom {p.cupom as string}: − {formatarPreco(Number(p.desconto))}</p>}
          <p className="mt-2 font-bold">Total estimado: {formatarPreco(Number(p.total ?? 0))}</p>
          {p.data_desejada ? <p className="text-sm">📅 Para: {(p.data_desejada as string).split("-").reverse().join("/")}</p> : null}
          {p.urgente ? <p className="text-sm font-semibold">⚡ Urgente</p> : null}
        </section>

        {p.loja_whatsapp ? (
          <a href={`https://wa.me/${(p.loja_whatsapp as string).replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Sobre o pedido #${p.codigo} 😊`)}`}
            target="_blank" rel="noopener noreferrer" className="botao-vivo mt-4 block rounded-xl bg-[#1FA855] p-3 text-center font-semibold text-white">
            <span className="icone-tremer inline-block"><IconeTelefone /></span> Falar com a loja sobre este pedido
          </a>
        ) : null}
      </main>
    </>
  );
}
