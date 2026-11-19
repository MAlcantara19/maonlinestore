"use client";
// =====================================================================
// 🔔 "ME AVISE QUANDO O PEDIDO ANDAR" — no acompanhamento do pedido.
// O cliente toca uma vez e recebe notificação a cada etapa:
// aceito, em produção, pronto, 🚚 saiu para entrega, entregue.
// (iPhone: só funciona com o site adicionado à Tela de Início.)
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

const CHAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const bytes = (b64: string) => { const pad = "=".repeat((4 - (b64.length % 4)) % 4); return Uint8Array.from(atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)); };

export default function AvisarMeuPedido({ codigo, cor }: { codigo: string; cor: string }) {
  const [estado, setEstado] = useState<"" | "pode" | "ligado" | "iphone" | "bloqueado">("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!CHAVE) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setEstado(ios ? "iphone" : "");
    if (Notification.permission === "denied") return setEstado("bloqueado");
    try { if (localStorage.getItem(`push-pedido:${codigo}`)) return setEstado("ligado"); } catch {}
    setEstado("pode");
  }, [codigo]);

  async function ligar() {
    try {
      if ((await Notification.requestPermission()) !== "granted") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes(CHAVE) }));
      const j = sub.toJSON();
      const { data, error } = await supabaseNavegador().rpc("inscrever_push_pedido", { p_codigo: codigo, p_endpoint: j.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth });
      if (error || !data) throw new Error("não deu para ativar agora");
      try { localStorage.setItem(`push-pedido:${codigo}`, "1"); } catch {}
      setEstado("ligado"); setMsg("");
    } catch (e) { setMsg(`😕 ${(e as Error).message}`); }
  }

  if (!estado) return null;
  return (
    <div className="mb-5 rounded-2xl border p-3 text-sm" style={{ borderColor: `${cor}55` }}>
      {estado === "pode" && (
        <button type="button" onClick={ligar} className="w-full rounded-xl px-4 py-2.5 font-semibold text-white" style={{ background: cor }}>
          🔔 Me avise quando o pedido andar
        </button>
      )}
      {estado === "ligado" && <p>🔔 <b>Avisos ligados!</b> Você recebe uma notificação a cada etapa — inclusive quando sair para entrega 🚚.</p>}
      {estado === "iphone" && <p>📱 Para receber avisos no iPhone: toque em Compartilhar → <b>Adicionar à Tela de Início</b> e abra o pedido por lá.</p>}
      {estado === "bloqueado" && <p className="opacity-70">🔕 As notificações estão bloqueadas neste navegador.</p>}
      {msg && <p className="mt-1 text-xs">{msg}</p>}
    </div>
  );
}
