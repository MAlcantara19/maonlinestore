"use client";
// =====================================================================
// GRÁFICOS SIMPLES (sem biblioteca): linhas por dia e barras.
// =====================================================================
type Serie = { nome: string; cor: string; valores: number[] };

// Linhas: uma por série, com o eixo de dias embaixo
export function GraficoLinhas({ dias, series }: { dias: string[]; series: Serie[] }) {
  const L = 640, A = 200, m = 28;
  const max = Math.max(1, ...series.flatMap((s) => s.valores));
  const x = (i: number) => m + (i * (L - m * 2)) / Math.max(1, dias.length - 1);
  const y = (v: number) => A - m - (v / max) * (A - m * 2);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${L} ${A}`} className="min-w-[520px]" role="img" aria-label="Gráfico por dia">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={m} x2={L - m} y1={y(max * f)} y2={y(max * f)} stroke="currentColor" opacity={0.1} />
            <text x={4} y={y(max * f) + 4} fontSize={10} fill="currentColor" opacity={0.5}>{Math.round(max * f)}</text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.nome}>
            <polyline fill="none" stroke={s.cor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
              points={s.valores.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
            {s.valores.map((v, i) => v > 0 && <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.cor}><title>{`${dias[i]}: ${v} ${s.nome}`}</title></circle>)}
          </g>
        ))}
        {dias.map((d, i) => (i % Math.ceil(dias.length / 8) === 0 || i === dias.length - 1) && (
          <text key={d} x={x(i)} y={A - 6} fontSize={10} textAnchor="middle" fill="currentColor" opacity={0.6}>{d.slice(8, 10)}/{d.slice(5, 7)}</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-xs">
        {series.map((s) => <span key={s.nome} className="flex items-center gap-1"><span className="h-2 w-4 rounded" style={{ background: s.cor }} />{s.nome}</span>)}
      </div>
    </div>
  );
}

// Barras horizontais (ranking)
export function GraficoBarras({ itens, cor }: { itens: { rotulo: string; valor: number }[]; cor: string }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  if (!itens.length) return <p className="text-sm opacity-60">Ainda sem dados.</p>;
  return (
    <ul className="space-y-1.5">
      {itens.map((i) => (
        <li key={i.rotulo} className="text-sm">
          <div className="flex justify-between gap-2"><span className="truncate">{i.rotulo}</span><b>{i.valor}</b></div>
          <div className="h-2 rounded-full bg-black/5">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(i.valor / max) * 100}%`, background: cor }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
