// =====================================================================
// 🔔 Depois de mudar a etapa de um pedido no painel: avisa o cliente
// (push) e confere estoque baixo / meta do mês. Não trava nada se falhar.
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";

export async function avisarMudancaDoPedido(pedidoId: string) {
  try {
    const { data: { session } } = await supabaseNavegador().auth.getSession();
    if (!session) return;
    await fetch("/api/push/status", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ pedidoId }), keepalive: true });
  } catch {}
}
