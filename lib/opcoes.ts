// =====================================================================
// OPÇÕES DAS LISTAS — os mesmos valores dos "enums" do banco
// (atualizacao-05), com o texto bonito que aparece no painel.
// Se criar uma opção nova no banco, acrescente aqui também.
// =====================================================================
import type { Efeito } from "@/lib/tipos";

export const OPCOES_EFEITO: { valor: Efeito; rotulo: string }[] = [
  { valor: "nenhum", rotulo: "Nenhum" },
  { valor: "neve", rotulo: "❄️ Neve" },
  { valor: "estrelas", rotulo: "⭐ Estrelas caindo" },
  { valor: "brilhos", rotulo: "✨ Brilhos piscando" },
  { valor: "coracoes", rotulo: "❤️ Corações subindo" },
  { valor: "confete", rotulo: "🎉 Confete" },
  { valor: "bolhas", rotulo: "🫧 Bolhas subindo" },
  { valor: "chocolate", rotulo: "🍫 Chocolate" },
  { valor: "doces", rotulo: "🍭 Doces" },
  { valor: "flores", rotulo: "🌸 Flores" },
  { valor: "presentes", rotulo: "🎁 Presentes" },
  { valor: "logo", rotulo: "🖼️ Logo da loja caindo" },
  { valor: "logo_voando", rotulo: "🖼️ Logo da loja voando pela tela" },
  { valor: "borboletas", rotulo: "🦋 Borboletas voando" },
  { valor: "baloes", rotulo: "🎈 Balões subindo" },
  // Datas especiais
  { valor: "natal", rotulo: "🎄 Natal (árvores, Papai Noel, bonecos de neve)" },
  { valor: "pascoa", rotulo: "🐰 Páscoa (coelhos e ovos)" },
  { valor: "halloween", rotulo: "🎃 Halloween (abóboras e fantasminhas)" },
  { valor: "namorados", rotulo: "💘 Dia dos Namorados" },
  { valor: "maes", rotulo: "💐 Dia das Mães" },
  { valor: "brasil", rotulo: "🇧🇷 Brasil (verde e amarelo)" },
  { valor: "futebol", rotulo: "⚽ Futebol (bolas e troféus)" },
  // Natureza e clima
  { valor: "folhas", rotulo: "🍂 Folhas de outono" },
  { valor: "chuva", rotulo: "💧 Chuvinha" },
  { valor: "nuvens", rotulo: "☁️ Nuvens passeando" },
  // Outros
  { valor: "fogos", rotulo: "🎆 Fogos de artifício" },
  { valor: "joias", rotulo: "💎 Joias brilhando" },
  { valor: "notas", rotulo: "🎵 Notas musicais" },
  { valor: "patinhas", rotulo: "🐾 Patinhas" },
  { valor: "foguetes", rotulo: "🚀 Foguetes subindo" },
  { valor: "dinheiro", rotulo: "💸 Dinheiro (promoção!)" },
  { valor: "sorvete", rotulo: "🍦 Sorvetes" },
  { valor: "cafe", rotulo: "☕ Cafezinho" },
];

export const OPCOES_FONTE = [
  { valor: "moderna", rotulo: "Moderna (padrão)" },
  { valor: "elegante", rotulo: "Elegante (com serifa)" },
  { valor: "divertida", rotulo: "Divertida (gordinha)" },
  { valor: "cursiva", rotulo: "✍️ Cursiva bem desenhada" },
  { valor: "manuscrita", rotulo: "✍️ Manuscrita" },
  { valor: "classica", rotulo: "🏛️ Clássica (maiúsculas)" },
  { valor: "arredondada", rotulo: "🫧 Arredondada" },
  { valor: "retro", rotulo: "🕹️ Retrô" },
  { valor: "marcante", rotulo: "📢 Marcante (alta e fina)" },
] as const;

// Coleções: "Natal" → "Coleção Natal" (sem repetir se já tiver)
export const nomeColecao = (nome: string) => (/^cole[cç][aã]o\b/i.test(nome.trim()) ? nome.trim() : `Coleção ${nome.trim()}`);

// ---------------------------------------------------------------------
// SUGESTÕES PRONTAS (aparecem como lista ao clicar no campo; dá para
// escolher uma ou digitar outra). Acrescente o que quiser aqui.
// ---------------------------------------------------------------------
export const SUGESTOES_SELO = [
  "Novo", "Mais vendido", "Últimas unidades", "Promoção", "Lançamento",
  "Exclusivo", "Edição limitada", "Personalizável", "Pronta entrega", "Queridinho ❤️",
];
export const SUGESTOES_PRAZO = ["1 dia", "2 dias", "3 dias", "5 dias", "7 dias", "10 dias", "15 dias", "20 dias", "30 dias"];
export const SUGESTOES_TAMANHO = ["Único", "PP", "P", "M", "G", "GG", "5 cm", "10 cm", "15 cm", "20 cm", "30 cm", "100 ml", "250 ml", "500 ml", "1 kg"];
export const SUGESTOES_COR = [
  "Branco", "Preto", "Cinza", "Azul", "Rosa", "Vermelho", "Verde", "Amarelo", "Laranja",
  "Roxo", "Lilás", "Dourado", "Prata", "Bege", "Marrom", "Transparente", "Branco pérola",
];
export const SUGESTOES_CATEGORIA_PARCEIRO = ["Judô", "Escola", "Saúde", "Médico", "Nutrição", "Academia", "Estética", "Alimentação", "Sites & Judô"];
export const SUGESTOES_SELO_PARCEIRO = ["Patrocinado", "Parceiro oficial", "Indicação", "Desconto", "10% de desconto", "Novo"];

// Prazo digitado só com número ("10") vira "10 dias"
export function prazoComDias(texto: string): string | null {
  const t = texto.trim();
  if (!t) return null;
  return /^\d+$/.test(t) ? `${t} ${t === "1" ? "dia" : "dias"}` : t;
}

// Tamanho digitado só com número ("20") ganha a unidade da loja ("20 cm")
export function tamanhoComUnidade(texto: string, unidade: string | null | undefined): string {
  const t = texto.trim();
  return unidade && /^\d+([.,]\d+)?$/.test(t) ? `${t} ${unidade}` : t;
}

export const OPCOES_UNIDADE = [
  { valor: "cm", rotulo: "cm (centímetros)" },
  { valor: "mm", rotulo: "mm (milímetros)" },
  { valor: "ml", rotulo: "ml (mililitros)" },
  { valor: "L", rotulo: "L (litros)" },
  { valor: "g", rotulo: "g (gramas)" },
  { valor: "kg", rotulo: "kg (quilos)" },
  { valor: "un.", rotulo: "un. (unidades)" },
  { valor: "", rotulo: "Sem unidade (ex.: P, M, G, aro 16)" },
];

// "azul turquesa" → "Azul turquesa" (cores sempre começam com maiúscula)
export function comMaiuscula(texto: string): string {
  const t = texto.trim();
  return t ? t.charAt(0).toLocaleUpperCase("pt-BR") + t.slice(1) : t;
}

// Ordem alfabética ignorando acentos e maiúsculas
export const emOrdem = (lista: string[]) =>
  [...new Set(lista)].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

// Todas as categorias de um produto (a lista nova + a antiga, por segurança)
export function categoriasDoProduto(p: { categoria_id: string | null; produtos_categorias?: { categoria_id: string }[] }): string[] {
  return [...new Set([...(p.produtos_categorias ?? []).map((x) => x.categoria_id), ...(p.categoria_id ? [p.categoria_id] : [])])];
}
