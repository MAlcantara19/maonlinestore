"use client";
// =====================================================================
// CONTAGEM REGRESSIVA — dias : horas : minutos : segundos até a data.
// Usada nas lojas "em breve" que têm data de inauguração.
// =====================================================================
import { useEffect, useState } from "react";

export default function ContagemRegressiva({ ate, cor }: { ate: string; cor: string }) {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (agora === null) return null;

  const falta = Math.max(0, new Date(ate).getTime() - agora);
  if (falta === 0) return <span className="text-xs font-bold" style={{ color: cor }}>🎉 Chegou o dia!</span>;
  const s = Math.floor(falta / 1000);
  const partes = [
    [Math.floor(s / 86400), "d"], [Math.floor((s % 86400) / 3600), "h"], [Math.floor((s % 3600) / 60), "m"], [s % 60, "s"],
  ] as const;

  return (
    <span className="mt-1 inline-flex gap-1 font-mono text-xs" aria-label="Tempo até a inauguração">
      {partes.map(([n, u]) => (
        <span key={u} className="rounded bg-stone-900 px-1.5 py-0.5 text-white">{String(n).padStart(2, "0")}{u}</span>
      ))}
    </span>
  );
}
