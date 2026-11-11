"use client";
// =====================================================================
// IMPRIMIR PEDIDO / RECIBO (endereço: /admin/vitraforma/pedidos/<id>)
//   ?modo=producao → folha para colar na produção ou na caixa (fotos
//                    grandes, itens, observações, QR do acompanhamento)
//   ?modo=recibo   → recibo do pagamento (imprimir/PDF ou IMAGEM para
//                    mandar no WhatsApp)
// Só abre para quem administra a loja (o banco garante).
// =====================================================================
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { formatarPreco, telefoneBonito, documentoBonito } from "@/lib/formato";
import { etapaDo } from "@/lib/statusPedido";
import { FORMAS_PAGAMENTO, rotuloDe } from "@/lib/pagamento";

type Item = { nome: string; quantidade: number; preco: number | null; opcao?: string | null; tamanho?: string | null; cor?: string | null; observacao?: string; foto?: string | null; personalizacao?: string | null };
type Pedido = {
  id: string; codigo: string; cliente_nome: string | null; cliente_whatsapp: string | null; itens: Item[]; total: number | null; desconto: number | null;
  status: string; criado_em: string; data_desejada: string | null; previsao_entrega: string | null; urgente: boolean; entrega: string | null; frete: number | null;
  nota_loja: string | null; pagamento_status: string | null; valor_pago: number | null; pagamento_forma: string | null; restante_quando: string | null; pagamento_obs: string | null;
  lojas: { nome: string; cor: string | null; logo_url: string | null; whatsapp: string | null; razao_social: string | null; documento: string | null; instagram: string | null; desconto_pix: number | null };
};

export default function Pagina() {
  return <Suspense fallback={null}><Folha /></Suspense>;
}

function Folha() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const m = useSearchParams().get("modo");
  const modo = m === "recibo" ? "recibo" : m === "etiqueta" ? "etiqueta" : m === "orcamento" ? "orcamento" : "producao";
  const [p, setP] = useState<Pedido | null | undefined>(undefined);
  const [qr, setQr] = useState("");
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabaseNavegador().from("pedidos").select("*, lojas(nome, cor, logo_url, whatsapp, razao_social, documento, instagram, desconto_pix)").eq("id", id).maybeSingle()
      .then(({ data }: { data: Pedido | null }) => setP(data));
  }, [id]);
  useEffect(() => {
    if (p) QRCode.toDataURL(`${window.location.origin}/pedido/${p.codigo}`, { margin: 1, width: 240 }).then(setQr);
  }, [p]);

  if (p === undefined) return <p className="p-8 opacity-60">Carregando...</p>;
  if (!p) return <p className="p-8">Pedido não encontrado (ou você não está logado no painel neste aparelho). <Link href="/admin" className="underline">Entrar</Link></p>;
  const cor = p.lojas.cor ?? "#333";
  const total = Number(p.total ?? 0), pago = Number(p.valor_pago ?? 0);
  const data = (d: string) => new Date(d).toLocaleDateString("pt-BR");
  const detalhe = (i: Item) => [i.opcao, i.tamanho, i.cor, i.personalizacao && `✍️ "${i.personalizacao}"`].filter(Boolean).join(" · ");

  // Recibo em IMAGEM (para mandar no WhatsApp)
  async function gerarImagem(compartilhar: boolean) {
    if (!p) return;
    const c = tela.current!; const ctx = c.getContext("2d")!;
    const L = 900, linhas = p.itens.length;
    c.width = L; c.height = 760 + linhas * 56;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = cor; ctx.fillRect(0, 0, L, 150);
    ctx.fillStyle = "#fff"; ctx.font = "bold 46px system-ui"; ctx.fillText(p.lojas.nome, 40, 80);
    ctx.font = "26px system-ui"; ctx.fillText(`RECIBO · Pedido #${p.codigo}`, 40, 122);
    let y = 210;
    ctx.fillStyle = "#1c1917"; ctx.font = "26px system-ui";
    ctx.fillText(`Cliente: ${p.cliente_nome ?? "—"}`, 40, y); y += 40;
    ctx.fillText(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 40, y); y += 50;
    ctx.fillStyle = "#e7e5e4"; ctx.fillRect(40, y, L - 80, 2); y += 40;
    ctx.fillStyle = "#1c1917";
    p.itens.forEach((i) => {
      ctx.font = "26px system-ui";
      const texto = `${i.quantidade}x ${i.nome}${detalhe(i) ? ` (${detalhe(i)})` : ""}`;
      ctx.fillText(texto.length > 46 ? `${texto.slice(0, 45)}…` : texto, 40, y);
      ctx.textAlign = "right"; ctx.fillText(i.preco != null ? formatarPreco(Number(i.preco) * i.quantidade) : "—", L - 40, y); ctx.textAlign = "left";
      y += 56;
    });
    ctx.fillStyle = "#e7e5e4"; ctx.fillRect(40, y - 20, L - 80, 2); y += 30;
    const linha = (rot: string, val: string, negrito = false, corTexto = "#1c1917") => {
      ctx.fillStyle = corTexto; ctx.font = `${negrito ? "bold " : ""}30px system-ui`;
      ctx.fillText(rot, 40, y); ctx.textAlign = "right"; ctx.fillText(val, L - 40, y); ctx.textAlign = "left"; y += 48;
    };
    if (p.frete) linha("Frete", formatarPreco(Number(p.frete)));
    linha("Total", formatarPreco(total), true);
    linha(`Pago${p.pagamento_forma ? ` (${rotuloDe(FORMAS_PAGAMENTO, p.pagamento_forma).replace(/^\S+\s/, "")})` : ""}`, formatarPreco(pago), true, "#15803d");
    if (total - pago > 0.009) linha(`Falta${p.restante_quando ? ` (${p.restante_quando})` : ""}`, formatarPreco(total - pago), true, "#b45309");
    else { ctx.fillStyle = "#15803d"; ctx.font = "bold 34px system-ui"; ctx.fillText("✓ PAGO", 40, y); y += 50; }
    y += 20;
    ctx.fillStyle = "#78716c"; ctx.font = "22px system-ui";
    if (p.lojas.razao_social) { ctx.fillText(`${p.lojas.razao_social}${p.lojas.documento ? ` · ${documentoBonito(p.lojas.documento)}` : ""}`, 40, y); y += 34; }
    ctx.fillText(`Acompanhe: ${window.location.origin.replace(/^https?:\/\//, "")}/pedido/${p.codigo}`, 40, y); y += 34;
    ctx.fillText("Obrigado pela preferência! 💜", 40, y);

    const blob: Blob = await new Promise((ok) => c.toBlob((b) => ok(b!), "image/png"));
    const arquivo = new File([blob], `recibo-${p.codigo}.png`, { type: "image/png" });
    if (compartilhar && navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], title: `Recibo #${p.codigo}` }).catch(() => {});
    } else {
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = arquivo.name; a.click();
    }
  }

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-stone-900 print:p-0">
      <style>{`@media print { .nao-imprimir { display: none !important; } @page { margin: 12mm; } body { background: white !important; } }`}</style>
      {/* Botões (não saem na impressão) */}
      <div className="nao-imprimir mb-6 flex flex-wrap gap-2">
        <Link href={`/admin/${slug}/pedidos?codigo=${p.codigo}`} className="rounded-full border px-4 py-2 text-sm">← Pedidos</Link>
        <Link href={`?modo=producao`} className="rounded-full border px-4 py-2 text-sm" style={modo === "producao" ? { background: cor, color: "white" } : {}}>🏷️ Folha de produção</Link>
        <Link href={`?modo=recibo`} className="rounded-full border px-4 py-2 text-sm" style={modo === "recibo" ? { background: cor, color: "white" } : {}}>🧾 Recibo</Link>
        <Link href={`?modo=orcamento`} className="rounded-full border px-4 py-2 text-sm" style={modo === "orcamento" ? { background: cor, color: "white" } : {}}>📝 Orçamento</Link>
        <Link href={`?modo=etiqueta`} className="rounded-full border px-4 py-2 text-sm" style={modo === "etiqueta" ? { background: cor, color: "white" } : {}}>📦 Etiqueta</Link>
        <button type="button" onClick={() => window.print()} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: cor }}>🖨️ Imprimir / salvar PDF</button>
        {modo === "recibo" && <>
          <button type="button" onClick={() => gerarImagem(true)} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white">📲 Recibo em imagem (compartilhar)</button>
          <button type="button" onClick={() => gerarImagem(false)} className="rounded-full border px-4 py-2 text-sm">⬇️ Baixar imagem</button>
        </>}
      </div>
      <canvas ref={tela} className="hidden" />

      {/* 📦 ETIQUETA DE ENVIO (cole na caixa) — o endereço você digita aqui mesmo */}
      {modo === "etiqueta" && (
        <div className="mx-auto max-w-md rounded-2xl border-4 border-dashed border-stone-800 p-5 text-stone-900">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">Destinatário</p>
          <p className="text-2xl font-bold">{p.cliente_nome ?? "Nome do cliente"}</p>
          {p.cliente_whatsapp && <p>📞 {telefoneBonito(p.cliente_whatsapp)}</p>}
          <div contentEditable suppressContentEditableWarning className="mt-2 min-h-20 rounded-lg border border-stone-300 p-2 text-lg outline-none focus:border-stone-800">
            Rua, número, bairro — cidade/UF — CEP
          </div>
          <p className="nao-imprimir mt-1 text-xs opacity-60">✏️ Toque no quadro acima para escrever o endereço antes de imprimir.</p>
          <div className="mt-4 flex items-end justify-between gap-3 border-t-2 border-stone-800 pt-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60">Remetente</p>
              <p className="font-bold">{p.lojas.nome}</p>
              {p.lojas.whatsapp && <p className="text-sm">📞 {telefoneBonito(p.lojas.whatsapp)}</p>}
              <p className="mt-2 text-sm">Pedido <b>#{p.codigo}</b> · {p.itens.reduce((s, i) => s + i.quantidade, 0)} item(ns)</p>
              {p.entrega && <p className="text-sm">🚚 {p.entrega}</p>}
            </div>
            {qr && <img src={qr} alt="" className="h-24 w-24" />}
          </div>
        </div>
      )}

      {modo !== "etiqueta" && (<>
      {/* Cabeçalho */}
      <header className="flex items-center gap-4 border-b-4 pb-3" style={{ borderColor: cor }}>
        {p.lojas.logo_url && <img src={p.lojas.logo_url} alt="" className="h-16 w-16 rounded-full object-cover" />}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{p.lojas.nome}</h1>
          <p className="text-sm opacity-70">{modo === "recibo" ? "RECIBO" : modo === "orcamento" ? "ORÇAMENTO" : "PEDIDO PARA PRODUÇÃO"} · <b>#{p.codigo}</b> · {data(p.criado_em)}</p>
        </div>
        {qr && <img src={qr} alt="QR do acompanhamento" className="h-24 w-24" />}
      </header>

      <section className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <p><b>👤 Cliente:</b> {p.cliente_nome ?? "—"}</p>
        <p><b>📲 WhatsApp:</b> {p.cliente_whatsapp ? telefoneBonito(p.cliente_whatsapp) : "—"}</p>
        {modo === "producao" && <p><b>Etapa:</b> {etapaDo(p.status)?.icone} {etapaDo(p.status)?.rotulo}</p>}
        {p.previsao_entrega && <p><b>📅 Previsão:</b> {data(`${p.previsao_entrega}T12:00`)}</p>}
        {p.data_desejada && <p><b>📅 Cliente quer para:</b> {data(`${p.data_desejada}T12:00`)}</p>}
        {p.entrega && <p><b>🚚 Entrega:</b> {p.entrega}</p>}
        {p.urgente && <p className="font-bold text-red-700">⚡ URGENTE</p>}
      </section>

      {/* Itens com foto */}
      <section className="mt-4 space-y-3">
        {p.itens.map((i, n) => (
          <div key={n} className="flex gap-4 rounded-xl border p-3" style={{ breakInside: "avoid" }}>
            {i.foto && <img src={i.foto} alt="" className={`${modo === "producao" ? "h-32 w-32" : "h-16 w-16"} shrink-0 rounded-lg object-cover`} />}
            <div className="flex-1">
              <p className={modo === "producao" ? "text-xl font-bold" : "font-semibold"}>{i.quantidade}x {i.nome}</p>
              {detalhe(i) && <p className="text-sm">{detalhe(i)}</p>}
              {i.observacao && <p className="mt-1 rounded bg-amber-50 p-2 text-sm">✏️ {i.observacao}</p>}
              {modo === "producao" && <p className="mt-2 text-sm">☐ Impresso &nbsp; ☐ Acabamento &nbsp; ☐ Conferido &nbsp; ☐ Embalado</p>}
            </div>
            {modo !== "producao" && <b>{i.preco != null ? formatarPreco(Number(i.preco) * i.quantidade) : "—"}</b>}
          </div>
        ))}
      </section>

      {modo === "orcamento" ? (
        <section className="mt-4 space-y-3 text-sm">
          <div className="rounded-xl border p-4">
            {p.frete ? <p className="flex justify-between"><span>Frete</span><span>{formatarPreco(Number(p.frete))}</span></p> : null}
            <p className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatarPreco(total)}</span></p>
            {p.lojas.desconto_pix ? <p className="flex justify-between font-semibold text-green-700"><span>⚡ No Pix / à vista (−{p.lojas.desconto_pix}%)</span><span>{formatarPreco(Math.round(total * (100 - p.lojas.desconto_pix)) / 100)}</span></p> : null}
            <p className="mt-1 flex justify-between"><span>💵 Sinal para iniciar (50%)</span><span>{formatarPreco(total / 2)}</span></p>
          </div>
          <div className="rounded-xl border p-4">
            <b>📌 Condições</b>
            <div contentEditable suppressContentEditableWarning className="mt-1 whitespace-pre-line outline-none">
              {"• 50% de sinal para iniciar a produção e o restante na entrega.\n• Prazo de produção combinado conforme a quantidade e o modelo.\n• Peças produzidas sob encomenda, em impressão 3D, podendo ser personalizadas.\n• Valores sujeitos a alteração caso o pedido mude."}
            </div>
          </div>
          <p>📅 <b>Orçamento válido até:</b> <span contentEditable suppressContentEditableWarning className="rounded border-b border-dashed px-1 outline-none">{new Date(Date.now() + 15 * 86400000).toLocaleDateString("pt-BR")}</span></p>
          <p className="nao-imprimir text-xs opacity-60">✏️ Condições e validade podem ser editadas aqui mesmo antes de imprimir/salvar o PDF.</p>
          {(p.lojas.razao_social || p.lojas.documento) && <p className="text-xs opacity-60">{p.lojas.razao_social}{p.lojas.documento ? ` · ${documentoBonito(p.lojas.documento)}` : ""}</p>}
        </section>
      ) : modo === "producao" ? (
        p.nota_loja && <p className="mt-4 rounded-xl border-l-4 p-3 text-sm" style={{ borderColor: cor }}><b>📝 Observações:</b> {p.nota_loja}</p>
      ) : (
        <section className="mt-4 rounded-xl border p-4 text-sm">
          {p.frete ? <p className="flex justify-between"><span>Frete</span><span>{formatarPreco(Number(p.frete))}</span></p> : null}
          <p className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatarPreco(total)}</span></p>
          <p className="flex justify-between font-semibold text-green-700"><span>Pago{p.pagamento_forma ? ` (${rotuloDe(FORMAS_PAGAMENTO, p.pagamento_forma)})` : ""}</span><span>{formatarPreco(pago)}</span></p>
          {total - pago > 0.009
            ? <p className="flex justify-between font-semibold text-amber-700"><span>Falta pagar{p.restante_quando ? ` (${p.restante_quando})` : ""}</span><span>{formatarPreco(total - pago)}</span></p>
            : <p className="mt-2 text-center text-xl font-bold text-green-700">✓ PAGO</p>}
          {p.pagamento_obs && <p className="mt-2 opacity-70">{p.pagamento_obs}</p>}
          {(p.lojas.razao_social || p.lojas.documento) && <p className="mt-3 text-xs opacity-60">{p.lojas.razao_social}{p.lojas.documento ? ` · ${documentoBonito(p.lojas.documento)}` : ""}</p>}
          <p className="mt-1 text-xs opacity-60">Emitido em {new Date().toLocaleString("pt-BR")} · Obrigado pela preferência! 💜</p>
        </section>
      )}
      </>)}
    </div>
  );
}
