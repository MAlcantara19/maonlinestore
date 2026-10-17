// =====================================================================
// ESTATÍSTICAS — registra o que acontece na loja, de forma ANÔNIMA
// (sem nome, sem telefone). Vira gráficos na aba 📊 Estatísticas.
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";

export type TipoEvento = "visita_loja" | "visita_produto" | "carrinho_add" | "carrinho_remove" | "favorito" | "pedido" | "whatsapp";

// Manda o evento e segue a vida (não trava a tela se der erro)
export function registrarEvento(slug: string, tipo: TipoEvento, produtoId?: string | null) {
  try {
    supabaseNavegador().rpc("registrar_evento", { p_slug: slug, p_tipo: tipo, p_produto: produtoId ?? null }).then(() => {}, () => {});
  } catch {}
}
