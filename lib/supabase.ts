// =====================================================================
// CONEXÃO COM O BANCO (Supabase) — LEITURA PÚBLICA
// Usada pelas páginas que qualquer visitante vê (página inicial, lojas).
// As chaves vêm do arquivo .env.local. NUNCA escreva chaves direto no código.
// =====================================================================
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Se esquecer de preencher o .env.local, o erro já diz o que falta.
if (!url || !chave) {
  throw new Error(
    "Faltam as variáveis do Supabase no .env.local (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
  );
}

// persistSession: false = aqui ninguém faz login; é só para ler o catálogo.
// O login dos administradores vai ter uma conexão própria, mais para frente.
export const supabase = createClient(url, chave, {
  // storageKey próprio: não "briga" com a conexão do painel no navegador
  auth: { persistSession: false, autoRefreshToken: false, storageKey: "ma-publico" },
  // cache: "no-store" = sempre pede os dados atualizados ao banco,
  // em vez de reaproveitar uma resposta guardada.
  global: {
    fetch: (endereco, opcoes) => fetch(endereco, { ...opcoes, cache: "no-store" }),
  },
});
