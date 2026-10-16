"use client";
// =====================================================================
// EFEITOS ANIMADOS — símbolos pela tela, configuráveis no banco:
//   neve     ❄  caem devagar, balançando
//   estrelas ✦  caem girando, balançando (douradas)
//   brilhos  ✨  piscam parados em pontos da tela
//   coracoes ❤  sobem flutuando
//   confete  ■● caem coloridos, girando
//   bolhas   ○  sobem e somem
//   chocolate 🍫 · doces 🍭 · flores 🌸 · presentes 🎁  caem balançando
// Liga pela coleção em destaque (ex.: Natal) ou pela própria loja.
// Não atrapalha cliques (pointer-events: none).
// =====================================================================
import { useEffect, useState } from "react";

type Movimento = "cair" | "subir" | "piscar";
type Config = { simbolos: string[]; movimento: Movimento; cores?: string[]; quantidade: number };

// Cada efeito: símbolos, tipo de movimento, cores e quantidade.
// (cores vazias = usa a cor da loja)
const EFEITOS: Record<string, Config> = {
  neve: { simbolos: ["❄", "❅", "•"], movimento: "cair", cores: ["#9cc3ee", "#c4dcf5"], quantidade: 22 },
  estrelas: { simbolos: ["✦", "✧", "★"], movimento: "cair", cores: ["#f5c542", "#ffd97a"], quantidade: 16 },
  brilhos: { simbolos: ["✦", "✧", "✨"], movimento: "piscar", cores: ["#f5c542", "#ffe9a8"], quantidade: 24 },
  coracoes: { simbolos: ["❤", "♥", "💕"], movimento: "subir", quantidade: 14 },
  confete: { simbolos: ["■", "●", "▲"], movimento: "cair", cores: ["#ef5350", "#42a5f5", "#66bb6a", "#f5c542", "#ab47bc"], quantidade: 26 },
  bolhas: { simbolos: ["○", "◯"], movimento: "subir", quantidade: 14 },
  // Emojis já têm cor própria (a cor aqui é ignorada)
  chocolate: { simbolos: ["🍫", "🍫", "🍬"], movimento: "cair", quantidade: 14 },
  doces: { simbolos: ["🍭", "🍬", "🧁", "🍩"], movimento: "cair", quantidade: 14 },
  flores: { simbolos: ["🌸", "🌷", "🌼"], movimento: "cair", quantidade: 14 },
  presentes: { simbolos: ["🎁", "🎀"], movimento: "cair", quantidade: 12 },
};

export default function EfeitoFestivo({ tipo, cor }: { tipo: string; cor: string }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []); // só desenha no navegador

  const config = EFEITOS[tipo];
  if (!montado || !config) return null;
  const cores = config.cores ?? [cor];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: config.quantidade }, (_, i) => {
        // Números "embaralhados" pelo índice: cada símbolo tem posição, tamanho e velocidade diferentes
        const esquerda = (i * 53) % 100;
        const tamanho = 10 + ((i * 5) % 14);
        const duracao = config.movimento === "piscar" ? 2 + (i % 4) : 9 + ((i * 7) % 8);
        const atraso = -((i * 3.7) % duracao); // negativo = já começa espalhado pela tela
        const simbolo = config.simbolos[i % config.simbolos.length];
        const corDoSimbolo = cores[i % cores.length];

        // Brilhos: ficam parados num ponto e piscam
        if (config.movimento === "piscar") {
          return (
            <span key={i} className="efeito-particula efeito-piscar"
              style={{ left: `${esquerda}%`, top: `${(i * 37) % 100}%`, fontSize: tamanho, color: corDoSimbolo,
                animationDuration: `${duracao}s`, animationDelay: `${atraso}s` }}>
              {simbolo}
            </span>
          );
        }

        // Cair (começa acima da tela) ou subir (começa abaixo), balançando para os lados
        return (
          <span key={i} className={`efeito-particula efeito-${config.movimento}`}
            style={{ left: `${esquerda}%`, top: config.movimento === "cair" ? "-5vh" : "105vh", fontSize: tamanho,
              color: corDoSimbolo, opacity: 0.8, animationDuration: `${duracao}s`, animationDelay: `${atraso}s` }}>
            <span className="efeito-balancar" style={{ animationDuration: `${2 + (i % 3)}s` }}>{simbolo}</span>
          </span>
        );
      })}
    </div>
  );
}
