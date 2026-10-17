"use client";
// =====================================================================
// CARRINHO — itens, quantidades, cupom de desconto, nome, data e
// urgência. Dois botões:
//   📝 Pedir orçamento   ✅ Finalizar pedido
// Ao enviar: o pedido é SALVO (ganha um código, ex.: #A3F9K2) e abre o
// WhatsApp da loja com a mensagem pronta e o link de acompanhamento.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { salvarCarrinho, usarCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formato";
import { montarMensagem } from "@/lib/mensagem";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Loja } from "@/lib/tipos";
import Magnetico from "@/components/Magnetico";
import { IconeTelefone } from "@/components/Icones";

type Cupom = { codigo: string; tipo: "porcentagem" | "valor"; valor: number; minimo: number | null };

export default function Carrinho({ loja }: { loja: Loja }) {
  const itens = usarCarrinho(loja.slug);
  const cor = loja.cor ?? "#333";
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [textoCupom, setTextoCupom] = useState("");
  const [cupom, setCupom] = useState<Cupom | null>(null);
  const [avisoCupom, setAvisoCupom] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviao, setAviao] = useState(false); // ✈️ animação do envio

  // Cupom que veio por link (?cupom=...) já entra aplicado
  const [meusPedidos, setMeusPedidos] = useState<{ codigo: string; quando: string; total: number }[]>([]);
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(`cupom:${loja.slug}`);
      if (guardado) setTextoCupom(guardado);
      setMeusPedidos(JSON.parse(localStorage.getItem(`meus-pedidos:${loja.slug}`) ?? "[]"));
    } catch {}
  }, [loja.slug]);
  useEffect(() => {
    if (textoCupom && !cupom && itens.length) aplicarCupom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoCupom, itens.length]);

  // Muda a quantidade de um item; se chegar a zero, remove.
  function mudarQuantidade(indice: number, delta: number) {
    const novos = [...itens];
    novos[indice] = { ...novos[indice], quantidade: novos[indice].quantidade + delta };
    salvarCarrinho(loja.slug, novos.filter((i) => i.quantidade > 0));
  }

  // Contas (os itens "sob consulta" ficam fora do total)
  const subtotal = itens.reduce((s, i) => s + (i.preco ?? 0) * i.quantidade, 0);
  const temSobConsulta = itens.some((i) => i.preco == null);
  const cupomVale = cupom && (!cupom.minimo || subtotal >= Number(cupom.minimo));
  const desconto = cupom && cupomVale
    ? Math.min(subtotal, cupom.tipo === "porcentagem" ? (subtotal * Number(cupom.valor)) / 100 : Number(cupom.valor))
    : 0;
  const total = subtotal - desconto;

  // Pergunta ao banco se o cupom vale (os códigos não ficam expostos no site)
  async function aplicarCupom() {
    if (!textoCupom.trim()) return;
    const { data: r } = await supabaseNavegador().rpc("validar_cupom", { p_loja: loja.id, p_codigo: textoCupom });
    const achado = (r as Cupom[] | null)?.[0];
    if (!achado) { setCupom(null); setAvisoCupom("Cupom inválido ou vencido 😕"); return; }
    setCupom(achado);
    setAvisoCupom(achado.minimo && subtotal < Number(achado.minimo) ? `Vale para compras a partir de ${formatarPreco(Number(achado.minimo))}` : "✓ Cupom aplicado!");
  }

  async function enviar(tipo: "pedido" | "orcamento") {
    setEnviando(true);
    setAviao(true); // ✈️ o pedido "voa"
    // Abre a aba JÁ no clique (se esperar o banco, alguns celulares bloqueiam a janela nova)
    const janela = window.open("", "_blank");
    // 1) Salva o pedido e pega o código (se falhar, envia mesmo assim, sem código)
    let codigo: string | null = null;
    try {
      const { data: r } = await supabaseNavegador().rpc("criar_pedido", {
        p_loja: loja.id, p_tipo: tipo, p_nome: nome || null,
        p_itens: itens.map((i) => ({ nome: i.nome, quantidade: i.quantidade, tamanho: i.tamanho, cor: i.cor, preco: i.preco, observacao: i.observacao })),
        p_total: total, p_desconto: desconto || null, p_cupom: cupomVale ? cupom!.codigo : null, p_data: data || null, p_urgente: urgente,
      });
      codigo = (r as string) ?? null;
    } catch {}

    // Guarda o pedido no aparelho do cliente ("Seus pedidos recentes")
    if (codigo) {
      try {
        const lista = [{ codigo, quando: new Date().toISOString(), total }, ...meusPedidos].slice(0, 10);
        localStorage.setItem(`meus-pedidos:${loja.slug}`, JSON.stringify(lista));
        setMeusPedidos(lista);
      } catch {}
    }

    // 2) Monta a mensagem bonita e abre o WhatsApp da loja
    const mensagem = montarMensagem({
      tipo, loja: loja.nome, codigo, nome, itens, subtotal, desconto, cupom: cupomVale ? cupom!.codigo : null,
      total, temSobConsulta, data, urgente, linkAcompanhar: codigo ? `${window.location.origin}/pedido/${codigo}` : null,
    });
    const numero = (loja.whatsapp ?? "").replace(/\D/g, "");
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    // Espera o aviãozinho terminar e abre o WhatsApp na aba já aberta (ou nesta mesma)
    setTimeout(() => {
      if (janela) janela.location.href = url;
      else window.location.href = url;
      setAviao(false);
      setEnviando(false);
    }, 1300);
  }

  if (itens.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="opacity-70">Seu carrinho está vazio.</p>
        <Link href={`/${loja.slug}`} className="mt-3 inline-block font-semibold underline">Ver produtos</Link>
        <PedidosRecentes lista={meusPedidos} cor={cor} />
      </div>
    );
  }

  const campo = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

  return (
    <div className="mt-4">
      {/* Itens */}
      {itens.map((i, indice) => (
        <div key={`${i.chave}-${i.observacao}`} className="flex items-start justify-between gap-3 border-b py-3">
          <div>
            <b>{i.nome}</b>
            <p className="text-sm opacity-70">
              {[i.tamanho, i.cor].filter(Boolean).join(" · ")}
              {i.preco != null ? ` · ${formatarPreco(i.preco)}` : " · sob consulta"}
            </p>
            {i.observacao && <p className="text-xs opacity-70">✏️ {i.observacao}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="h-8 w-8 rounded border" onClick={() => mudarQuantidade(indice, -1)}>−</button>
            <span>{i.quantidade}</span>
            <button className="h-8 w-8 rounded border" onClick={() => mudarQuantidade(indice, 1)}>+</button>
          </div>
        </div>
      ))}

      {/* Cupom */}
      <div className="mt-4">
        <div className="flex gap-2">
          <input className={campo} placeholder="🏷️ Cupom de desconto" value={textoCupom}
            onChange={(e) => { setTextoCupom(e.target.value.toUpperCase()); setAvisoCupom(""); }}
            onKeyDown={(e) => e.key === "Enter" && aplicarCupom()} />
          <button type="button" onClick={aplicarCupom} className="shrink-0 rounded-lg border px-4 text-sm font-semibold" style={{ borderColor: cor, color: cor }}>Aplicar</button>
        </div>
        {avisoCupom && <p className={`mt-1 text-xs ${avisoCupom.startsWith("✓") ? "text-green-700" : "text-red-600"}`}>{avisoCupom}</p>}
      </div>

      {/* Valores */}
      <div className="mt-4 space-y-1 text-sm">
        {desconto > 0 && (
          <>
            <p className="flex justify-between"><span>Subtotal</span><span>{formatarPreco(subtotal)}</span></p>
            <p className="flex justify-between text-green-700"><span>🏷️ Cupom {cupom!.codigo}</span><span>− {formatarPreco(desconto)}</span></p>
          </>
        )}
        <p className="flex justify-between text-lg font-bold"><span>Total estimado</span><span style={{ color: cor }}>{formatarPreco(total)}</span></p>
        {temSobConsulta && <p className="text-right text-xs opacity-70">+ itens sob consulta</p>}
      </div>

      {/* Dados do pedido */}
      <div className="mt-4 space-y-3 rounded-xl border p-3" style={{ borderColor: `${cor}44` }}>
        <label className="block text-sm font-semibold">👤 Seu nome <span className="font-normal opacity-60">(opcional)</span>
          <input className={`${campo} mt-1`} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?" />
        </label>
        <label className="block text-sm font-semibold">📅 Para quando você precisa? <span className="font-normal opacity-60">(opcional)</span>
          <input type="date" className={`${campo} mt-1`} value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} /> ⚡ <b>É urgente</b>
        </label>
      </div>

      {/* Como funciona o pedido: aparece logo antes de enviar */}
      {loja.aviso_pedido && (
        <div className="mt-4 w-fit max-w-full whitespace-pre-line rounded-xl border p-4 text-sm"
          style={{ borderColor: cor, background: loja.cor_secundaria ? `${loja.cor_secundaria}55` : undefined }}>
          <b className="mb-1 block">Antes de enviar, fique atento:</b>
          {loja.aviso_pedido}
        </div>
      )}

      {/* Envio */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button onClick={() => enviar("orcamento")} disabled={enviando} className="rounded-xl border-2 p-4 font-semibold disabled:opacity-50" style={{ borderColor: cor, color: cor }}>
          📝 Pedir orçamento
        </button>
        <Magnetico forca={0.12}>
          <button onClick={() => enviar("pedido")} disabled={enviando}
            className="botao-vivo pulsar inline-flex w-full items-center justify-center gap-2 rounded-xl p-4 font-semibold text-white disabled:opacity-50">
            <span className="icone-tremer"><IconeTelefone /></span> Finalizar pedido
          </button>
        </Magnetico>
      </div>
      <p className="mt-2 text-center text-xs opacity-60">Os dois abrem o WhatsApp da loja com tudo já escrito.</p>

      {/* ✈️ Tela "preparando seu pedido" + aviãozinho de papel */}
      {aviao && (
        <div className="surgir fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-white/90 text-stone-900 backdrop-blur-md">
          <span className="aviao text-6xl drop-shadow-lg">✈️</span>
          <b className="text-lg">Preparando seu pedido para a {loja.nome}... 🚀</b>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-black/10">
            <div className="encher h-full rounded-full" style={{ background: cor }} />
          </div>
        </div>
      )}
      <button onClick={() => salvarCarrinho(loja.slug, [])} className="mt-3 w-full text-sm underline opacity-70">
        Esvaziar carrinho
      </button>
      <PedidosRecentes lista={meusPedidos} cor={cor} />
    </div>
  );
}

// Pedidos que esta pessoa já enviou (guardados só no aparelho dela)
function PedidosRecentes({ lista, cor }: { lista: { codigo: string; quando: string; total: number }[]; cor: string }) {
  if (!lista.length) return null;
  return (
    <div className="mt-6 text-left">
      <b className="text-sm">🧾 Seus pedidos recentes</b>
      <div className="mt-2 space-y-1">
        {lista.slice(0, 5).map((p) => (
          <a key={p.codigo} href={`/pedido/${p.codigo}`} className="flex justify-between rounded-lg border px-3 py-2 text-sm hover:bg-black/5">
            <span className="font-mono font-bold" style={{ color: cor }}>#{p.codigo}</span>
            <span className="opacity-70">{new Date(p.quando).toLocaleDateString("pt-BR")} · {formatarPreco(p.total)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
