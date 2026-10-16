"use client";
// =====================================================================
// IMAGEM SUAVE — a foto aparece com um "fade" quando termina de carregar
// (carregamento progressivo), em vez de surgir de repente.
// =====================================================================
import { useEffect, useRef, useState } from "react";

export default function ImagemSuave({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [carregou, setCarregou] = useState(false);

  // Se a foto já estava guardada no navegador, ela "carrega" antes do React ver: confere aqui.
  useEffect(() => {
    if (ref.current?.complete) setCarregou(true);
  }, []);

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setCarregou(true)}
      className={className}
      style={{ opacity: carregou ? 1 : 0, transition: "opacity 0.5s ease, transform 0.5s ease" }}
    />
  );
}
