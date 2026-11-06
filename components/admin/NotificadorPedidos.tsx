"use client";
// =====================================================================
// 🔔 AVISO DE PEDIDO NOVO — enquanto o painel estiver aberto (no PC ou no
// app MA Painel), confere a cada 40 segundos se chegou pedido. Se chegou:
// toca um "plim", mostra um aviso na tela e uma notificação do sistema.
// =====================================================================
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

function plim() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.4);
    });
  } catch {}
}

export default function NotificadorPedidos({ slug, cor }: { slug: string; cor: string }) {
  const [novos, setNovos] = useState(0);
  const [permissao, setPermissao] = useState<string>("default");
  const lojaId = useRef<string | null>(null);

  useEffect(() => {
    if ("Notification" in window) setPermissao(Notification.permission);
    const chave = `pedidos-vistos:${slug}`;
    if (!localStorage.getItem(chave)) localStorage.setItem(chave, new Date().toISOString());
    const conferir = async () => {
      const sb = supabaseNavegador();
      if (!lojaId.current) {
        const { data } = await sb.from("lojas").select("id").eq("slug", slug).maybeSingle();
        lojaId.current = data?.id ?? null;
        if (!lojaId.current) return;
      }
      const desde = localStorage.getItem(chave) ?? new Date().toISOString();
      const { count } = await sb.from("pedidos").select("id", { count: "exact", head: true }).eq("loja_id", lojaId.current).gt("criado_em", desde);
      if (count && count > 0) {
        setNovos((anterior) => {
          if (count > anterior) {
            plim();
            if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
              new Notification("🛒 Pedido novo!", { body: `Chegou ${count === 1 ? "um pedido novo" : `${count} pedidos novos`} na loja.`, icon: "/icones/icone-192.png" });
            }
          }
          return count;
        });
      }
    };
    conferir();
    const t = setInterval(conferir, 40000);
    return () => clearInterval(t);
  }, [slug]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = novos ? `(${novos}) ${base}` : base;
  }, [novos]);

  const marcarVistos = () => { localStorage.setItem(`pedidos-vistos:${slug}`, new Date().toISOString()); setNovos(0); };

  return (
    <>
      {novos > 0 && (
        <div className="balao fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl p-3 text-sm text-white shadow-2xl" style={{ background: cor }}>
          <span className="text-2xl">🔔</span>
          <span className="flex-1"><b>{novos === 1 ? "Pedido novo!" : `${novos} pedidos novos!`}</b></span>
          <Link href={`/admin/${slug}/pedidos`} onClick={marcarVistos} className="rounded-full bg-white px-3 py-1 font-semibold" style={{ color: cor }}>Ver</Link>
          <button type="button" onClick={marcarVistos} aria-label="Fechar" className="opacity-80">✕</button>
        </div>
      )}
      {permissao === "default" && "Notification" in globalThis && (
        <button type="button" onClick={async () => setPermissao(await Notification.requestPermission())} className="mb-3 w-full rounded-xl border border-dashed px-3 py-2 text-left text-xs">
          🔔 Ativar avisos de pedido novo neste aparelho (com o painel aberto)
        </button>
      )}
    </>
  );
}
