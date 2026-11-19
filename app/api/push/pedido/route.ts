// =====================================================================
// 🔔 AVISO DE PEDIDO NOVO — o carrinho chama aqui logo depois de salvar
// o pedido. O servidor confere no banco se o pedido existe, se é recente
// (até 10 min) e se ainda não foi avisado — só então manda o push para
// os aparelhos de quem cuida da loja. (Ninguém consegue "inventar" aviso.)
// =====================================================================
import { NextResponse } from "next/server";
import { avisarLoja, clienteSecreto, conferirMeta, pushConfigurado } from "@/lib/push";
import { formatarPreco } from "@/lib/formato";

export async function POST(req: Request) {
  try {
    if (!pushConfigurado()) return NextResponse.json({ ok: false, motivo: "push não configurado" });
    const { codigo } = (await req.json()) as { codigo?: string };
    if (!codigo || !/^[A-Z0-9]{4,10}$/.test(codigo)) return NextResponse.json({ ok: false }, { status: 400 });
    const sb = clienteSecreto();
    const dezMin = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    // Marca como avisado e já devolve os dados (se outro pedido de aviso chegar junto, só um passa)
    const { data: pedido } = await sb.from("pedidos").update({ push_avisado: true })
      .eq("codigo", codigo).eq("push_avisado", false).gt("criado_em", dezMin)
      .select("codigo, loja_id, tipo, total, cliente_nome, urgente, itens, lojas(slug, nome)").maybeSingle();
    if (!pedido) return NextResponse.json({ ok: false });
    const p = pedido as unknown as { codigo: string; loja_id: string; tipo: string; total: number | null; cliente_nome: string | null; urgente: boolean; itens: { quantidade?: number }[] | null; lojas: { slug: string; nome: string } };
    const qtd = (p.itens ?? []).reduce((s, i) => s + (Number(i.quantidade) || 1), 0);
    const enviados = await avisarLoja(p.loja_id, {
      titulo: `${p.urgente ? "⚡ URGENTE · " : ""}${p.tipo === "orcamento" ? "💬 Orçamento" : "🛒 Pedido"} novo · ${p.lojas.nome}`,
      corpo: [`#${p.codigo}`, p.cliente_nome, qtd ? `${qtd} ${qtd === 1 ? "item" : "itens"}` : null, p.total ? formatarPreco(Number(p.total)) : null].filter(Boolean).join(" · "),
      url: `/admin/${p.lojas.slug}/pedidos`,
      tag: `pedido-${p.codigo}`,
    });
    await conferirMeta(p.loja_id).catch(() => {}); // 🎯 esse pedido fez bater a meta do mês?
    return NextResponse.json({ ok: true, enviados });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: (e as Error).message }, { status: 500 });
  }
}
