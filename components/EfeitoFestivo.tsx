"use client";
// =====================================================================
// EFEITOS ANIMADOS — símbolos (ou a LOGO da loja) pela tela.
// Três tipos de movimento:
//   cair   → caem balançando (neve, estrelas, confete, logo...)
//   subir  → sobem flutuando (corações, bolhas, balões)
//   piscar → brilham parados em pontos da tela (brilhos)
//   voar   → passeiam pela tela em caminhos diferentes (borboletas, logo voando)
// Não atrapalha cliques (pointer-events: none).
// =====================================================================
import { useEffect, useState } from "react";

type Movimento = "cair" | "subir" | "piscar" | "voar";
type Config = { simbolos: string[]; movimento: Movimento; cores?: string[]; quantidade: number; usaLogo?: boolean };

const EFEITOS: Record<string, Config> = {
  neve: { simbolos: ["❄", "❅", "•"], movimento: "cair", cores: ["#9cc3ee", "#c4dcf5"], quantidade: 22 },
  estrelas: { simbolos: ["✦", "✧", "★"], movimento: "cair", cores: ["#f5c542", "#ffd97a"], quantidade: 16 },
  brilhos: { simbolos: ["✦", "✧", "✨"], movimento: "piscar", cores: ["#f5c542", "#ffe9a8"], quantidade: 24 },
  coracoes: { simbolos: ["❤", "♥", "💕"], movimento: "subir", quantidade: 14 },
  confete: { simbolos: ["■", "●", "▲"], movimento: "cair", cores: ["#ef5350", "#42a5f5", "#66bb6a", "#f5c542", "#ab47bc"], quantidade: 26 },
  bolhas: { simbolos: ["○", "◯"], movimento: "subir", quantidade: 14 },
  chocolate: { simbolos: ["🍫", "🍫", "🍬"], movimento: "cair", quantidade: 14 },
  doces: { simbolos: ["🍭", "🍬", "🧁", "🍩"], movimento: "cair", quantidade: 14 },
  flores: { simbolos: ["🌸", "🌷", "🌼"], movimento: "cair", quantidade: 14 },
  presentes: { simbolos: ["🎁", "🎀"], movimento: "cair", quantidade: 12 },
  borboletas: { simbolos: ["🦋"], movimento: "voar", quantidade: 8 },
  baloes: { simbolos: ["🎈", "🎈", "🎉"], movimento: "subir", quantidade: 10 },
  logo: { simbolos: ["✨"], movimento: "cair", quantidade: 10, usaLogo: true },
  logo_voando: { simbolos: ["✨"], movimento: "voar", quantidade: 7, usaLogo: true },
};

// Número "aleatório" mas sempre igual para o mesmo índice (evita pular ao recarregar)
const sorteio = (i: number, semente: number) => {
  const x = Math.sin(i * 9301 + semente * 49297) * 233280;
  return x - Math.floor(x);
};

export default function EfeitoFestivo({ tipo, cor, logo }: { tipo: string; cor: string; logo?: string | null }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []); // só desenha no navegador

  const config = EFEITOS[tipo];
  if (!montado || !config) return null;
  const cores = config.cores ?? [cor];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: config.quantidade }, (_, i) => {
        const esquerda = Math.round(sorteio(i, 1) * 100);
        const tamanho = config.usaLogo ? 26 + Math.round(sorteio(i, 2) * 18) : 10 + Math.round(sorteio(i, 2) * 14);
        const duracao =
          config.movimento === "piscar" ? 2 + (i % 4) : config.movimento === "voar" ? 14 + Math.round(sorteio(i, 3) * 10) : 9 + Math.round(sorteio(i, 3) * 8);
        const atraso = -(sorteio(i, 4) * duracao); // negativo = já começa espalhado
        const simbolo = config.simbolos[i % config.simbolos.length];

        // O que aparece: a logo redondinha ou o símbolo
        const conteudo = config.usaLogo && logo ? (
          <img src={logo} alt="" className="rounded-full bg-white object-cover shadow-md" style={{ width: tamanho, height: tamanho }} />
        ) : (
          simbolo
        );

        if (config.movimento === "piscar") {
          return (
            <span key={i} className="efeito-particula efeito-piscar"
              style={{ left: `${esquerda}%`, top: `${Math.round(sorteio(i, 5) * 100)}%`, fontSize: tamanho, color: cores[i % cores.length],
                animationDuration: `${duracao}s`, animationDelay: `${atraso}s` }}>
              {conteudo}
            </span>
          );
        }

        if (config.movimento === "voar") {
          // Cada um com um caminho diferente (4 pontos sorteados), indo e voltando
          const vw = (s: number) => `${Math.round((sorteio(i, s) - 0.5) * 70)}vw`;
          const vh = (s: number) => `${Math.round((sorteio(i, s) - 0.5) * 70)}vh`;
          return (
            <span key={i} className="efeito-particula efeito-voar"
              style={{
                left: `${esquerda}%`, top: `${Math.round(sorteio(i, 6) * 85)}%`, fontSize: tamanho * 1.6, opacity: 0.85,
                animationDuration: `${duracao}s`, animationDelay: `${atraso}s`,
                ["--x1" as string]: vw(7), ["--y1" as string]: vh(8), ["--x2" as string]: vw(9), ["--y2" as string]: vh(10),
                ["--x3" as string]: vw(11), ["--y3" as string]: vh(12),
              }}>
              {conteudo}
            </span>
          );
        }

        return (
          <span key={i} className={`efeito-particula efeito-${config.movimento}`}
            style={{ left: `${esquerda}%`, top: config.movimento === "cair" ? "-8vh" : "105vh", fontSize: tamanho,
              color: cores[i % cores.length], opacity: 0.8, animationDuration: `${duracao}s`, animationDelay: `${atraso}s` }}>
            <span className="efeito-balancar" style={{ animationDuration: `${2 + (i % 3)}s` }}>{conteudo}</span>
          </span>
        );
      })}
    </div>
  );
}
