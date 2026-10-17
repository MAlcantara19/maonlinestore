"use client";
// =====================================================================
// NOVA SENHA (endereço: /admin/nova-senha) — onde a pessoa cai ao clicar
// no link do e-mail "Esqueci minha senha". Ela digita a nova senha e pronto.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

export default function NovaSenha() {
  const [pronto, setPronto] = useState<"verificando" | "ok" | "invalido">("verificando");
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [aviso, setAviso] = useState("");
  const [feito, setFeito] = useState(false);

  // O link do e-mail traz um código: troca por uma sessão (login temporário)
  useEffect(() => {
    (async () => {
      const supabase = supabaseNavegador();
      const codigo = new URLSearchParams(window.location.search).get("code");
      if (codigo) await supabase.auth.exchangeCodeForSession(codigo).catch(() => null);
      const { data } = await supabase.auth.getSession();
      setPronto(data.session ? "ok" : "invalido");
    })();
  }, []);

  async function salvar() {
    if (senha.length < 6) return setAviso("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== repetir) return setAviso("As duas senhas não estão iguais.");
    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    if (error) return setAviso(error.message);
    setFeito(true);
  }

  const campo = "mt-1 mb-3 w-full rounded-lg border px-3 py-2";
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4 text-stone-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-4 text-xl font-bold">🔑 Criar nova senha</h1>
        {pronto === "verificando" && <p className="opacity-60">Conferindo o link...</p>}
        {pronto === "invalido" && <p>Este link expirou ou já foi usado. Peça outro em <Link href="/admin" className="underline">Esqueci minha senha</Link>.</p>}
        {pronto === "ok" && !feito && (
          <>
            <label className="block text-sm font-semibold">Nova senha<input type="password" className={campo} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" /></label>
            <label className="block text-sm font-semibold">Repita a senha<input type="password" className={campo} value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" /></label>
            {aviso && <p className="mb-2 text-sm text-red-600">{aviso}</p>}
            <button type="button" onClick={salvar} className="w-full rounded-xl bg-stone-900 p-3 font-semibold text-white">Salvar nova senha</button>
          </>
        )}
        {feito && <p>✓ Senha trocada! <Link href="/admin" className="font-semibold underline">Entrar no painel →</Link></p>}
      </div>
    </div>
  );
}
