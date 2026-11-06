"use client";
// Botão "Imprimir / salvar PDF" (some na impressão)
export default function BotaoImprimir({ cor, texto = "🖨️ Salvar como PDF / imprimir" }: { cor: string; texto?: string }) {
  return <button type="button" onClick={() => window.print()} className="nao-imprimir rounded-full px-5 py-2.5 font-semibold text-white shadow" style={{ background: cor }}>{texto}</button>;
}
