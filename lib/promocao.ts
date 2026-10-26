// =====================================================================
// PROMOÇÃO — % de desconto no produto (vale também para as variações),
// com data opcional para acabar sozinha.
// =====================================================================
type ComPromocao = { promocao_pct?: number | null; promocao_ate?: string | null };

export function promocaoAtiva(p: ComPromocao, agora = Date.now()): boolean {
  return !!p.promocao_pct && (!p.promocao_ate || new Date(p.promocao_ate).getTime() > agora);
}

// Preço já com o desconto (se a promoção estiver valendo)
export function comPromocao(preco: number, p: ComPromocao): number {
  return promocaoAtiva(p) ? Math.round(preco * (100 - (p.promocao_pct ?? 0))) / 100 : preco;
}

// "termina hoje", "termina em 3 dias" (ou vazio, se não tem data)
export function textoFimPromocao(p: ComPromocao, agora = Date.now()): string {
  if (!p.promocao_ate) return "";
  const dias = Math.ceil((new Date(p.promocao_ate).getTime() - agora) / 86400000);
  return dias <= 1 ? "termina hoje!" : `termina em ${dias} dias`;
}
