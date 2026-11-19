"use client";
// =====================================================================
// 🔔 AVISOS NO CELULAR (push de verdade) — liga neste aparelho e os
// pedidos novos chegam como notificação, MESMO com o painel fechado e a
// tela bloqueada.
//   Android/PC: funciona direto no Chrome/Edge.
//   iPhone: primeiro instale o "MA Painel" (Compartilhar → Adicionar à
//   Tela de Início), abra por ele e ative aqui (iOS 16.4 ou mais novo).
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

const CHAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// A chave pública vem em "base64 de URL"; o navegador quer bytes
function bytesDaChave(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

type Estado = "carregando" | "sem-suporte" | "iphone" | "desligado" | "ligado" | "bloqueado" | "sem-chave";

export default function AtivarPush({ cor }: { cor: string }) {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (!CHAVE) return setEstado("sem-chave");
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const instalado = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setEstado(ios && !instalado ? "iphone" : "sem-suporte");
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const inscricao = await reg.pushManager.getSubscription();
      setEstado(inscricao ? "ligado" : "desligado");
    })().catch(() => setEstado("sem-suporte"));
  }, []);

  async function ligar() {
    setMsg("");
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") return setEstado(permissao === "denied" ? "bloqueado" : "desligado");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const inscricao = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesDaChave(CHAVE) }));
      const j = inscricao.toJSON();
      const sb = supabaseNavegador();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Entre no painel primeiro.");
      const { error } = await sb.from("push_inscricoes").upsert({
        user_id: user.id, endpoint: j.endpoint!, p256dh: j.keys!.p256dh, auth: j.keys!.auth,
        aparelho: navigator.userAgent.slice(0, 120),
      }, { onConflict: "endpoint" });
      if (error) throw new Error(error.message.includes("push_inscricoes") ? "Rode a atualização 31 no Supabase." : error.message);
      setEstado("ligado");
      setMsg("✅ Pronto! Toque em “Testar” para ver como chega.");
    } catch (e) { setMsg(`😕 ${(e as Error).message}`); }
  }

  async function desligar() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const inscricao = await reg?.pushManager.getSubscription();
    if (inscricao) {
      await supabaseNavegador().from("push_inscricoes").delete().eq("endpoint", inscricao.endpoint);
      await inscricao.unsubscribe();
    }
    setEstado("desligado"); setMsg("Avisos desligados neste aparelho.");
  }

  async function testar() {
    setMsg("Enviando...");
    const { data: { session } } = await supabaseNavegador().auth.getSession();
    const r = await fetch("/api/push/teste", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? (j.enviados ? "📨 Enviado! Deve chegar em segundos." : "Nenhum aparelho ligado ainda.") : `😕 ${j.erro ?? "Não deu certo."}`);
  }

  if (estado === "carregando" || estado === "sem-chave") return null;
  return (
    <div className="mb-3 rounded-xl border border-dashed px-3 py-2 text-xs">
      {estado === "ligado" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex-1">🔔 <b>Avisos de pedido ligados</b> neste aparelho (chegam mesmo com o painel fechado)</span>
          <button type="button" onClick={testar} className="rounded-full px-3 py-1 font-semibold text-white" style={{ background: cor }}>Testar</button>
          <button type="button" onClick={desligar} className="rounded-full border px-3 py-1">Desligar</button>
        </div>
      )}
      {estado === "desligado" && (
        <button type="button" onClick={ligar} className="w-full text-left">🔔 <b>Ativar avisos de pedido no celular</b> — chegam até com a tela bloqueada</button>
      )}
      {estado === "bloqueado" && <p>🔕 As notificações estão bloqueadas neste navegador. Libere em: cadeado ao lado do endereço → Notificações → Permitir.</p>}
      {estado === "iphone" && <p>📱 No iPhone: toque em Compartilhar → <b>Adicionar à Tela de Início</b>, abra o <b>MA Painel</b> por lá e ative os avisos.</p>}
      {estado === "sem-suporte" && <p>Este navegador não recebe avisos. Use o Chrome (Android/PC) ou o app MA Painel no iPhone.</p>}
      {msg && <p className="mt-1 opacity-80">{msg}</p>}
    </div>
  );
}
