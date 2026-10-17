"use client";
// =====================================================================
// AJUSTE DA LOGO NO PAINEL — prévia redonda ao vivo, com:
//   - "Preencher o círculo" ou "Mostrar inteira"
//   - zoom (afastar / aproximar)
//   - cor de fundo atrás da logo
// =====================================================================
import ImagemLogo from "@/components/ImagemLogo";

export type ValorAjuste = { logo_ajuste: string; logo_zoom: number; logo_fundo: string };

export default function AjusteLogo({ src, valor, aoMudar }: { src: string | null; valor: ValorAjuste; aoMudar: (v: ValorAjuste) => void }) {
  if (!src) return null;
  const mudar = (parte: Partial<ValorAjuste>) => aoMudar({ ...valor, ...parte });
  const opcao = (ativo: boolean) => `rounded-full border px-3 py-1.5 text-sm ${ativo ? "bg-stone-900 text-white" : "bg-white"}`;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 p-3">
      {/* Prévias: grande e pequena (como fica no cabeçalho) */}
      <div className="flex items-end gap-3">
        <span className="block h-24 w-24 overflow-hidden rounded-full border-2 shadow"><ImagemLogo src={src} ajuste={valor.logo_ajuste} zoom={valor.logo_zoom} fundo={valor.logo_fundo} /></span>
        <span className="block h-10 w-10 overflow-hidden rounded-full border shadow"><ImagemLogo src={src} ajuste={valor.logo_ajuste} zoom={valor.logo_zoom} fundo={valor.logo_fundo} /></span>
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={opcao(valor.logo_ajuste !== "inteira")} onClick={() => mudar({ logo_ajuste: "cobrir" })}>Preencher o círculo</button>
          <button type="button" className={opcao(valor.logo_ajuste === "inteira")} onClick={() => mudar({ logo_ajuste: "inteira" })}>Mostrar inteira</button>
        </div>
        <label className="block text-sm">
          Zoom: <b>{Math.round(valor.logo_zoom * 100)}%</b>
          <input type="range" min={0.5} max={1.6} step={0.05} value={valor.logo_zoom}
            onChange={(e) => mudar({ logo_zoom: Number(e.target.value) })} className="block w-full" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          Cor de fundo:
          <input type="color" value={valor.logo_fundo} onChange={(e) => mudar({ logo_fundo: e.target.value })} className="h-8 w-12 rounded" />
        </label>
      </div>
    </div>
  );
}
