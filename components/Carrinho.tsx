"use client";
// =====================================================================
// CARRINHO — itens, quantidades, cupom de desconto, nome, data e
// urgência. Dois botões:
//   📝 Pedir orçamento   ✅ Finalizar pedido
// Ao enviar: o pedido é SALVO (ganha um código, ex.: #A3F9K2) e abre o
// WhatsApp da loja com a mensagem pronta e o link de acompanhamento.
// =====================================================================
import CalculoFrete, { chaveFrete } from "@/components/CalculoFrete";
import Portal from "@/components/Portal";
import { linkWhatsApp } from "@/lib/whatsapp";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adicionarAoCarrinho, salvarCarrinho, usarCarrinho, type ItemCarrinho } from "@/lib/carrinho";
import { formatarPreco } from "@/lib/formato";
import { montarMensagem } from "@/lib/mensagem";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Loja } from "@/lib/tipos";
import Magnetico from "@/components/Magnetico";
import { registrarEvento } from "@/lib/eventos";
import { IconeTelefone } from "@/components/Icones";

type Cupom = { codigo: string; tipo: "porcentagem" | "valor"; valor: number; minimo: number | null };

export default function Carrinho({ loja }: { loja: Loja }) {
  const todos = usarCarrinho(loja.slug);
  // Itens marcados para ESTE pedido (os desmarcados continuam no carrinho)
  const [fora, setFora] = useState<string[]>([]);
  const chaveItem = (i: { chave: string; observacao?: string }) => `${i.chave}§${i.observacao ?? ""}`;
  const itens = todos.filter((i) => !fora.includes(chaveItem(i)));
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
  const [meusPedidos, setMeusPedidos] = useState<PedidoGuardado[]>([]);
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
    const novos = [...todos];
    novos[indice] = { ...novos[indice], quantidade: novos[indice].quantidade + delta };
    if (novos[indice].quantidade <= 0) registrarEvento(loja.slug, "carrinho_remove", novos[indice].produtoId); // estatísticas
    salvarCarrinho(loja.slug, novos.filter((i) => i.quantidade > 0));
  }

  // Contas (os itens "sob consulta" ficam fora do total)
  const subtotal = itens.reduce((s, i) => s + (i.preco ?? 0) * i.quantidade, 0);
  const temSobConsulta = itens.some((i) => i.preco == null);
  const cupomVale = cupom && (!cupom.minimo || subtotal >= Number(cupom.minimo));
  const descontoCupom = cupom && cupomVale
    ? Math.min(subtotal, cupom.tipo === "porcentagem" ? (subtotal * Number(cupom.valor)) / 100 : Number(cupom.valor))
    : 0;
  // 🎁 Primeira compra (pelo WhatsApp): vale o MAIOR entre cupom e boas-vindas (não somam)
  const [primeira, setPrimeira] = useState(false);
  const descontoBoasVindas = primeira && loja.boas_vindas_pct ? Math.round(subtotal * loja.boas_vindas_pct) / 100 : 0;
  const usaBoasVindas = descontoBoasVindas > descontoCupom;
  const desconto = Math.max(descontoCupom, descontoBoasVindas);
  // Entrega/frete (opções cadastradas pela loja)
  const fretes = loja.fretes ?? [];
  const [entrega, setEntrega] = useState("");
  const freteEscolhido = fretes.find((f) => f.nome === entrega);
  const valorFrete = freteEscolhido ? Number(freteEscolhido.valor) || 0 : 0;
  const [avisoEntrega, setAvisoEntrega] = useState(false);
  const [telefone, setTelefone] = useState(""); // WhatsApp do cliente (para os avisos do pedido)
  useEffect(() => { try { setTelefone(localStorage.getItem("meu-whatsapp") ?? ""); } catch {} }, []);
  const total = subtotal - desconto + valorFrete;
  // ⚡ Preço no Pix / à vista (desconto da loja)
  const totalPix = loja.desconto_pix ? Math.round((subtotal - desconto) * (100 - loja.desconto_pix)) / 100 + valorFrete : null;
  useEffect(() => {
    const tel = telefone.replace(/\D/g, "");
    if (!loja.boas_vindas_pct || tel.length < 10) { setPrimeira(false); return; }
    const t = setTimeout(() => {
      supabaseNavegador().rpc("primeira_compra", { p_slug: loja.slug, p_telefone: tel }).then(({ data }: { data: boolean | null }) => setPrimeira(!!data), () => setPrimeira(false));
    }, 500);
    return () => clearTimeout(t);
  }, [telefone, loja.boas_vindas_pct, loja.slug]);
  // ⭐ Fidelidade: quanto falta para o próximo prêmio (só a porcentagem)
  const [fidelidade, setFidelidade] = useState<{ progresso: number; premio: number } | null>(null);
  useEffect(() => {
    const tel = telefone.replace(/\D/g, "");
    if (!loja.fidelidade_a_cada || tel.length < 10) { setFidelidade(null); return; }
    const t = setTimeout(() => {
      supabaseNavegador().rpc("fidelidade_progresso", { p_slug: loja.slug, p_telefone: tel })
        .then(({ data }: { data: { progresso: number; premio: number }[] | null }) => setFidelidade(data?.[0] ?? null), () => setFidelidade(null));
    }, 600);
    return () => clearTimeout(t);
  }, [telefone, loja.fidelidade_a_cada, loja.slug]);

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
    try { if (telefone.trim()) localStorage.setItem("meu-whatsapp", telefone.trim()); } catch {}
    // Loja com opções de entrega: precisa escolher uma antes de enviar
    if (fretes.length && !freteEscolhido) { setAvisoEntrega(true); return; }
    setEnviando(true);
    setAviao(true); // ✈️ o pedido "voa"
    // Abre a aba JÁ no clique (se esperar o banco, alguns celulares bloqueiam a janela nova)
    const janela = window.open("", "_blank");
    // 1) Salva o pedido e pega o código (se falhar, envia mesmo assim, sem código)
    let codigo: string | null = null;
    try {
      const { data: r } = await supabaseNavegador().rpc("criar_pedido", {
        p_loja: loja.id, p_tipo: tipo, p_nome: nome || null,
        p_itens: itens.map((i) => {
          const variacao = i.chave.split("|")[1];
          return { nome: i.nome, opcao: i.opcao ?? null, quantidade: i.quantidade, tamanho: i.tamanho, cor: i.cor, preco: i.preco, observacao: i.observacao,
            produto_id: i.produtoId, variacao_id: variacao && variacao !== "unico" ? variacao : null, foto: i.foto ?? null };
        }),
        p_total: total, p_desconto: desconto || null, p_cupom: usaBoasVindas ? "PRIMEIRA-COMPRA" : cupomVale ? cupom!.codigo : null, p_data: data || null, p_urgente: urgente,
        p_entrega: freteEscolhido?.nome ?? null, p_frete: freteEscolhido ? valorFrete : null,
        p_telefone: telefone.replace(/\D/g, "") || null,
      });
      codigo = (r as string) ?? null;
    } catch {}

    // Estatísticas: o pedido entra no histórico com o código e o nome que a pessoa digitou
    registrarEvento(loja.slug, tipo === "orcamento" ? "whatsapp" : "pedido", null, codigo ? `#${codigo}${nome.trim() ? ` · ${nome.trim()}` : ""}` : null);

    // Guarda o pedido no aparelho do cliente ("Seus pedidos recentes")
    if (codigo) {
      try {
        // Guarda também os itens (para o "🔁 Pedir de novo")
        const lista = [{ codigo, quando: new Date().toISOString(), total, itens: itens.map((i) => ({ ...i })) }, ...meusPedidos].slice(0, 10);
        localStorage.setItem(`meus-pedidos:${loja.slug}`, JSON.stringify(lista));
        setMeusPedidos(lista);
      } catch {}
    }

    // 2) Monta a mensagem bonita e abre o WhatsApp da loja
    const mensagem = montarMensagem({
      tipo, loja: loja.nome, codigo, nome, itens, subtotal, desconto, cupom: !usaBoasVindas && cupomVale ? cupom!.codigo : null,
      boasVindas: usaBoasVindas ? { pct: loja.boas_vindas_pct!, valor: descontoBoasVindas } : null,
      pix: totalPix != null ? { pct: loja.desconto_pix!, valor: totalPix } : null,
      total, temSobConsulta, data, urgente, linkAcompanhar: codigo ? `${window.location.origin}/pedido/${codigo}` : null,
      entrega: freteEscolhido?.nome ?? null, frete: freteEscolhido ? valorFrete : null,
      freteEstimado: (() => {
        try {
          const e = JSON.parse(localStorage.getItem(chaveFrete(loja.slug)) ?? "null");
          return e ? `${e.cidade} - ${e.uf} (CEP ${e.cep}): ${e.valor == null ? "a combinar" : e.valor === 0 ? "grátis" : `cerca de ${formatarPreco(e.valor)}`}` : null;
        } catch { return null; }
      })(),
    });
    const numero = (loja.whatsapp ?? "").replace(/\D/g, "");
    const url = linkWhatsApp(numero, mensagem);
    // Espera o aviãozinho terminar e abre o WhatsApp na aba já aberta (ou nesta mesma)
    setTimeout(() => {
      if (janela) janela.location.href = url;
      else window.location.href = url;
      // Pedido enviado: saem do carrinho só os itens que foram no pedido
      if (tipo === "pedido") { salvarCarrinho(loja.slug, todos.filter((i) => fora.includes(chaveItem(i)))); setFora([]); }
      setAviao(false);
      setEnviando(false);
    }, 1300);
  }

  if (todos.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="opacity-70">Seu carrinho está vazio.</p>
        <Link href={`/${loja.slug}`} className="mt-3 inline-block font-semibold underline">Ver produtos</Link>
        <PedidosRecentes lista={meusPedidos} cor={cor} slug={loja.slug} />
      </div>
    );
  }

  const campo = "w-full rounded-lg border bg-white px-3 py-2 text-sm";

  return (
    <div className="mt-4">
      {/* Itens */}
      {todos.length > 1 && (
        <p className="mb-1 text-xs opacity-60">☑️ Desmarque o que <b>não</b> quer pedir agora — continua guardado no carrinho.</p>
      )}
      {todos.map((i, indice) => (
        <div key={`${i.chave}-${i.observacao}`} className="flex items-start justify-between gap-3 border-b py-3">
          {/* Marcar/desmarcar para este pedido */}
          {todos.length > 1 && (
            <input type="checkbox" className="mt-6 h-5 w-5 shrink-0" checked={!fora.includes(chaveItem(i))} aria-label="Incluir neste pedido"
              onChange={() => setFora((f) => (f.includes(chaveItem(i)) ? f.filter((x) => x !== chaveItem(i)) : [...f, chaveItem(i)]))} />
          )}
          {/* Foto do produto */}
          <span className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5 ${fora.includes(chaveItem(i)) ? "opacity-40" : ""}`}>
            {i.foto ? <img src={i.foto} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-2xl">📦</span>}
          </span>
          <div className="min-w-0 flex-1">
            <b>{i.nome}</b>
            <p className="text-sm opacity-70">
              {[i.opcao, i.tamanho, i.cor].filter(Boolean).join(" · ")}
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
          <button type="button" onClick={aplicarCupom} className="texto-cor borda-cor shrink-0 rounded-lg border px-4 text-sm font-semibold" style={{ borderColor: cor, color: cor }}>Aplicar</button>
        </div>
        {avisoCupom && <p className={`mt-1 text-xs ${avisoCupom.startsWith("✓") ? "text-green-700" : "text-red-600"}`}>{avisoCupom}</p>}
      </div>

      {/* Valores */}
      <div className="mt-4 space-y-1 text-sm">
        {(desconto > 0 || freteEscolhido) && (
          <>
            <p className="flex justify-between"><span>Subtotal</span><span>{formatarPreco(subtotal)}</span></p>
            {desconto > 0 && (usaBoasVindas
              ? <p className="flex justify-between text-green-700"><span>🎁 Primeira compra ({loja.boas_vindas_pct}%)</span><span>− {formatarPreco(desconto)}</span></p>
              : <p className="flex justify-between text-green-700"><span>🏷️ Cupom {cupom!.codigo}</span><span>− {formatarPreco(desconto)}</span></p>)}
            {freteEscolhido && <p className="flex justify-between"><span>🚚 {freteEscolhido.nome}</span><span>{valorFrete ? formatarPreco(valorFrete) : "grátis"}</span></p>}
          </>
        )}
        <p className="flex justify-between text-lg font-bold"><span>Total estimado</span><span className="texto-cor" style={{ color: cor }}>{formatarPreco(total)}</span></p>
        {temSobConsulta && <p className="text-right text-xs opacity-70">+ itens sob consulta</p>}
        {/* Cartão × Pix */}
        {totalPix != null && total > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
            <div className="rounded-xl border p-2"><span className="block text-xs opacity-60">💳 Cartão (1x)</span><b>{formatarPreco(total)}</b></div>
            <div className="rounded-xl border-2 border-green-600 bg-green-50 p-2 text-green-800"><span className="block text-xs">⚡ Pix / à vista (−{loja.desconto_pix}%)</span><b>{formatarPreco(totalPix)}</b></div>
          </div>
        )}
        {fora.length > 0 && <p className="mt-1 text-right text-xs opacity-60">{fora.length} item(ns) fora deste pedido</p>}
      </div>

      {/* Dados do pedido */}
      <div className="mt-4 space-y-3 rounded-xl border p-3" style={{ borderColor: `${cor}44` }}>
        <label className="block text-sm font-semibold">👤 Seu nome <span className="font-normal opacity-60">(opcional)</span>
          <input className={`${campo} mt-1`} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?" />
        </label>
        <label className="block text-sm font-semibold">📲 Seu WhatsApp <span className="font-normal opacity-60">(opcional — para receber o andamento do pedido)</span>
          <input type="tel" inputMode="tel" className={`${campo} mt-1`} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(24) 99999-9999" autoComplete="tel" />
          {loja.boas_vindas_pct && !primeira && <span className="mt-1 block text-xs font-normal text-green-700">🎁 Primeira compra aqui? Coloque seu WhatsApp e ganhe {loja.boas_vindas_pct}% de desconto!</span>}
          {fidelidade && (
            <span className="mt-2 block text-xs font-normal">
              ⭐ Programa de fidelidade: <b>{fidelidade.progresso}%</b> do caminho para ganhar <b>{fidelidade.premio}% de desconto</b>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-black/10"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${fidelidade.progresso}%` }} /></span>
            </span>
          )}
          {primeira && <span className="mt-1 block text-xs font-bold text-green-700">🎉 Primeira compra! Desconto de {loja.boas_vindas_pct}% aplicado{descontoCupom > descontoBoasVindas ? " (seu cupom é maior, então vale o cupom)" : ""}.</span>}
        </label>
        <label className="block text-sm font-semibold">📅 Para quando você precisa? <span className="font-normal opacity-60">(opcional)</span>
          <input type="date" className={`${campo} mt-1`} value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <CalculoFrete slug={loja.slug} regras={loja.frete_cep} cor={cor} exato={!!loja.cep_origem} itens={itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade }))} />
        {fretes.length > 0 && (
          <label className="block text-sm font-semibold">🚚 Entrega
            <select className={`${campo} mt-1`} value={entrega} onChange={(e) => { setEntrega(e.target.value); setAvisoEntrega(false); }}
              style={avisoEntrega ? { borderColor: "#dc2626" } : {}}>
              <option value="">Escolha como receber...</option>
              {fretes.map((f) => <option key={f.nome} value={f.nome}>{f.nome} — {Number(f.valor) ? formatarPreco(Number(f.valor)) : "grátis"}</option>)}
            </select>
            {avisoEntrega && <span className="mt-1 block text-xs font-normal text-red-600">Escolha como você quer receber para enviar o pedido.</span>}
          </label>
        )}
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

      {/* Envio: 1) finalizar (principal) · 2) tirar dúvidas · 3) continuar comprando */}
      <div className="mt-4 space-y-2">
        <Magnetico forca={0.12}>
          <button onClick={() => enviar("pedido")} disabled={enviando || itens.length === 0}
            className="botao-vivo pulsar inline-flex w-full items-center justify-center gap-2 rounded-xl p-4 text-lg font-semibold text-white disabled:opacity-50">
            <span className="icone-tremer"><IconeTelefone /></span> Finalizar pedido
          </button>
        </Magnetico>
        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={() => enviar("orcamento")} disabled={enviando || itens.length === 0} className="texto-cor borda-cor rounded-xl border-2 p-3 font-semibold disabled:opacity-50" style={{ borderColor: cor, color: cor }}>
            💬 Tirar dúvidas antes
          </button>
          <Link href={`/${loja.slug}`} onClick={() => window.dispatchEvent(new Event("fechar-carrinho"))}
            className="rounded-xl border-2 border-stone-300 p-3 text-center font-semibold">
            🛍️ Continuar comprando
          </Link>
        </div>
      </div>
      <p className="mt-2 text-center text-xs opacity-60">“Finalizar” e “Tirar dúvidas” abrem o WhatsApp da loja com seus itens já escritos.</p>

      {/* ✈️ Tela "preparando seu pedido" + aviãozinho de papel */}
      {aviao && (
        <Portal>
        <div className="surgir fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-white/90 text-stone-900 backdrop-blur-md">
          <span className="aviao text-6xl drop-shadow-lg">✈️</span>
          <b className="text-lg">Preparando seu pedido para a {loja.nome}... 🚀</b>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-black/10">
            <div className="encher h-full rounded-full" style={{ background: cor }} />
          </div>
        </div>
        </Portal>
      )}
      <button onClick={() => { todos.forEach((i) => registrarEvento(loja.slug, "carrinho_remove", i.produtoId)); salvarCarrinho(loja.slug, []); }} className="mt-3 w-full text-sm underline opacity-70">
        Esvaziar carrinho
      </button>
      <PedidosRecentes lista={meusPedidos} cor={cor} slug={loja.slug} />
    </div>
  );
}

// Pedidos que esta pessoa já enviou (guardados só no aparelho dela)
type PedidoGuardado = { codigo: string; quando: string; total: number; itens?: ItemCarrinho[] };

// Pedidos que esta pessoa já enviou (guardados só no aparelho dela), com "🔁 Pedir de novo"
function PedidosRecentes({ lista, cor, slug }: { lista: PedidoGuardado[]; cor: string; slug: string }) {
  if (!lista.length) return null;
  return (
    <div className="mt-6 text-left">
      <b className="text-sm">🧾 Seus pedidos recentes</b>
      <div className="mt-2 space-y-1">
        {lista.slice(0, 5).map((p) => (
          <div key={p.codigo} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <a href={`/pedido/${p.codigo}`} className="texto-cor font-mono font-bold" style={{ color: cor }}>#{p.codigo}</a>
            <span className="flex-1 opacity-70">{new Date(p.quando).toLocaleDateString("pt-BR")} · {formatarPreco(p.total)}</span>
            {p.itens?.length ? (
              <button type="button" className="rounded-full border px-2 py-0.5 text-xs" onClick={() => p.itens!.forEach((i) => adicionarAoCarrinho(slug, i))}>🔁 Pedir de novo</button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
