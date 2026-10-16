// =====================================================================
// ESTILOS DAS ANIMAÇÕES — todas as animações do site num lugar só.
// Basta colocar <EstilosAnimacao /> na página para elas funcionarem.
// =====================================================================
const ANIMACOES = `
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

  /* EFEITOS ANIMADOS (neve, estrelas, brilhos, corações, confete, bolhas) */
  .efeito-particula { position: absolute; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes cair { to { transform: translateY(115vh) rotate(360deg); } }
  .efeito-cair { animation-name: cair; }
  @keyframes subir { to { transform: translateY(-120vh) scale(1.2); opacity: 0; } }
  .efeito-subir { animation-name: subir; }
  @keyframes piscar { 0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(90deg); } }
  .efeito-piscar { animation-name: piscar; animation-timing-function: ease-in-out; }
  /* balançar para os lados enquanto cai/sobe */
  @keyframes balancar { from { transform: translateX(-14px); } to { transform: translateX(14px); } }
  .efeito-balancar { display: inline-block; animation: balancar ease-in-out infinite alternate; }

  /* Quem pediu "menos movimento" no aparelho não vê animações */
  @media (prefers-reduced-motion: reduce) {
    .animar-entrada, .pular, .deslizar, .surgir, .subir, .parallax-conteudo, .parallax-fundo { animation: none; }
    .efeito-particula { display: none; }
  }
`;

export default function EstilosAnimacao() {
  return <style>{ANIMACOES}</style>;
}
