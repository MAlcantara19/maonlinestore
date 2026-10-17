// =====================================================================
// EFEITO "VOAR PARA O CARRINHO" (fly-to-cart)
// Cria uma miniatura do produto no lugar do botão clicado e faz ela voar
// em curva até o botão flutuante do carrinho (id="alvo-carrinho").
// Quando chega, abre o carrinho lateral.
// Truque da curva: um elemento anda na horizontal em velocidade constante
// e outro, dentro dele, sobe e depois desce — juntos formam um arco.
// =====================================================================
export function abrirCarrinho() {
  window.dispatchEvent(new Event("abrir-carrinho"));
}

export function voarParaCarrinho(origem: DOMRect, foto: string | undefined, cor: string) {
  const alvo = document.getElementById("alvo-carrinho");
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!alvo || semMovimento) return abrirCarrinho();

  const destino = alvo.getBoundingClientRect();
  const tamanho = 56;
  const inicioX = origem.left + origem.width / 2 - tamanho / 2;
  const inicioY = origem.top + origem.height / 2 - tamanho / 2;
  const dx = destino.left + destino.width / 2 - tamanho / 2 - inicioX;
  const dy = destino.top + destino.height / 2 - tamanho / 2 - inicioY;
  const arco = Math.min(0, dy) - 110; // altura do "pulo"

  // Elemento de fora: só anda para o lado
  const horizontal = document.createElement("div");
  Object.assign(horizontal.style, {
    position: "fixed", left: `${inicioX}px`, top: `${inicioY}px`, zIndex: "100", pointerEvents: "none",
  });

  // Elemento de dentro: a miniatura, que sobe e desce
  const miniatura = document.createElement(foto ? "img" : "div");
  if (foto) (miniatura as HTMLImageElement).src = foto;
  else miniatura.textContent = "🛍️";
  Object.assign(miniatura.style, {
    width: `${tamanho}px`, height: `${tamanho}px`, borderRadius: "9999px", objectFit: "cover",
    background: cor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
    boxShadow: "0 10px 24px rgba(0,0,0,.3)", border: "3px solid white",
  });

  horizontal.appendChild(miniatura);
  document.body.appendChild(horizontal);

  const duracao = 800;
  horizontal.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], { duration: duracao, easing: "linear" });
  const voo = miniatura.animate(
    [
      { transform: "translateY(0) scale(1)", easing: "ease-out" },
      { transform: `translateY(${arco}px) scale(0.85)`, offset: 0.4, easing: "ease-in" },
      { transform: `translateY(${dy}px) scale(0.25)`, opacity: 0.6 },
    ],
    { duration: duracao, fill: "forwards" }
  );
  voo.onfinish = () => {
    horizontal.remove();
    abrirCarrinho();
  };
}

// =====================================================================
// CONFETE NO BOTÃO — uma micro-explosão de partículas coloridas saindo
// do botão clicado (ex.: "Adicionar ao carrinho").
// =====================================================================
export function explodirConfete(origem: DOMRect, cores: string[]) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cx = origem.left + origem.width / 2;
  const cy = origem.top + origem.height / 2;
  for (let i = 0; i < 22; i++) {
    const p = document.createElement("span");
    const tamanho = 5 + Math.random() * 6;
    Object.assign(p.style, {
      position: "fixed", left: `${cx}px`, top: `${cy}px`, width: `${tamanho}px`, height: `${tamanho * (Math.random() > 0.5 ? 1 : 0.5)}px`,
      background: cores[i % cores.length], borderRadius: Math.random() > 0.5 ? "50%" : "2px", zIndex: "100", pointerEvents: "none",
    });
    document.body.appendChild(p);
    const angulo = Math.random() * Math.PI * 2;
    const distancia = 50 + Math.random() * 90;
    const dx = Math.cos(angulo) * distancia;
    const dy = Math.sin(angulo) * distancia - 40; // sobe um pouco antes de cair
    p.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 70}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 400, easing: "cubic-bezier(.2,.7,.4,1)" }
    ).onfinish = () => p.remove();
  }
}

// =====================================================================
// ONDINHA NO CLIQUE ("onda de choque") — um círculo que se espalha a
// partir do ponto clicado. O botão precisa ter "relative overflow-hidden".
// =====================================================================
export function ondinha(e: { clientX: number; clientY: number; currentTarget: HTMLElement }, cor: string) {
  const alvo = e.currentTarget;
  const r = alvo.getBoundingClientRect();
  const tamanho = Math.max(r.width, r.height) * 2.2;
  const onda = document.createElement("span");
  Object.assign(onda.style, {
    position: "absolute", left: `${e.clientX - r.left - tamanho / 2}px`, top: `${e.clientY - r.top - tamanho / 2}px`,
    width: `${tamanho}px`, height: `${tamanho}px`, borderRadius: "50%", background: cor, opacity: "0.35", pointerEvents: "none",
  });
  alvo.appendChild(onda);
  onda.animate([{ transform: "scale(0)", opacity: 0.35 }, { transform: "scale(1)", opacity: 0 }], { duration: 600, easing: "ease-out" }).onfinish = () => onda.remove();
}
