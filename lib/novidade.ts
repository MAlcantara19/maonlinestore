// =====================================================================
// 🆕 NOVIDADE AUTOMÁTICA — produto cadastrado nos últimos X dias ganha
// a etiqueta "Novidade" sozinho (na loja e no catálogo). Depois some.
// Para mudar o prazo, troque o número abaixo.
// =====================================================================
export const DIAS_NOVIDADE = 20;

export function ehNovidade(criadoEm?: string | null) {
  if (!criadoEm) return false;
  const t = new Date(criadoEm).getTime();
  return Number.isFinite(t) && Date.now() - t < DIAS_NOVIDADE * 86400_000;
}
