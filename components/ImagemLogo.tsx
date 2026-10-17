// =====================================================================
// LOGO DENTRO DO CÍRCULO — respeita o ajuste escolhido no painel:
//   cobrir  → preenche o círculo (pode cortar as bordas)
//   inteira → mostra a imagem toda, com a cor de fundo em volta
//   zoom    → 1 normal · menor afasta · maior aproxima
// Use dentro de um elemento redondo com overflow-hidden.
// =====================================================================
type Props = {
  src: string;
  alt?: string;
  ajuste?: string | null;
  zoom?: number | null;
  fundo?: string | null;
};

export default function ImagemLogo({ src, alt = "", ajuste, zoom, fundo }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full"
      style={{
        objectFit: ajuste === "inteira" ? "contain" : "cover",
        transform: `scale(${Number(zoom ?? 1)})`,
        background: fundo ?? "#ffffff",
      }}
    />
  );
}
