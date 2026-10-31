// =====================================================================
// ESTATÍSTICAS — registra o que acontece na loja.
// Cada aparelho ganha um código ANÔNIMO ("Visitante #A3F2K9"), guardado
// só no próprio aparelho. Nome só aparece se a pessoa digitar no pedido.
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";

export type TipoEvento = "visita_loja" | "visita_produto" | "carrinho_add" | "carrinho_remove" | "favorito" | "pedido" | "whatsapp";

// Código anônimo deste aparelho (criado na primeira visita)
function visitante(): string | null {
  try {
    let id = localStorage.getItem("visitante-id");
    if (!id) {
      id = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem("visitante-id", id);
    }
    return id;
  } catch { return null; }
}

// "📱 Celular · Android", "💻 Computador · Windows"...
function aparelho(): string {
  const ua = navigator.userAgent;
  const tipo = /iPad|Tablet/i.test(ua) ? "📟 Tablet" : /Mobi|iPhone|Android/i.test(ua) ? "📱 Celular" : "💻 Computador";
  const sistema = /iPhone|iPad|Mac OS/i.test(ua) ? (/iPhone|iPad/i.test(ua) ? "iPhone" : "Mac") : /Android/i.test(ua) ? "Android" : /Windows/i.test(ua) ? "Windows" : "";
  return sistema ? `${tipo} · ${sistema}` : tipo;
}

// Manda o evento e segue a vida (não trava a tela se der erro)
export function registrarEvento(slug: string, tipo: TipoEvento, produtoId?: string | null, detalhe?: string | null) {
  try {
    supabaseNavegador().rpc("registrar_evento", {
      p_slug: slug, p_tipo: tipo, p_produto: produtoId ?? null,
      p_visitante: visitante(), p_aparelho: aparelho(), p_detalhe: detalhe ?? null,
    }).then(() => {}, () => {});
  } catch {}
}
