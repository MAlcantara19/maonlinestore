"use client";
// =====================================================================
// PAINEL — MINHA CONTA (endereço: /admin/conta) · qualquer administrador
// Trocar a própria senha (ex.: depois de receber a senha provisória).
// =====================================================================
import Link from "next/link";
import { useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import { Bloco, Campo, estiloInput } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";

export default function MinhaConta() {
  return <AreaAdmin>{(info) => <Formulario email={info.email} />}</AreaAdmin>;
}

function Formulario({ email }: { email: string }) {
  const [senha, setSenha] = useState("");
  const [repetir, setRepetir] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  async function trocar() {
    if (senha.length < 6) return setAviso({ tipo: "erro", texto: "A senha precisa ter pelo menos 6 caracteres." });
    if (senha !== repetir) return setAviso({ tipo: "erro", texto: "As duas senhas não estão iguais." });
    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    setAviso(error ? { tipo: "erro", texto: error.message } : { tipo: "ok", texto: "✓ Senha trocada!" });
    if (!error) { setSenha(""); setRepetir(""); }
  }

  return (
    <>
      <Link href="/admin" className="text-sm opacity-60">← Painel</Link>
      <h1 className="mt-1 mb-4 text-2xl font-bold">👤 Minha conta</h1>
      <Bloco titulo={`🔑 Trocar senha · ${email}`}>
        <Campo rotulo="Nova senha"><input type="password" className={estiloInput} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" /></Campo>
        <Campo rotulo="Repita a nova senha"><input type="password" className={estiloInput} value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" /></Campo>
        {aviso && <p className={`text-sm ${aviso.tipo === "ok" ? "text-green-700" : "text-red-600"}`}>{aviso.texto}</p>}
        <button type="button" onClick={trocar} className="w-full rounded-xl bg-stone-900 p-3 font-semibold text-white">Trocar senha</button>
      </Bloco>
    </>
  );
}
