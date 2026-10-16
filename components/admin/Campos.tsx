// =====================================================================
// PEDACINHOS DOS FORMULÁRIOS DO PAINEL (usados em várias telas)
//   Bloco        → caixa branca com título
//   Campo        → rótulo + o campo
//   Interruptor  → botão liga/desliga animado
//   BarraSalvar  → botão "Salvar" preso no rodapé, com mensagem
// =====================================================================
import type { ReactNode } from "react";

export const estiloInput = "mt-1 w-full rounded-lg border bg-white px-3 py-2";

export function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-bold">{titulo}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{rotulo}</span>
      {children}
    </label>
  );
}

export function Interruptor({ rotulo, ajuda, ligado, aoMudar }: { rotulo: string; ajuda: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <b className="block text-sm">{rotulo}</b>
        <span className="text-xs opacity-60">{ajuda}</span>
      </div>
      <button type="button" role="switch" aria-checked={ligado} onClick={() => aoMudar(!ligado)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${ligado ? "bg-green-600" : "bg-stone-300"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${ligado ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

export type Mensagem = { tipo: "ok" | "erro"; texto: string } | null;

export function BarraSalvar({ mensagem, salvando, aoSalvar, cor = "#1c1917", extra }: {
  mensagem: Mensagem; salvando: boolean; aoSalvar: () => void; cor?: string; extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 border-t bg-stone-100/95 px-4 py-3 backdrop-blur">
      {mensagem && <p className={`mb-2 text-sm ${mensagem.tipo === "ok" ? "text-green-700" : "text-red-600"}`}>{mensagem.texto}</p>}
      <div className="flex gap-2">
        {extra}
        <button type="button" onClick={aoSalvar} disabled={salvando} className="flex-1 rounded-xl p-3 font-semibold text-white disabled:opacity-50" style={{ background: cor }}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
