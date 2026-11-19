"use client";
// =====================================================================
// ✨ "Escrever com IA" — botão pequeno embaixo de um campo de texto.
// Gera o texto (ex.: descrição do produto) e mostra antes de usar.
// =====================================================================
import { useState } from "react";
import { pedirIA, type TipoIA } from "@/lib/ia";

export default function BotaoIA({ slug, tipo, entrada, aoUsar, rotulo = "✨ Escrever com IA" }: {
  slug: string; tipo: TipoIA; entrada: Record<string, string>; aoUsar: (texto: string) => void; rotulo?: string;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function gerar() {
    setCarregando(true); setErro("");
    try { setTexto(await pedirIA(slug, tipo, entrada)); } catch (e) { setErro((e as Error).message); }
    setCarregando(false);
  }

  return (
    <div className="mt-1">
      <button type="button" onClick={gerar} disabled={carregando} className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 disabled:opacity-50">
        {carregando ? "✨ Escrevendo..." : texto ? "🔄 Gerar outra" : rotulo}
      </button>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      {texto && (
        <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-stone-900">
          <p className="whitespace-pre-line">{texto}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => { aoUsar(texto); setTexto(null); }} className="rounded-full bg-violet-700 px-3 py-1 text-xs font-semibold text-white">✓ Usar este texto</button>
            <button type="button" onClick={() => setTexto(null)} className="rounded-full border px-3 py-1 text-xs">Descartar</button>
          </div>
        </div>
      )}
    </div>
  );
}
