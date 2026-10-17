"use client";
// =====================================================================
// EFEITOS ANIMADOS — símbolos, a LOGO da loja ou IMAGENS PERSONALIZADAS
// pela tela. Movimentos:
//   cair   → caem balançando        subir → sobem flutuando
//   piscar → brilham parados        voar  → passeiam pela tela
// "contido" = desenha dentro de uma caixa (prévia no painel), não na tela toda.
// Não atrapalha cliques (pointer-events: none).
// =====================================================================
import { useEffect, useState } from "react";
import type { EfeitoPersonalizado } from "@/lib/tipos";

type Movimento = "cair" | "subir" | "piscar" | "voar";
type Config = { simbolos: string[]; movimento: Movimento; cores?: string[]; quantidade: number; imagens?: string[]; tamanhoImagem?: number; redondo?: boolean };

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
  logo: { simbolos: ["✨"], movimento: "cair", quantidade: 10 },
  logo_voando: { simbolos: ["✨"], movimento: "voar", quantidade: 7 },
};

// Número "aleatório" mas sempre igual para o mesmo índice
const sorteio = (i: number, semente: number) => {
  const x = Math.sin(i * 9301 + semente * 49297) * 233280;
  return x - Math.floor(x);
};

type Props = { tipo?: string | null; cor: string; logo?: string | null; personalizado?: EfeitoPersonalizado | null; contido?: boolean };

export default function EfeitoFestivo({ tipo, cor, logo, personalizado, contido }: Props) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []); // só desenha no navegador

  // Monta a configuração: efeito personalizado (imagens) ou um dos prontos
  let config: Config | undefined;
  if (personalizado && personalizado.imagens.length) {
    config = { simbolos: [], movimento: personalizado.movimento, quantidade: personalizado.quantidade, imagens: personalizado.imagens, tamanhoImagem: personalizado.tamanho };
  } else if (tipo && EFEITOS[tipo]) {
    config = { ...EFEITOS[tipo] };
    // Logo da loja/da MA: sempre REDONDA, com bordinha branca
    if ((tipo === "logo" || tipo === "logo_voando") && logo) { config.imagens = [logo]; config.tamanhoImagem = 34; config.redondo = true; }
  }
  if (!montado || !config) return null;
  const cores = config.cores ?? [cor];
  const usaImagem = !!config.imagens?.length;

  return (
    <div aria-hidden className={`pointer-events-none overflow-hidden ${contido ? "absolute inset-0 z-0" : "fixed inset-0 z-50"}`}>
      {Array.from({ length: config.quantidade }, (_, i) => {
        const esquerda = Math.round(sorteio(i, 1) * 100);
        const base = config.tamanhoImagem ?? 18;
        const tamanho = usaImagem ? Math.round(base * (0.7 + sorteio(i, 2) * 0.6)) : 10 + Math.round(sorteio(i, 2) * 14);
        const duracao =
          config.movimento === "piscar" ? 2 + (i % 4) : config.movimento === "voar" ? 14 + Math.round(sorteio(i, 3) * 10) : 9 + Math.round(sorteio(i, 3) * 8);
        const atraso = -(sorteio(i, 4) * duracao);

        const conteudo = usaImagem ? (
          <img src={config.imagens![i % config.imagens!.length]} alt=""
            className={config.redondo ? "rounded-full border-2 border-white bg-white object-cover shadow-lg" : "object-contain drop-shadow-md"}
            style={{ width: tamanho, height: tamanho }} />
        ) : (
          config.simbolos[i % config.simbolos.length]
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
          const vw = (s: number) => `${Math.round((sorteio(i, s) - 0.5) * 70)}${contido ? "%" : "vw"}`;
          const vh = (s: number) => `${Math.round((sorteio(i, s) - 0.5) * 70)}${contido ? "%" : "vh"}`;
          return (
            <span key={i} className="efeito-particula efeito-voar"
              style={{
                left: `${esquerda}%`, top: `${Math.round(sorteio(i, 6) * 85)}%`, fontSize: tamanho * 1.6, opacity: 0.9,
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
            style={{ left: `${esquerda}%`, top: config.movimento === "cair" ? "-12%" : "105%", fontSize: tamanho,
              color: cores[i % cores.length], opacity: 0.85, animationDuration: `${duracao}s`, animationDelay: `${atraso}s` }}>
            <span className="efeito-balancar" style={{ animationDuration: `${2 + (i % 3)}s` }}>{conteudo}</span>
          </span>
        );
      })}
    </div>
  );
}
