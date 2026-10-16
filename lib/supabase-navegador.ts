// =====================================================================
// CONEXÃO COM O BANCO PELO NAVEGADOR — usada no painel de administração.
// Guarda o login da pessoa (sessão). As regras de segurança do banco
// (RLS) garantem que cada um só altera o que tem permissão.
// =====================================================================
import { createBrowserClient } from "@supabase/ssr";

let cliente: ReturnType<typeof createBrowserClient> | null = null;

// Cria a conexão uma vez só e reaproveita.
export function supabaseNavegador() {
  if (!cliente) {
    cliente = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return cliente;
}
