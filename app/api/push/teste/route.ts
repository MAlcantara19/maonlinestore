// =====================================================================
// 🔔 TESTE DE NOTIFICAÇÃO — o botão "Testar" do painel chama aqui e o
// servidor manda um aviso para os aparelhos de QUEM clicou.
// =====================================================================
import { NextResponse } from "next/server";
import { avisarUsuario, clienteSecreto, pushConfigurado } from "@/lib/push";

export async function POST(req: Request) {
  try {
    if (!pushConfigurado()) return NextResponse.json({ erro: "Faltam as chaves VAPID na Vercel (veja o LEIA-ME da atualização)." }, { status: 500 });
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ erro: "Entre no painel primeiro." }, { status: 401 });
    const { data } = await clienteSecreto().auth.getUser(token);
    if (!data.user) return NextResponse.json({ erro: "Entre no painel primeiro." }, { status: 401 });
    const enviados = await avisarUsuario(data.user.id, { titulo: "🔔 Teste de aviso", corpo: "Tudo certo! Os pedidos novos vão chegar assim 🎉", url: "/admin", tag: "teste" });
    return NextResponse.json({ ok: true, enviados });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
