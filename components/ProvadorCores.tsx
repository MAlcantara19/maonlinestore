"use client";
// =====================================================================
// 🎨 PROVADOR DE CORES — a mesma foto "pintada" em várias cores, lado a
// lado (aproximado). Funciona melhor com foto clara/branca da peça.
// Toque numa cor para escolher (avisa a escolha de cor do produto).
// =====================================================================
import { corDoNome } from "@/lib/cores";

export default function ProvadorCores({ foto, cores, produtoId, nome }: { foto: string; cores: string[]; produtoId: string; nome: string }) {
  const lista = cores.map((c) => ({ nome: c, hex: corDoNome(c) })).filter((c) => c.hex).slice(0, 12);
  if (lista.length < 2) return null;
  return (
    <section className="mt-6">
      <b className="block">🎨 Provador de cores</b>
      <p className="text-xs opacity-60">Prévia aproximada — as cores reais podem variar um pouco.</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {lista.map((c) => (
          <button key={c.nome} type="button" className="group text-center text-xs"
            onClick={() => window.dispatchEvent(new CustomEvent("provador-cor", { detail: { produto: produtoId, cor: c.nome } }))}>
            <span className="relative block aspect-square overflow-hidden rounded-xl bg-white shadow-sm transition-transform group-hover:scale-105">
              <img src={foto} alt={`${nome} em ${c.nome}`} className="h-full w-full object-cover" />
              <span aria-hidden className="absolute inset-0" style={{ background: c.hex!, mixBlendMode: "color", opacity: 0.65 }} />
            </span>
            <span className="mt-1 flex items-center justify-center gap-1"><span className="h-3 w-3 rounded-full border" style={{ background: c.hex! }} />{c.nome}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
