// =====================================================================
// 🤖 Chama o assistente de IA (app/api/admin/ia) a partir do painel.
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";

export type TipoIA = "descricao" | "legenda" | "resposta" | "nomes" | "catalogo" | "livre";

export async function pedirIA(slug: string, tipo: TipoIA, entrada: Record<string, string>): Promise<string> {
  const { data: { session } } = await supabaseNavegador().auth.getSession();
  const r = await fetch("/api/admin/ia", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
    body: JSON.stringify({ slug, tipo, entrada }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro ?? "O assistente não respondeu.");
  return j.texto as string;
}
