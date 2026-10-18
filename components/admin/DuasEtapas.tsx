"use client";
// =====================================================================
// VERIFICAÇÃO EM DUAS ETAPAS (2FA) — em "Minha conta".
// Ativar: aparece um QR Code → escaneie com o Google Authenticator (ou
// Authy, Microsoft Authenticator) → digite o código de 6 números.
// Depois disso, todo login pede o código do celular além da senha.
// =====================================================================
import { useCallback, useEffect, useState } from "react";
import { Bloco, estiloInput } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";

type Fator = { id: string; status: string };

export default function DuasEtapas() {
  const [ativo, setAtivo] = useState<Fator | null>(null);
  const [cadastro, setCadastro] = useState<{ id: string; qr: string; segredo: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    const { data } = await supabaseNavegador().auth.mfa.listFactors();
    setAtivo(((data?.totp ?? []) as Fator[]).find((f) => f.status === "verified") ?? null);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function comecar() {
    setAviso("");
    const sb = supabaseNavegador();
    // Apaga cadastros antigos não concluídos (para não dar conflito)
    const { data: lista } = await sb.auth.mfa.listFactors();
    for (const f of ((lista?.all ?? []) as Fator[]).filter((f) => f.status !== "verified")) await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `MA Online Store ${Date.now()}` });
    if (error || !data) return setAviso(error?.message ?? "Não deu para começar.");
    setCadastro({ id: data.id, qr: data.totp.qr_code, segredo: data.totp.secret });
  }

  async function confirmar() {
    if (!cadastro) return;
    const { error } = await supabaseNavegador().auth.mfa.challengeAndVerify({ factorId: cadastro.id, code: codigo.trim() });
    if (error) return setAviso("Código errado ou vencido. Confira o relógio do celular e tente o código novo.");
    setCadastro(null); setCodigo(""); setAviso("✓ Verificação em duas etapas ativada!");
    carregar();
  }

  async function desativar() {
    if (!ativo || !confirm("Desativar a verificação em duas etapas? Sua conta fica protegida só pela senha.")) return;
    const { error } = await supabaseNavegador().auth.mfa.unenroll({ factorId: ativo.id });
    setAviso(error ? error.message : "Verificação em duas etapas desativada.");
    carregar();
  }

  return (
    <Bloco titulo="🛡️ Verificação em duas etapas (recomendado)">
      <p className="text-sm opacity-70">
        Além da senha, o login pede um código de 6 números que muda a cada 30 segundos no seu celular. Mesmo que alguém
        descubra sua senha, não entra sem o seu celular.
      </p>
      {ativo ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">✓ Ativada</span>
          <button type="button" onClick={desativar} className="rounded-lg border px-3 py-1.5 text-sm text-red-600">Desativar</button>
        </div>
      ) : cadastro ? (
        <div className="space-y-3">
          <ol className="ml-5 list-decimal text-sm">
            <li>Instale o <b>Google Authenticator</b> (ou Authy / Microsoft Authenticator) no celular.</li>
            <li>No app, toque em <b>+</b> e <b>escaneie o QR Code</b> abaixo.</li>
            <li>Digite o código de 6 números que aparecer no app.</li>
          </ol>
          <img src={cadastro.qr} alt="QR Code para o app autenticador" className="mx-auto h-48 w-48 rounded-xl bg-white p-2" />
          <p className="break-all text-center text-xs opacity-60">Não consegue escanear? Digite esta chave no app: <b className="font-mono">{cadastro.segredo}</b></p>
          <input className={estiloInput} inputMode="numeric" maxLength={6} placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} />
          <button type="button" onClick={confirmar} className="w-full rounded-xl bg-stone-900 p-3 font-semibold text-white">Confirmar e ativar</button>
        </div>
      ) : (
        <button type="button" onClick={comecar} className="w-full rounded-xl bg-stone-900 p-3 font-semibold text-white">🛡️ Ativar verificação em duas etapas</button>
      )}
      {aviso && <p className="text-sm">{aviso}</p>}
    </Bloco>
  );
}
