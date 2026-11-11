"use client";
// =====================================================================
// ✍️ EDITOR DA PERSONALIZAÇÃO (cadastro do produto) — escolha onde o
// texto do cliente aparece na foto, o tamanho, a cor e a fonte, com prévia.
// =====================================================================
import { useState } from "react";
import type { Personalizacao } from "@/lib/tipos";
import { OPCOES_FONTE } from "@/lib/opcoes";
import { FONTES, familiaDa } from "@/lib/fontes";

const PADRAO: Personalizacao = { rotulo: "Nome para personalizar", x: 50, y: 70, cor: "#ffffff", tamanho: 9, fonte: "moderna", max: 20, contorno: true };

export default function EditorPersonalizacao({ valor, aoMudar, foto }: { valor: Personalizacao | null; aoMudar: (v: Personalizacao | null) => void; foto: string | null }) {
  const [exemplo, setExemplo] = useState("Maria");
  const v = valor ?? PADRAO;
  const mudar = (c: Partial<Personalizacao>) => aoMudar({ ...v, ...c });
  const link = v.fonte ? FONTES[v.fonte]?.link : null;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={!!valor} onChange={(e) => aoMudar(e.target.checked ? PADRAO : null)} /> Este produto pode ser personalizado com texto (nome, idade...)
      </label>
      {valor && (
        <div className="grid gap-4 md:grid-cols-2">
          {link && <link rel="stylesheet" href={link} />}
          {/* Prévia: clique na foto para posicionar o texto */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-200" style={{ containerType: "inline-size", cursor: "crosshair" }}
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); mudar({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) }); }}>
              {foto ? <img src={foto} alt="" className="h-full w-full object-contain" /> : <span className="flex h-full items-center justify-center text-sm opacity-60">Suba uma foto do produto</span>}
              <span className="pointer-events-none absolute whitespace-nowrap font-bold"
                style={{ left: `${v.x}%`, top: `${v.y}%`, transform: "translate(-50%, -50%)", color: v.cor, fontSize: `${v.tamanho}cqi`, fontFamily: familiaDa(v.fonte),
                  textShadow: v.contorno === false ? "none" : "0 0 3px rgba(0,0,0,.55), 0 2px 6px rgba(0,0,0,.35)" }}>{exemplo}</span>
            </div>
            <p className="mt-1 text-xs opacity-60">👆 Toque na foto onde o texto deve ficar.</p>
          </div>
          <div className="space-y-2 text-sm">
            <label className="block font-semibold">Pergunta para o cliente<input className="mt-1 w-full rounded-lg border px-3 py-2" value={v.rotulo} onChange={(e) => mudar({ rotulo: e.target.value })} /></label>
            <label className="block font-semibold">Texto de exemplo (só para testar)<input className="mt-1 w-full rounded-lg border px-3 py-2" value={exemplo} onChange={(e) => setExemplo(e.target.value)} /></label>
            <label className="block">Tamanho: <b>{v.tamanho}</b><input type="range" min={3} max={25} value={v.tamanho} onChange={(e) => mudar({ tamanho: Number(e.target.value) })} className="block w-full" /></label>
            <div className="flex flex-wrap items-center gap-2">
              Cor: <input type="color" value={v.cor} onChange={(e) => mudar({ cor: e.target.value })} className="h-8 w-12 rounded" />
              <label className="flex items-center gap-1"><input type="checkbox" checked={v.contorno !== false} onChange={(e) => mudar({ contorno: e.target.checked })} /> sombra (ajuda a ler)</label>
            </div>
            <label className="block font-semibold">Fonte
              <select className="mt-1 w-full rounded-lg border px-3 py-2" value={v.fonte ?? "moderna"} onChange={(e) => mudar({ fonte: e.target.value })}>
                {OPCOES_FONTE.map((f) => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
              </select>
            </label>
            <label className="block font-semibold">Máximo de letras<input className="mt-1 w-24 rounded-lg border px-3 py-2" inputMode="numeric" value={v.max} onChange={(e) => mudar({ max: Number(e.target.value.replace(/\D/g, "")) || 20 })} /></label>
          </div>
        </div>
      )}
    </div>
  );
}
