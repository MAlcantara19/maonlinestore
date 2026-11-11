"use client";
// =====================================================================
// 📸 FOTOS DA PRODUÇÃO (no pedido) — suba fotos da peça sendo feita ou
// pronta. O cliente vê no acompanhamento, e dá para avisar no WhatsApp.
// =====================================================================
import { useRef, useState } from "react";
import { enviarArquivo } from "@/lib/upload";
import { linkWhatsApp } from "@/lib/whatsapp";

export default function FotosProducao({ fotos, pasta, codigo, cliente, whatsapp, loja, aoMudar }: {
  fotos: string[]; pasta: string; codigo: string; cliente: string | null; whatsapp: string | null; loja: string; aoMudar: (fotos: string[]) => Promise<void>;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function subir(lista: FileList | null) {
    if (!lista?.length) return;
    setEnviando(true);
    const novas: string[] = [];
    for (const a of Array.from(lista)) { try { novas.push((await enviarArquivo(a, pasta)).url); } catch {} }
    await aoMudar([...fotos, ...novas]);
    setEnviando(false);
    if (entrada.current) entrada.current.value = "";
    if (novas.length && whatsapp && confirm("Avisar o cliente no WhatsApp que tem foto nova da peça?")) {
      const numero = whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp;
      window.open(linkWhatsApp(numero, `Oi${cliente ? `, ${cliente.split(" ")[0]}` : ""}! 😍 Olha a sua peça (pedido *#${codigo}*, ${loja}) — tem foto nova no acompanhamento:\n🔗 ${window.location.origin}/pedido/${codigo}`), "_blank");
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-dashed p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <b>📸 Fotos da produção</b>
        <button type="button" onClick={() => entrada.current?.click()} className="rounded-full border px-3 py-1 text-xs">{enviando ? "Enviando..." : "+ Foto"}</button>
        <span className="text-xs opacity-60">o cliente vê no acompanhamento</span>
      </div>
      {fotos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {fotos.map((f) => (
            <span key={f} className="relative h-16 w-16 overflow-hidden rounded-lg">
              <img src={f} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => aoMudar(fotos.filter((x) => x !== f))} className="absolute right-0 top-0 rounded-bl bg-white/90 px-1 text-xs text-red-600" aria-label="Tirar">✕</button>
            </span>
          ))}
        </div>
      )}
      <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={(e) => subir(e.target.files)} />
    </div>
  );
}
