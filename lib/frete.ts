// =====================================================================
// FRETE APROXIMADO POR CEP — o CEP vira cidade/UF (ViaCEP, grátis) e o
// valor sai das regras da loja: mesma cidade · mesmo estado · região.
// É uma ESTIMATIVA: o valor final é combinado no WhatsApp.
// =====================================================================
export type RegrasFrete = {
  cidade?: string; cidade_valor?: number | null;
  uf?: string; uf_valor?: number | null;
  regioes?: Partial<Record<Regiao, number | null>>;
};
export type Regiao = "sudeste" | "sul" | "centro_oeste" | "nordeste" | "norte";
export type Estimativa = { cep: string; cidade: string; uf: string; valor: number | null; onde: string };

export const NOMES_REGIOES: Record<Regiao, string> = { sudeste: "Sudeste", sul: "Sul", centro_oeste: "Centro-Oeste", nordeste: "Nordeste", norte: "Norte" };
const REGIAO_DA_UF: Record<string, Regiao> = {
  SP: "sudeste", RJ: "sudeste", MG: "sudeste", ES: "sudeste",
  PR: "sul", SC: "sul", RS: "sul",
  DF: "centro_oeste", GO: "centro_oeste", MT: "centro_oeste", MS: "centro_oeste",
  BA: "nordeste", SE: "nordeste", AL: "nordeste", PE: "nordeste", PB: "nordeste", RN: "nordeste", CE: "nordeste", PI: "nordeste", MA: "nordeste",
  AM: "norte", PA: "norte", AC: "norte", RO: "norte", RR: "norte", AP: "norte", TO: "norte",
};
const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const temRegras = (r?: RegrasFrete | null) =>
  !!r && (r.cidade_valor != null || r.uf_valor != null || Object.values(r.regioes ?? {}).some((v) => v != null));

export async function estimarFrete(cepDigitado: string, regras: RegrasFrete): Promise<Estimativa | "cep_invalido" | "nao_achou"> {
  const cep = cepDigitado.replace(/\D/g, "");
  if (cep.length !== 8) return "cep_invalido";
  const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then((x) => x.json()).catch(() => null);
  if (!r || r.erro) return "nao_achou";
  const cidade: string = r.localidade, uf: string = r.uf;
  const base = { cep: `${cep.slice(0, 5)}-${cep.slice(5)}`, cidade, uf };
  if (regras.cidade && regras.cidade_valor != null && semAcento(regras.cidade) === semAcento(cidade) && (!regras.uf || regras.uf.toUpperCase() === uf))
    return { ...base, valor: Number(regras.cidade_valor), onde: "mesma cidade" };
  if (regras.uf && regras.uf_valor != null && regras.uf.toUpperCase() === uf) return { ...base, valor: Number(regras.uf_valor), onde: `dentro de ${uf}` };
  const regiao = REGIAO_DA_UF[uf];
  const v = regiao ? regras.regioes?.[regiao] : null;
  return { ...base, valor: v != null ? Number(v) : null, onde: regiao ? `região ${NOMES_REGIOES[regiao]}` : "" };
}
