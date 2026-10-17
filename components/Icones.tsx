// =====================================================================
// ÍCONES DESENHADOS EM SVG (sem imagem) — pegam a cor de quem usa.
//   IconeTelefone → telefone (usado nos botões de WhatsApp, em verde)
//   IconeCoracao  → coração na cor que você mandar (padrão: vermelho)
// =====================================================================
export function IconeTelefone({ tamanho = 16, className = "" }: { tamanho?: number; className?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`inline-block shrink-0 ${className}`}>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
    </svg>
  );
}

// Telefone branco dentro de um círculo verde (cara de "chamar no WhatsApp")
export function BolinhaTelefone({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <span className="icone-tremer inline-flex shrink-0 items-center justify-center rounded-full bg-[#1FA855] text-white"
      style={{ width: tamanho, height: tamanho }}>
      <IconeTelefone tamanho={Math.round(tamanho * 0.6)} />
    </span>
  );
}

export function IconeCoracao({ cor = "#e11d48", tamanho = 16 }: { cor?: string; tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={cor} aria-hidden="true" className="inline-block shrink-0">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}
