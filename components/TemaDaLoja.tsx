// =====================================================================
// TEMA DA LOJA — "veste" a página com a aparência de cada loja.
// Tudo vem da tabela "lojas", então cada loja personaliza a sua
// sem ninguém precisar mexer no código:
//   cor_fundo → fundo da página
//   fonte     → estilo dos títulos (moderna, elegante, divertida)
// Também coloca o botão "voltar ao topo".
// =====================================================================
import type { CSSProperties, ReactNode } from "react";
import type { Loja } from "@/lib/tipos";
import VoltarAoTopo from "@/components/VoltarAoTopo";

// Cada opção de fonte: o endereço no Google Fonts e o nome da família.
const FONTES = {
  moderna: { link: null, familia: "inherit" }, // a fonte padrão do site
  elegante: {
    link: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap",
    familia: "'Playfair Display', Georgia, serif",
  },
  divertida: {
    link: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap",
    familia: "'Baloo 2', 'Comic Sans MS', sans-serif",
  },
} as const;

export default function TemaDaLoja({ loja, children }: { loja: Loja; children: ReactNode }) {
  const fonte = FONTES[loja.fonte ?? "moderna"];

  // Variável CSS --fonte-titulo: usada pelos títulos (h1, h2, h3) logo abaixo.
  const estilo = {
    background: loja.cor_fundo ?? undefined,
    color: loja.cor_fundo ? "#1c1917" : undefined, // fundo claro pede texto escuro
    "--fonte-titulo": fonte.familia,
  } as CSSProperties;

  return (
    <div className="tema-loja min-h-screen" style={estilo}>
      {fonte.link && <link rel="stylesheet" href={fonte.link} precedence="default" />}
      <style>{`
        .tema-loja h1, .tema-loja h2, .tema-loja h3 { font-family: var(--fonte-titulo); }
        /* Entrada suave dos cartões: sobem e aparecem */
        @keyframes aparecer { from { opacity: 0; transform: translateY(14px); } }
        .animar-entrada { animation: aparecer 0.45s ease-out backwards; }
        @media (prefers-reduced-motion: reduce) { .animar-entrada { animation: none; } }
      `}</style>
      {children}
      <VoltarAoTopo cor={loja.cor ?? "#333"} />
    </div>
  );
}