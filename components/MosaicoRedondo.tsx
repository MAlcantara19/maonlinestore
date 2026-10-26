"use client";
// =====================================================================
// MOSAICO DE LOGOS REDONDAS — a logo repetida em bolinhas, cobrindo a
// área toda, andando devagar na diagonal sem "emendas".
//   corFundo = a cor que aparece ENTRE as bolinhas (vazio = transparente)
//   borda    = borda de cada bolinha (a mesma da logo da loja)
// Calcula no navegador SÓ as bolinhas que cabem na tela (página mais leve).
// =====================================================================
import { useEffect, useRef, useState } from "react";

type Props = { src: string; tamanho?: number; quantidade?: number; corFundo?: string | null; borda?: { cor?: string | null; largura?: number | null } };

export default function MosaicoRedondo({ src, tamanho = 96, quantidade, corFundo, borda }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(quantidade ?? 0);
  const b = Math.min(borda?.largura ?? 0, 6);

  // Quantas bolinhas cabem (com uma volta a mais para o movimento)
  useEffect(() => {
    if (quantidade) return;
    const calcular = () => {
      const el = caixa.current;
      if (!el) return;
      const colunas = Math.ceil(el.clientWidth / tamanho) + 3;
      const linhas = Math.ceil(el.clientHeight / tamanho) + 3;
      setTotal(colunas * linhas);
    };
    calcular();
    window.addEventListener("resize", calcular);
    return () => window.removeEventListener("resize", calcular);
  }, [tamanho, quantidade]);

  return (
    <div ref={caixa} className="absolute inset-0 overflow-hidden" style={{ background: corFundo ?? undefined }}>
      {/* A grade é um pouco maior que a tela e anda exatamente 1 bolinha: o loop fica perfeito */}
      <div className="mosaico-grade absolute grid"
        style={{ inset: -tamanho, gridTemplateColumns: `repeat(auto-fill, ${tamanho}px)`, ["--passo" as string]: `${tamanho}px` }}>
        {Array.from({ length: total }, (_, i) => (
          <img key={i} src={src} alt="" className="rounded-full object-cover" decoding="async"
            style={{ width: tamanho - 8, height: tamanho - 8, margin: 4, border: b ? `${b}px solid ${borda?.cor ?? "#fff"}` : undefined }} />
        ))}
      </div>
    </div>
  );
}
