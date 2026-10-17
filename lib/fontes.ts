// =====================================================================
// FONTES DOS TÍTULOS — cada opção: endereço no Google Fonts e família.
// Para acrescentar uma: inclua aqui, em OPCOES_FONTE (lib/opcoes.ts)
// e no banco (alter type tipo_fonte add value '...').
// =====================================================================
export const FONTES: Record<string, { link: string | null; familia: string }> = {
  moderna: { link: null, familia: "inherit" },
  elegante: { link: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap", familia: "'Playfair Display', Georgia, serif" },
  divertida: { link: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&display=swap", familia: "'Baloo 2', 'Comic Sans MS', sans-serif" },
  cursiva: { link: "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap", familia: "'Great Vibes', cursive" },
  manuscrita: { link: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap", familia: "'Dancing Script', cursive" },
  classica: { link: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap", familia: "'Cinzel', Georgia, serif" },
  arredondada: { link: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&display=swap", familia: "'Fredoka', sans-serif" },
  retro: { link: "https://fonts.googleapis.com/css2?family=Righteous&display=swap", familia: "'Righteous', sans-serif" },
  marcante: { link: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap", familia: "'Bebas Neue', Impact, sans-serif" },
};

export const familiaDa = (fonte?: string | null) => (fonte && FONTES[fonte] ? FONTES[fonte].familia : undefined);
