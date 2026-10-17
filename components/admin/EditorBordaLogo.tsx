"use client";
// =====================================================================
// BORDA DA LOGO REDONDA (painel) — cor e grossura, com prévia.
// Vale para o banner, os efeitos "logo caindo/voando" e o mosaico de fundo.
// =====================================================================
type Props = { logo: string | null; cor: string | null; largura: number; corDaLoja: string; aoMudar: (v: { cor: string; largura: number }) => void };

export default function EditorBordaLogo({ logo, cor, largura, corDaLoja, aoMudar }: Props) {
  const atual = cor ?? "#ffffff";
  const presets = [["#ffffff", "Branca"], [corDaLoja, "Cor da loja"], ["#000000", "Preta"], ["#d4af37", "Dourada"], ["#c0c0c0", "Prateada"]];
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 p-3">
      <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white shadow" style={{ border: `${largura}px solid ${atual}` }}>
        {logo && <img src={logo} alt="" className="h-full w-full object-cover" />}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <span className="text-sm font-semibold">Borda da logo</span>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map(([c, r]) => (
            <button key={r} type="button" onClick={() => aoMudar({ cor: c, largura: largura || 3 })} title={r} aria-label={`Borda ${r}`}
              className="h-7 w-7 rounded-full border" style={{ background: c, outline: atual === c ? "2px solid #111" : "none", outlineOffset: 2 }} />
          ))}
          <input type="color" value={atual} onChange={(e) => aoMudar({ cor: e.target.value, largura: largura || 3 })} className="h-7 w-9 rounded" title="Outra cor" />
          <button type="button" onClick={() => aoMudar({ cor: atual, largura: 0 })} className="rounded-full border px-2 py-1 text-xs">Sem borda</button>
        </div>
        <label className="block text-xs">Grossura: <b>{largura}px</b>
          <input type="range" min={0} max={10} value={largura} onChange={(e) => aoMudar({ cor: atual, largura: Number(e.target.value) })} className="block w-full" />
        </label>
        <p className="text-xs opacity-60">Vale para a logo do topo, os efeitos “logo caindo/voando” e o mosaico de fundo.</p>
      </div>
    </div>
  );
}
