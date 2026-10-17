// =====================================================================
// TEMA DA LOJA — "veste" a página com a aparência de cada loja.
// Tudo vem da tabela "lojas", então cada loja personaliza a sua
// sem ninguém precisar mexer no código:
//   cor_fundo → fundo da página
//   fonte     → estilo dos títulos (moderna, elegante, divertida)
// Também coloca: carrinho flutuante (com o carrinho lateral), voltar ao
// topo e o botão de dúvidas (WhatsApp). As animações ficam em
// components/EstilosAnimacao.tsx (usadas também na página inicial e em parceiros).
// =====================================================================
import { FONTES } from "@/lib/fontes";
import FundoDaPagina from "@/components/FundoDaPagina";
import type { CSSProperties, ReactNode } from "react";
import type { Loja } from "@/lib/tipos";
import VoltarAoTopo from "@/components/VoltarAoTopo";
import BotaoDuvidas from "@/components/BotaoDuvidas";
import CarrinhoFlutuante from "@/components/CarrinhoFlutuante";
import Rodape from "@/components/Rodape";
import EstilosAnimacao from "@/components/EstilosAnimacao";

// (As fontes ficam em lib/fontes.ts)


export default function TemaDaLoja({ loja, children }: { loja: Loja; children: ReactNode }) {
  const fonte = FONTES[loja.fonte ?? "moderna"] ?? FONTES.moderna;
  const cor = loja.cor ?? "#333";

  const temFundo = !!loja.fundo_tipo && loja.fundo_tipo !== "nenhum";
  const estilo = {
    background: temFundo ? "transparent" : loja.cor_fundo ?? undefined, // com fundo, a cor vai por baixo dele
    color: loja.cor_fundo ? "#1c1917" : undefined, // fundo claro pede texto escuro
    "--fonte-titulo": fonte.familia,
  } as CSSProperties;

  return (
    // flex-col + min-h-screen: a página ocupa no mínimo a tela toda, e o rodapé fica no fim
    <div className={`tema-loja flex min-h-screen flex-col ${temFundo ? "com-fundo" : ""}`} style={estilo}>
      <FundoDaPagina tipo={loja.fundo_tipo} url={loja.fundo_url} logo={loja.logo_url} opacidade={loja.fundo_opacidade} corBase={loja.cor_fundo} animacao={loja.fundo_animacao}
        corMosaico={loja.fundo_cor} borda={{ cor: loja.logo_borda_cor, largura: loja.logo_borda }} />
      {fonte.link && <link rel="stylesheet" href={fonte.link} precedence="default" />}
      <style>{`.tema-loja h1, .tema-loja h2, .tema-loja h3 { font-family: var(--fonte-titulo); }`}</style>
      <EstilosAnimacao />
      {children}
      <Rodape loja={loja} />
      <CarrinhoFlutuante loja={loja} />
      {loja.whatsapp && <BotaoDuvidas whatsapp={loja.whatsapp} nomeDaLoja={loja.nome} slug={loja.slug} />}
      <VoltarAoTopo cor={cor} />
    </div>
  );
}
