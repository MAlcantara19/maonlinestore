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
];

export const OPCOES_FONTE = [
  { valor: "moderna", rotulo: "Moderna (padrão)" },
  { valor: "elegante", rotulo: "Elegante (com serifa)" },
  { valor: "divertida", rotulo: "Divertida (arredondada)" },
] as const;
