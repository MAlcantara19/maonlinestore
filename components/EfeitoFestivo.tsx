"use client";
// =====================================================================
// EFEITO FESTIVO — símbolos caindo devagar pela tela (neve no Natal,
// corações, estrelas). Liga quando uma coleção EM DESTAQUE tem "efeito".
// Não atrapalha cliques (pointer-events: none).
// =====================================================================
import { useEffect, useState } from "react";

const SIMBOLOS = { neve: "❄", coracoes: "❤", estrelas: "✦" } as const;

export default function EfeitoFestivo({ tipo, cor }: { tipo: string; cor: string }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []); // só desenha no navegador

  const simbolo = SIMBOLOS[tipo as keyof typeof SIMBOLOS];
  if (!montado || !simbolo) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 18 }, (_, i) => {
        // Valores "embaralhados" pelo número de cada símbolo: posição, tamanho e velocidade diferentes
        const duracao = 9 + ((i * 7) % 8);
        return (
          <span key={i} className="efeito-particula absolute"
            style={{
              left: `${(i * 53) % 100}%`,
              top: "-5vh",
              fontSize: 10 + ((i * 5) % 14),
              color: tipo === "neve" ? "#9cc3ee" : cor,
              opacity: 0.75,
              animationDuration: `${duracao}s`,
              animationDelay: `-${(i * 3.7) % duracao}s`, // já começa espalhado pela tela
            }}>
            {simbolo}
          </span>
        );
      })}
    </div>
  );
}
