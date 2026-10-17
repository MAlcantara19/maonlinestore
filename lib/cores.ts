// =====================================================================
// NOME DA COR → BOLINHA DE COR (ex.: "azul turquesa" → #40E0D0)
// Usado para mostrar uma bolinha colorida ao lado do nome da cor.
// Acrescente as cores que vocês usam.
// =====================================================================
const MAPA: Record<string, string> = {
  branco: "#ffffff", "branco perola": "#f4efe6", preto: "#111111", cinza: "#9ca3af", prata: "#c0c0c0",
  azul: "#2563eb", "azul claro": "#93c5fd", "azul marinho": "#1e3a8a", "azul turquesa": "#40e0d0", turquesa: "#40e0d0",
  rosa: "#ec4899", "rosa claro": "#f9a8d4", "rosa bebe": "#f9c6d8", vermelho: "#dc2626", vinho: "#7f1d1d", bordo: "#6e1423",
  verde: "#16a34a", "verde claro": "#86efac", "verde agua": "#7fdbca", amarelo: "#facc15", laranja: "#f97316",
  roxo: "#7c3aed", lilas: "#c4b5fd", dourado: "#d4af37", bege: "#e8dcc4", marrom: "#7c4a2d", nude: "#e3c4a8",
  transparente: "linear-gradient(135deg,#fff 45%,#cbd5e1 50%,#fff 55%)",
};

const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function corDoNome(nome: string | null | undefined): string | null {
  if (!nome) return null;
  const n = normalizar(nome);
  return MAPA[n] ?? MAPA[n.split(" ")[0]] ?? null;
}
