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


  /* Voar pela tela (borboletas, logo voando): caminho com 3 pontos sorteados */
  @keyframes voar {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(var(--x1), var(--y1)) rotate(8deg); }
    50% { transform: translate(var(--x2), var(--y2)) rotate(-6deg); }
    75% { transform: translate(var(--x3), var(--y3)) rotate(5deg); }
  }
  .efeito-voar { animation-name: voar; animation-timing-function: ease-in-out; }

  /* ===== ROLAGEM: cartões e seções surgem ao entrar na tela =====
     (nos navegadores que suportam; nos outros, entram em cascata ao abrir) */
  @supports (animation-timeline: view()) {
    .animar-entrada { animation: aparecer linear both !important; animation-timeline: view() !important; animation-range: entry 0% entry 60% !important; animation-delay: 0s !important; }
  }

  /* ===== ESQUELETO COM BRILHO PASSANDO (shimmer) ===== */
  .brilho-esqueleto { position: relative; overflow: hidden; background: rgb(0 0 0 / 0.08); }
  .brilho-esqueleto::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.55), transparent); animation: brilhar 1.4s infinite; }
  @keyframes brilhar { to { transform: translateX(100%); } }

  /* ===== BRILHO METÁLICO PASSANDO NO TEXTO (selos "Novo", "Promoção"...) ===== */
  .brilho-texto { position: relative; overflow: hidden; }
  .brilho-texto::after { content: ""; position: absolute; inset: 0; transform: translateX(-120%) skewX(-20deg);
    background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.7), transparent); animation: reflexo 3.5s ease-in-out infinite; }
  @keyframes reflexo { 0%, 70% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(220%) skewX(-20deg); } }

  /* ===== BOTÕES DO WHATSAPP "VIVOS" =====
     pulsar: ondas saindo do botão · botao-vivo: brilho correndo ao passar o mouse
     icone-tremer: o telefone treme como se estivesse tocando */
  .pulsar { animation: pulso 2.2s ease-out infinite; }
  @keyframes pulso { 0% { box-shadow: 0 0 0 0 rgb(31 168 85 / 0.55); } 70% { box-shadow: 0 0 0 14px rgb(31 168 85 / 0); } 100% { box-shadow: 0 0 0 0 rgb(31 168 85 / 0); } }
  .botao-vivo { background-image: linear-gradient(110deg, #1FA855 30%, #4ade80 50%, #1FA855 70%); background-size: 250% 100%; background-position: 100% 0; transition: background-position .6s ease; }
  .botao-vivo:hover { background-position: 0 0; }
  .botao-vivo:hover .icone-tremer, .icone-tremer:hover { animation: tocar .5s ease-in-out 2; }
  @keyframes tocar { 0%,100% { transform: rotate(0); } 20% { transform: rotate(-18deg); } 40% { transform: rotate(16deg); } 60% { transform: rotate(-12deg); } 80% { transform: rotate(8deg); } }

  /* Número do carrinho "rolando" quando muda */
  @keyframes rolar-numero { from { transform: translateY(100%); opacity: 0; } }
  .contador { display: inline-block; animation: rolar-numero .35s ease-out; }

  /* Foto em tela cheia: cresce e o fundo escurece devagar */
  @keyframes ampliar { from { transform: scale(0.6); opacity: 0; } }
  .ampliar { animation: ampliar .35s cubic-bezier(.2,.8,.2,1); }

  /* Aviãozinho de papel do envio do pedido */
  @keyframes aviao { 0% { transform: translate(-40vw, 20vh) rotate(-10deg) scale(.6); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(60vw, -50vh) rotate(-25deg) scale(1.2); opacity: 0; } }
  .aviao { animation: aviao 1s ease-in forwards; }

  /* Balãozinho de conversa aparecendo (como no WhatsApp) */
  @keyframes balao { 0% { transform: scale(.4) translateY(10px); opacity: 0; } 70% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
  .balao { animation: balao .4s cubic-bezier(.2,.9,.3,1.3); transform-origin: bottom left; }
  @keyframes digitando { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-4px); opacity: 1; } }
  .ponto-digitando { display: inline-block; animation: digitando 1s infinite; }

  /* Faixa infinita (marcas e parceiros passando) */
  @keyframes faixa { to { transform: translateX(-50%); } }
  .faixa-infinita { animation: faixa 35s linear infinite; }
  .faixa-infinita:hover { animation-play-state: paused; }

  /* ===== MODO ESCURO 🌙 =====
     O tema fica no <html data-tema="claro|escuro">. Sem escolha salva, começa claro. */
  html[data-tema="claro"] { --background: #ffffff; --foreground: #171717; color-scheme: light; }
  html[data-tema="escuro"] { --background: #121016; --foreground: #ece8f1; color-scheme: dark; }
  html[data-tema="escuro"] body { background: var(--background); color: var(--foreground); }
  html[data-tema="escuro"] .tema-loja { background: #121016 !important; color: #ece8f1 !important; }
  html[data-tema="escuro"] .bg-white { background-color: #1e1b24 !important; }
  html[data-tema="escuro"] .bg-white\\/60, html[data-tema="escuro"] .bg-white\\/70, html[data-tema="escuro"] .bg-white\\/80,
  html[data-tema="escuro"] .bg-white\\/90, html[data-tema="escuro"] .bg-white\\/95 { background-color: rgb(30 27 36 / 0.9) !important; }
  html[data-tema="escuro"] .bg-stone-50 { background-color: #19171e !important; }
  html[data-tema="escuro"] .bg-stone-100, html[data-tema="escuro"] .bg-stone-100\\/95 { background-color: #121016 !important; }
  html[data-tema="escuro"] .bg-stone-200 { background-color: #2a2631 !important; }
  html[data-tema="escuro"] .text-stone-900 { color: #ece8f1 !important; }
  html[data-tema="escuro"] .border, html[data-tema="escuro"] .border-b, html[data-tema="escuro"] .border-t { border-color: rgb(255 255 255 / 0.12); }
  html[data-tema="escuro"] input, html[data-tema="escuro"] textarea, html[data-tema="escuro"] select { background-color: #1e1b24; color: #ece8f1; }
  html[data-tema="escuro"] .brilho-esqueleto { background: rgb(255 255 255 / 0.08); }
  /* Preços e destaques na cor da loja: no escuro viram cinza bem claro (legível) */
  html[data-tema="escuro"] .texto-cor { color: #e7e3ee !important; }
  html[data-tema="escuro"] .borda-cor { border-color: rgb(255 255 255 / 0.55) !important; }

  /* Troca de tema com "cortina": o novo tema se espalha em círculo a partir do clique */
  ::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
  ::view-transition-new(root) { animation: cortina .7s ease-in-out; }
  @keyframes cortina {
    from { clip-path: circle(0 at var(--cortina-x, 50%) var(--cortina-y, 50%)); }
    to { clip-path: circle(150vmax at var(--cortina-x, 50%) var(--cortina-y, 50%)); }
  }


  /* Foto "flutuando" de leve no visualizador 3D */
  @keyframes flutuar { 0%, 100% { transform: translateY(0) rotateY(-4deg); } 50% { transform: translateY(-8px) rotateY(4deg); } }
  .flutuar { animation: flutuar 5s ease-in-out infinite; }

  /* Borda colorida girando (parceiro em destaque, ex.: o seu card) */
  @property --angulo { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
  .borda-girando { background: conic-gradient(from var(--angulo), #f5c542, #ef5350, #a855f7, #42a5f5, #f5c542); animation: girar-borda 4s linear infinite; }
  @keyframes girar-borda { to { --angulo: 360deg; } }

  /* Barra de "preparando seu pedido" */
  @keyframes encher { from { width: 0; } to { width: 100%; } }
  .encher { animation: encher 1.1s ease-in-out forwards; }

  /* Troca de tema suave (fundo e texto mudam devagar) */
  body, .tema-loja { transition: background-color .5s ease, color .5s ease; }

  /* Fundo da página: no escuro, a base fica escura; o wrapper deixa o fundo aparecer */
  html[data-tema="escuro"] .fundo-base { background: #121016 !important; }
  html[data-tema="escuro"] .tema-loja.com-fundo { background: transparent !important; }
  /* Mosaico de logos andando bem devagar na diagonal */
  @keyframes mosaico { to { background-position: 110px 110px; } }
  .mosaico-andando { animation: mosaico 12s linear infinite; }

  /* Animações da foto de fundo */
  @keyframes respirar { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.04); opacity: .8; } }
  .fundo-respirar { animation: respirar 6s ease-in-out infinite; }
  @keyframes zoom-lento { from { transform: scale(1); } to { transform: scale(1.25); } }
  .fundo-zoom_lento { animation: zoom-lento 30s ease-in-out infinite alternate; }
  @keyframes deslizar-fundo { from { transform: scale(1.2) translateX(-6%); } to { transform: scale(1.2) translateX(6%); } }
  .fundo-deslizar { animation: deslizar-fundo 25s ease-in-out infinite alternate; }

  /* Mosaico de logos redondas andando na diagonal (loop perfeito) */
  @keyframes mosaico-grade { to { transform: translate(var(--passo), var(--passo)); } }
  .mosaico-grade { animation: mosaico-grade 14s linear infinite; }

  /* Quem pediu "menos movimento" no aparelho não vê animações */
  @media (prefers-reduced-motion: reduce) {
    .animar-entrada, .pular, .deslizar, .surgir, .subir, .parallax-conteudo, .parallax-fundo, .pulsar, .brilho-texto::after,
    .brilho-esqueleto::after, .contador, .ampliar, .aviao, .balao, .faixa-infinita, .efeito-voar, .flutuar, .borda-girando, .encher, .mosaico-andando, .mosaico-grade, .fundo-respirar, .fundo-zoom_lento, .fundo-deslizar { animation: none !important; }
    ::view-transition-new(root) { animation: none; }
    .efeito-particula { display: none; }
  }
`;

// (O tema claro/escuro salvo é aplicado no app/layout.tsx, antes da página aparecer.)
export default function EstilosAnimacao() {
  return <style>{ANIMACOES}</style>;
}
