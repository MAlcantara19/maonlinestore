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
