// =====================================================================
// FUNDO DA PÁGINA INTEIRA — fica parado atrás de tudo (inclusive ao rolar):
//   imagem  → uma foto cobrindo a tela
//   mosaico → a logo repetida, pequenininha, como papel de parede
//   video   → vídeo curto em looping, sem som
// A "opacidade" deixa mais forte ou mais suave (marca d'água).
// =====================================================================
import type { AnimacaoFundo, TipoFundo } from "@/lib/tipos";

type Props = { tipo?: TipoFundo | null; url?: string | null; logo?: string | null; opacidade?: number | null; corBase?: string | null; animacao?: AnimacaoFundo | null };

export default function FundoDaPagina({ tipo, url, logo, opacidade, corBase, animacao }: Props) {
  const fonte = tipo === "mosaico" ? url || logo : url;
  if (!tipo || tipo === "nenhum" || !fonte) return null;
  const op = Math.max(3, Math.min(100, opacidade ?? 15)) / 100;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* Cor de base por baixo (no modo escuro vira escura) */}
      <div className="fundo-base absolute inset-0" style={{ background: corBase ?? "var(--background)" }} />
      <div className="absolute inset-0" style={{ opacity: op }}>
        {tipo === "video" && <video src={fonte} autoPlay muted loop playsInline className="h-full w-full object-cover" />}
        {/* Foto: pode "respirar", aproximar devagar ou passear para o lado */}
        {tipo === "imagem" && <img src={fonte} alt="" className={`h-full w-full object-cover fundo-${animacao ?? "nenhuma"}`} />}
        {/* Logo repetida, com espaço entre elas, andando devagar na diagonal */}
        {tipo === "mosaico" && (
          <div className={`mosaico-andando h-full w-full fundo-${animacao ?? "nenhuma"}`}
            style={{ backgroundImage: `url(${fonte})`, backgroundSize: "80px 80px", backgroundRepeat: "space" }} />
        )}
      </div>
    </div>
  );
}
