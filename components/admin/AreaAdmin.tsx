"use client";
// =====================================================================
// ÁREA DO ADMINISTRADOR — "porteiro" do painel.
//   - Sem login: mostra a tela de entrar (e-mail e senha).
//   - Com login: mostra o topo do painel (com "Sair") e o conteúdo.
// Também descobre se a pessoa é MASTER (pode mexer em todas as lojas).
// =====================================================================
import BotaoTema from "@/components/BotaoTema";
import EstilosAnimacao from "@/components/EstilosAnimacao";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

export type InfoAdmin = { userId: string; email: string; master: boolean };

export default function AreaAdmin({ children }: { children: (info: InfoAdmin) => ReactNode }) {
  const [estado, setEstado] = useState<"carregando" | "deslogado" | "logado">("carregando");
  const [info, setInfo] = useState<InfoAdmin | null>(null);

  // Lê quem está logado e se é master.
  async function carregar() {
    const supabase = supabaseNavegador();
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setEstado("deslogado"); setInfo(null); return; }
    const { data: master } = await supabase.from("master_admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
    setInfo({ userId: data.user.id, email: data.user.email ?? "", master: !!master });
    setEstado("logado");
  }

  useEffect(() => {
    carregar();
    // Quando entrar ou sair, recarrega (o setTimeout evita travar o Supabase)
    const { data } = supabaseNavegador().auth.onAuthStateChange(() => { setTimeout(carregar, 0); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (estado === "carregando") return <p className="p-8 text-center opacity-60">Carregando painel...</p>;
  if (estado === "deslogado" || !info) return <TelaDeLogin />;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <EstilosAnimacao />
      <header className="bg-stone-900 text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex-1 font-bold">⚙️ Painel · MA Online Store</Link>
          <Link href="/admin/conta" className="hidden text-xs opacity-70 hover:underline sm:inline">👤 {info.email}{info.master ? " · master" : ""}</Link>
          <BotaoTema className="rounded-full bg-white/15 px-2.5 py-1.5 text-sm" />
          <button type="button" onClick={() => supabaseNavegador().auth.signOut()} className="rounded-full bg-white/15 px-3 py-1.5 text-sm">
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children(info)}</main>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tela de login (e-mail e senha cadastrados no Supabase > Authentication)
// ---------------------------------------------------------------------
function TelaDeLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro("");
    const { error } = await supabaseNavegador().auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha incorretos.");
    setEntrando(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4 text-stone-900">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold">⚙️ Painel de administração</h1>
        <p className="mb-5 text-sm opacity-60">MA Online Store</p>
        <label className="block text-sm font-semibold" htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 mb-3 w-full rounded-lg border px-3 py-2" autoComplete="email" />
        <label className="block text-sm font-semibold" htmlFor="senha">Senha</label>
        <input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2" autoComplete="current-password" />
        {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
        <button type="submit" disabled={entrando} className="mt-5 w-full rounded-xl bg-stone-900 p-3 font-semibold text-white disabled:opacity-50">
          {entrando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
