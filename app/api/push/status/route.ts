// =====================================================================
// 🔔 MUDOU A ETAPA DO PEDIDO — o painel chama aqui depois de salvar.
// O servidor confere se quem pediu cuida da loja e:
//   1. avisa o CLIENTE (se ele ativou os avisos no acompanhamento)
//   2. confere ⚠️ estoque baixo e 🎯 meta do mês (avisa a loja)
// =====================================================================
import { NextResponse } from "next/server";
import { avisarCliente, clienteSecreto, conferirEstoque, conferirMeta, pushConfigurado } from "@/lib/push";
import { etapaDo } from "@/lib/statusPedido";

export async function POST(req: Request) {
  try {
    if (!pushConfigurado()) return NextResponse.json({ ok: false, motivo: "push não configurado" });
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { pedidoId } = (await req.json()) as { pedidoId?: string };
    if (!token || !pedidoId) return NextResponse.json({ ok: false }, { status: 400 });
    const sb = clienteSecreto();
    const { data: quem } = await sb.auth.getUser(token);
    if (!quem.user) return NextResponse.json({ ok: false }, { status: 401 });

    const { data: pedido } = await sb.from("pedidos").select("id, codigo, status, loja_id, lojas(nome)").eq("id", pedidoId).maybeSingle();
    if (!pedido) return NextResponse.json({ ok: false }, { status: 404 });
    const [{ data: dono }, { data: master }] = await Promise.all([
      sb.from("loja_admins").select("user_id").eq("user_id", quem.user.id).eq("loja_id", pedido.loja_id).maybeSingle(),
      sb.from("master_admins").select("user_id").eq("user_id", quem.user.id).maybeSingle(),
    ]);
    if (!dono && !master) return NextResponse.json({ ok: false }, { status: 403 });

    const etapa = etapaDo(pedido.status as string);
    const loja = (pedido as unknown as { lojas: { nome: string } }).lojas.nome;
    const enviados = await avisarCliente(pedido.id as string, {
      titulo: `${etapa?.icone ?? "📦"} Pedido #${pedido.codigo} · ${loja}`,
      corpo: `${(etapa?.aviso ?? pedido.status).replace(/\*/g, "")}`.replace(/^./, (c) => c.toUpperCase()),
      url: `/pedido/${pedido.codigo}`,
      tag: `meu-pedido-${pedido.codigo}`,
    });
    await Promise.all([conferirEstoque(pedido.id as string), conferirMeta(pedido.loja_id as string)]).catch(() => {});
    return NextResponse.json({ ok: true, enviados });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: (e as Error).message }, { status: 500 });
  }
}
