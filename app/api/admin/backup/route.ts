// =====================================================================
// BACKUP — baixa um arquivo com TODOS os dados do site (só o master).
// Roda no servidor com a chave secreta. Guarde o arquivo num lugar
// seguro (Google Drive, por exemplo). Faça uma vez por semana.
// =====================================================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const TABELAS = [
  "site_config", "lojas", "categorias", "colecoes", "produtos", "variacoes", "midias", "produtos_colecoes",
  "produtos_categorias", "opcoes_loja", "cupons", "efeitos_personalizados", "avaliacoes", "parceiros",
  "pedidos", "master_admins", "loja_admins", "historico",
];

export async function GET(req: Request) {
  try {
    const segredo = process.env.SUPABASE_SECRET_KEY;
    if (!segredo) throw new Error("Falta SUPABASE_SECRET_KEY.");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, segredo, { auth: { persistSession: false, autoRefreshToken: false } });

    // Só o master pode baixar
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: quem } = token ? await sb.auth.getUser(token) : { data: { user: null } };
    if (!quem.user) return NextResponse.json({ erro: "Faça login." }, { status: 401 });
    const { data: master } = await sb.from("master_admins").select("user_id").eq("user_id", quem.user.id).maybeSingle();
    if (!master) return NextResponse.json({ erro: "Só o master pode baixar o backup." }, { status: 403 });

    // Lê tabela por tabela (em páginas de 1000 linhas)
    const dados: Record<string, unknown[]> = {};
    for (const t of TABELAS) {
      const linhas: unknown[] = [];
      for (let de = 0; ; de += 1000) {
        const { data, error } = await sb.from(t).select("*").range(de, de + 999);
        if (error) { dados[`${t}__erro`] = [error.message]; break; }
        linhas.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      dados[t] = linhas;
    }

    const hoje = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify({ gerado_em: new Date().toISOString(), tabelas: dados }, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="backup-maonlinestore-${hoje}.json"` },
    });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
