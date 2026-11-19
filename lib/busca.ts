// =====================================================================
// 🔎 BUSCA INTELIGENTE — entende erros de digitação, acentos, plural e
// alguns sinônimos:
//   "arvori de natau" → acha "Árvore de Natal"
//   "chavero"         → acha "Chaveiro"
//   "xicara"          → acha "Caneca" (sinônimo)
// Funciona aqui no navegador (grade da loja) e também no banco (função
// buscar_produtos, da atualização 31), que usa o mesmo jeito de pensar.
// =====================================================================

// Tira acentos, maiúsculas e sinais: "Árvore!" → "arvore"
export const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

// Palavras que não ajudam a achar nada
const VAZIAS = new Set(["de", "da", "do", "das", "dos", "e", "com", "para", "pra", "o", "a", "os", "as", "um", "uma", "em", "no", "na"]);

// Sinônimos (cada grupo vale como "a mesma coisa"). Acrescente à vontade.
const SINONIMOS: string[][] = [
  ["caneca", "xicara", "copo"],
  ["chaveiro", "chaveirinho"],
  ["vela", "velas", "aromatizador", "aroma"],
  ["bombom", "bombons", "chocolate", "trufa"],
  ["presente", "lembrancinha", "lembranca", "mimo", "brinde"],
  ["boneco", "bonequinho", "figura", "miniatura", "action"],
  ["vaso", "cachepo", "cachepot"],
  ["luminaria", "abajur", "luz"],
  ["bolsa", "sacola", "ecobag", "ecobags"],
  ["natal", "natalino", "natalina", "noel"],
  ["pascoa", "coelho", "ovo"],
  ["porta", "suporte"],
  ["crianca", "infantil", "kids"],
];

// Plural simples: "canecas" → "caneca", "flores" → "flor", "aneis" → "anel"
function singular(p: string) {
  if (p.length > 4 && p.endsWith("oes")) return p.slice(0, -3) + "ao";
  if (p.length > 4 && p.endsWith("eis")) return p.slice(0, -3) + "el";
  if (p.length > 4 && p.endsWith("res")) return p.slice(0, -2);
  if (p.length > 3 && p.endsWith("s")) return p.slice(0, -1);
  return p;
}

// Quantas letras precisa mudar para uma palavra virar a outra
export function distancia(a: string, b: string, limite = 3): number {
  if (Math.abs(a.length - b.length) > limite) return limite + 1;
  let ant = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      atual[j] = Math.min(ant[j] + 1, atual[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      menor = Math.min(menor, atual[j]);
    }
    if (menor > limite) return limite + 1;
    ant = atual;
  }
  return ant[b.length];
}

// Erros aceitos conforme o tamanho da palavra
const tolerancia = (p: string) => (p.length <= 3 ? 0 : p.length <= 5 ? 1 : 2);

const palavrasDe = (t: string) => normalizar(t).split(" ").filter((p) => p && !VAZIAS.has(p)).map(singular);

function variantes(p: string): string[] {
  const grupo = SINONIMOS.find((g) => g.map(singular).includes(p));
  return grupo ? [...new Set([p, ...grupo.map(singular)])] : [p];
}

// Nota de 0 a 1: quanto o texto combina com a busca (0 = não combina)
export function nota(texto: string, busca: string): number {
  const termos = palavrasDe(busca);
  if (!termos.length) return 1;
  const alvo = normalizar(texto);
  const palavras = alvo.split(" ").map(singular);
  let soma = 0;
  for (const termo of termos) {
    let melhor = 0;
    for (const v of variantes(termo)) {
      const sinonimo = v !== termo ? 0.85 : 1;
      if (alvo.includes(v)) { melhor = Math.max(melhor, 1 * sinonimo); continue; }
      for (const pal of palavras) {
        if (pal.startsWith(v) || (v.length >= 4 && v.startsWith(pal) && pal.length >= 3)) melhor = Math.max(melhor, 0.9 * sinonimo);
        const d = distancia(v, pal, 2);
        if (d <= tolerancia(v)) melhor = Math.max(melhor, (0.8 - d * 0.1) * sinonimo);
        // começo da palavra com erro ("arvo" → "arvore")
        if (v.length >= 4 && pal.length > v.length && distancia(v, pal.slice(0, v.length), 1) <= 1) melhor = Math.max(melhor, 0.6 * sinonimo);
      }
    }
    if (melhor === 0) return 0; // todas as palavras precisam combinar
    soma += melhor;
  }
  return soma / termos.length;
}

// Filtra e ordena uma lista pelo que mais combina
export function buscarNaLista<T>(lista: T[], busca: string, textoDe: (item: T) => string): T[] {
  if (!normalizar(busca)) return lista;
  return lista
    .map((item, i) => ({ item, i, n: nota(textoDe(item), busca) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.item);
}

// "Você quis dizer...?" — a palavra parecida que existe nos nomes
export function sugestao(busca: string, textos: string[]): string | null {
  const vocabulario = new Set(textos.flatMap((t) => normalizar(t).split(" ")).filter((p) => p.length > 2));
  let mudou = false;
  const corrigida = normalizar(busca).split(" ").map((termo) => {
    if (termo.length < 3 || vocabulario.has(termo)) return termo;
    let melhor: { p: string; d: number } | null = null;
    for (const p of vocabulario) {
      const d = distancia(termo, p, 3);
      if (d <= 3 && (!melhor || d < melhor.d)) melhor = { p, d };
    }
    if (melhor) { mudou = true; return melhor.p; }
    return termo;
  });
  return mudou ? corrigida.join(" ") : null;
}
