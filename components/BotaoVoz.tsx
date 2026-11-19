"use client";
// =====================================================================
// 🎤 BUSCA POR VOZ — toca no microfone, fala "caneca de natal" e o
// texto entra na busca. Só aparece nos navegadores que entendem voz
// (Chrome, Edge, Safari). Nada é gravado pelo site.
// =====================================================================
import { useEffect, useRef, useState } from "react";

type Reconhecimento = { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

export default function BotaoVoz({ aoOuvir, className = "" }: { aoOuvir: (texto: string) => void; className?: string }) {
  const [suporta, setSuporta] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const rec = useRef<Reconhecimento | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Reconhecimento; webkitSpeechRecognition?: new () => Reconhecimento };
    setSuporta(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function ouvir() {
    if (ouvindo) { rec.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: new () => Reconhecimento; webkitSpeechRecognition?: new () => Reconhecimento };
    const Classe = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Classe) return;
    const r = new Classe();
    r.lang = "pt-BR"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const t = e.results[0]?.[0]?.transcript?.trim(); if (t) aoOuvir(t.replace(/[.!?]$/, "")); };
    r.onend = () => setOuvindo(false);
    r.onerror = () => setOuvindo(false);
    rec.current = r;
    setOuvindo(true);
    try { r.start(); } catch { setOuvindo(false); }
  }

  if (!suporta) return null;
  return (
    <button type="button" onClick={ouvir} aria-label={ouvindo ? "Parar de ouvir" : "Buscar por voz"} title="Buscar por voz"
      className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-colors ${ouvindo ? "animate-pulse bg-red-500 text-white" : "hover:bg-black/10"} ${className}`}>
      🎤
    </button>
  );
}
