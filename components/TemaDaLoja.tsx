// =====================================================================
// TEMA DA LOJA — "veste" a página com a aparência de cada loja.
// Tudo vem da tabela "lojas", então cada loja personaliza a sua
// sem ninguém precisar mexer no código:
//   cor_fundo → fundo da página
//   fonte     → estilo dos títulos (moderna, elegante, divertida)
// Também coloca: carrinho flutuante (com o carrinho lateral), voltar ao
// topo e o botão de dúvidas (WhatsApp). As animações ficam aqui embaixo.
// =====================================================================
import type { CSSProperties, ReactNode } from "react";
import type { Loja } from "@/lib/tipos";
import VoltarAoTopo from "@/components/VoltarAoTopo";
import BotaoDuvidas from "@/components/BotaoDuvidas";
import CarrinhoFlutuante from "@/components/CarrinhoFlutuante";
import Rodape from "@/components/Rodape";

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

// Animações usadas pelos componentes da loja.
const ANIMACOES = `
  .tema-loja h1, .tema-loja h2, .tema-loja h3 { font-family: var(--fonte-titulo); }

  /* Cartões entrando em cascata */
  @keyframes aparecer { from { opacity: 0; transform: translateY(14px); } }
  .animar-entrada { animation: aparecer 0.45s ease-out backwards; }

  /* Pulinho da barra do carrinho */
  @keyframes pular { 0%, 100% { transform: scale(1); } 30% { transform: scale(1.08); } 60% { transform: scale(0.97); } }
  .pular { animation: pular 0.6s ease; }

  /* Painel de sugestões da busca descendo */
  @keyframes deslizar { from { opacity: 0; transform: translateY(-8px); } }
  .deslizar { animation: deslizar 0.25s ease-out; }

  /* Popup "adicionar rápido": fundo aparece e o painel sobe */
  @keyframes surgir { from { opacity: 0; } }
  .surgir { animation: surgir 0.25s ease-out; }
  @keyframes subir { from { opacity: 0; transform: translateY(40px) scale(0.98); } }
  .subir { animation: subir 0.3s ease-out; }

  /* PARALLAX do banner: ao rolar, o fundo e o texto andam em velocidades
     diferentes e somem. Só nos navegadores que suportam (os outros
     mostram o banner parado, normal). */
  @keyframes parallax-conteudo { to { transform: translateY(45%); opacity: 0; } }
  @keyframes parallax-fundo { to { transform: translateY(20%) scale(1.15); } }
  @supports (animation-timeline: view()) {
    .parallax-conteudo { animation: parallax-conteudo linear both; animation-timeline: view(); animation-range: exit 0% exit 100%; }
    .parallax-fundo { animation: parallax-fundo linear both; animation-timeline: view(); animation-range: exit 0% exit 100%; }
  }

  /* Neve/corações/estrelas caindo */
  @keyframes cair { to { transform: translateY(110vh) rotate(360deg); } }
  .efeito-particula { animation-name: cair; animation-timing-function: linear; animation-iteration-count: infinite; }

  /* Quem pediu "menos movimento" no aparelho não vê animações */
  @media (prefers-reduced-motion: reduce) {
    .animar-entrada, .pular, .deslizar, .surgir, .subir, .parallax-conteudo, .parallax-fundo { animation: none; }
    .efeito-particula { display: none; }
  }
`;

export default function TemaDaLoja({ loja, children }: { loja: Loja; children: ReactNode }) {
  const fonte = FONTES[loja.fonte ?? "moderna"];
  const cor = loja.cor ?? "#333";

  const estilo = {
    background: loja.cor_fundo ?? undefined,
    color: loja.cor_fundo ? "#1c1917" : undefined, // fundo claro pede texto escuro
    "--fonte-titulo": fonte.familia,
  } as CSSProperties;

  return (
    // flex-col + min-h-screen: a página ocupa no mínimo a tela toda, e o rodapé fica no fim
    <div className="tema-loja flex min-h-screen flex-col" style={estilo}>
      {fonte.link && <link rel="stylesheet" href={fonte.link} precedence="default" />}
      <style>{ANIMACOES}</style>
      {children}
      <Rodape loja={loja} />
      <CarrinhoFlutuante loja={loja} />
      {loja.whatsapp && <BotaoDuvidas whatsapp={loja.whatsapp} nomeDaLoja={loja.nome} />}
      <VoltarAoTopo cor={cor} />
    </div>
  );
}
