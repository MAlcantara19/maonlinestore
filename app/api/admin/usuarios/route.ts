// =====================================================================
// API DOS ADMINISTRADORES (só o master usa) — roda NO SERVIDOR.
// Usa a chave SECRETA do Supabase (SUPABASE_SECRET_KEY), que só existe
// no servidor e nunca vai para o navegador. Ela permite criar contas.
//
//   GET  → lista os administradores (e-mail, lojas, se é master)
//   POST → { acao: "criar" | "lojas" | "senha" | "master" | "remover", ... }
//
// Toda chamada confere, pelo login de quem pediu, se a pessoa é master.
// =====================================================================
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function clienteAdmin() {
  const segredo = process.env.SUPABASE_SECRET_KEY;
  if (!segredo) throw new Error("Falta SUPABASE_SECRET_KEY no .env.local (e na Vercel).");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, segredo, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Confere o "crachá" (token) de quem chamou e se é master. Devolve o id ou null.
async function exigirMaster(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const sb = clienteAdmin();
  const { data } = await sb.auth.getUser(token);
  if (!data.user) return null;
  const { data: master } = await sb.from("master_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return master ? data.user.id : null;
}

const negado = () => NextResponse.json({ erro: "Só o administrador master pode fazer isso." }, { status: 403 });

export async function GET(req: Request) {
  try {
    if (!(await exigirMaster(req))) return negado();
    const sb = clienteAdmin();
    const [{ data: usuarios }, { data: masters }, { data: lojas }] = await Promise.all([
      sb.auth.admin.listUsers({ perPage: 1000 }),
      sb.from("master_admins").select("user_id"),
      sb.from("loja_admins").select("user_id, loja_id"),
    ]);
    const lista = (usuarios?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      master: (masters ?? []).some((m) => m.user_id === u.id),
      lojas: (lojas ?? []).filter((l) => l.user_id === u.id).map((l) => l.loja_id),
      ultimoAcesso: u.last_sign_in_at ?? null,
    }));
    return NextResponse.json({ usuarios: lista });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const eu = await exigirMaster(req);
    if (!eu) return negado();
    const sb = clienteAdmin();
    const corpo = await req.json();

    // Troca as lojas de um administrador
    const definirLojas = async (userId: string, lojas: string[]) => {
      await sb.from("loja_admins").delete().eq("user_id", userId);
      if (lojas.length) {
        const { error } = await sb.from("loja_admins").insert(lojas.map((loja_id) => ({ user_id: userId, loja_id })));
        if (error) throw error;
      }
    };

    switch (corpo.acao) {
      case "criar": {
        const { data, error } = await sb.auth.admin.createUser({ email: corpo.email, password: corpo.senha, email_confirm: true });
        if (error) throw error;
        await definirLojas(data.user.id, corpo.lojas ?? []);
        if (corpo.master) await sb.from("master_admins").insert({ user_id: data.user.id });
        break;
      }
      case "lojas":
        await definirLojas(corpo.userId, corpo.lojas ?? []);
        break;
      case "senha": {
        const { error } = await sb.auth.admin.updateUserById(corpo.userId, { password: corpo.senha });
        if (error) throw error;
        break;
      }
      case "master":
        if (corpo.userId === eu && !corpo.master) throw new Error("Você não pode tirar o seu próprio acesso de master.");
        if (corpo.master) await sb.from("master_admins").upsert({ user_id: corpo.userId });
        else await sb.from("master_admins").delete().eq("user_id", corpo.userId);
        break;
      case "remover": {
        if (corpo.userId === eu) throw new Error("Você não pode remover a sua própria conta.");
        const { error } = await sb.auth.admin.deleteUser(corpo.userId);
        if (error) throw error;
        break;
      }
      default:
        throw new Error("Ação desconhecida.");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ erro: (e as Error).message }, { status: 400 });
  }
}
