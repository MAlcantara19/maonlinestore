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
];

export const OPCOES_FONTE = [
  { valor: "moderna", rotulo: "Moderna (padrão)" },
  { valor: "elegante", rotulo: "Elegante (com serifa)" },
  { valor: "divertida", rotulo: "Divertida (arredondada)" },
] as const;

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
