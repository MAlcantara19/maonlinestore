"use client";
// =====================================================================
// EFEITOS DA LOJA POR SEÇÃO — o efeito muda conforme a parte da página
// que o cliente está vendo. Ex.: chegou na subcategoria "Patos", começam
// a cair patinhos; saiu dela, volta o efeito normal da loja.
//   padrão: efeito da loja (personalizado ou pronto)
//   secoes: { "sub-<id>": efeito, "categoria-<id>": efeito, "colecao-<id>": efeito }
// =====================================================================
import { useEffect, useState } from "react";
import type { EfeitoPersonalizado } from "@/lib/tipos";
import EfeitoFestivo from "@/components/EfeitoFestivo";

type Props = {
  cor: string;
  logo?: string | null;
  tipoPadrao?: string | null;
  personalizadoPadrao?: EfeitoPersonalizado | null;
  secoes: Record<string, EfeitoPersonalizado>;
};

export default function EfeitosDaLoja({ cor, logo, tipoPadrao, personalizadoPadrao, secoes }: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);

  useEffect(() => {
    const ids = Object.keys(secoes);
    if (!ids.length) return;
    const visiveis = new Map<string, number>();
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => visiveis.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
        // A seção (com efeito) que mais aparece na tela, se aparecer bem
        let melhor: string | null = null;
        let maior = 0.2;
        visiveis.forEach((v, id) => { if (v > maior) { maior = v; melhor = id; } });
        setAtivo(melhor);
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) observador.observe(el); });
    return () => observador.disconnect();
  }, [secoes]);

  // key: troca de efeito "reinicia" a animação
  if (ativo && secoes[ativo]) return <EfeitoFestivo key={ativo} cor={cor} personalizado={secoes[ativo]} />;
  return <EfeitoFestivo key="padrao" cor={cor} logo={logo} tipo={tipoPadrao} personalizado={personalizadoPadrao} />;
}
