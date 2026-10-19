"use client";
// =====================================================================
// VISUALIZAÇÃO RÁPIDA — botão "+" no cartão. Abre uma janela GRANDE,
// como um "zoom" do cartão:
//   esquerda: a foto em 3D (arraste para girar, zoom) e as miniaturas
//   direita: nome, selo, descrição, avisos e a escolha de tamanho/cor
// Tudo sem sair da página da loja. No celular, sobe de baixo.
// =====================================================================
import Portal from "@/components/Portal";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Produto } from "@/lib/tipos";
import EscolhaDoProduto from "@/components/EscolhaDoProduto";
import Visualizador3D from "@/components/Visualizador3D";

export default function AdicionarRapido({ produto, slug, cor, foto }: { produto: Produto; slug: string; cor: string; foto?: string }) {
  const [aberto, setAberto] = useState(false);
  const fotos = [...produto.midias].filter((m) => m.tipo === "foto").sort((a, b) => a.ordem - b.ordem);
  const [atual, setAtual] = useState(0);

  // Janela aberta: a página de trás não rola, Esc fecha, e a foto acompanha a cor escolhida
  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    const aoEscolherCor = (e: Event) => {
      const { produto: id, cor: escolhida } = (e as CustomEvent<{ produto: string; cor: string | null }>).detail;
      if (id !== produto.id || !escolhida) return;
      const i = fotos.findIndex((f) => f.cor && f.cor.toLowerCase().trim() === escolhida.toLowerCase().trim());
      if (i >= 0) setAtual(i);
    };
    window.addEventListener("keydown", aoTeclar);
    window.addEventListener("cor-escolhida", aoEscolherCor);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("cor-escolhida", aoEscolherCor);
    };
  }, [aberto, fotos, produto.id]);

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} aria-label={`Ver ${produto.nome} de perto e adicionar`}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-white shadow-lg"
        style={{ background: cor }}>
        +
      </button>

      {aberto && (
        <Portal>
        <div className="tema-portal surgir fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setAberto(false)}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={produto.nome}
            className="subir max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white p-4 text-stone-900 shadow-2xl sm:rounded-3xl sm:p-6"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Link href={`/${slug}/p/${produto.id}`} className="text-sm font-semibold underline" style={{ color: cor }}>Abrir página completa →</Link>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="rounded-full bg-black/5 px-3 py-1 text-xl">✕</button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Foto em 3D + miniaturas */}
              <div>
                {fotos.length ? (
                  <Visualizador3D src={fotos[atual]?.url ?? foto!} alt={produto.nome} cor={cor} />
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-2xl text-sm opacity-70" style={{ background: `${cor}22` }}>sem foto</div>
                )}
                {fotos.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {fotos.map((f, i) => (
                      <button key={f.id} type="button" onClick={() => setAtual(i)} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2"
                        style={{ borderColor: i === atual ? cor : "transparent" }}>
                        <img src={f.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações e escolha */}
              <div>
                {produto.selo && <span className="brilho-texto mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: cor }}>{produto.selo}</span>}
                <h3 className="text-2xl font-bold">{produto.nome}</h3>
                {produto.descricao && <p className="mt-2 whitespace-pre-line text-sm opacity-80">{produto.descricao}</p>}
                {produto.restricoes && (
                  <div className="mt-3 rounded-xl border-l-4 p-3 text-sm" style={{ borderColor: cor, background: `${cor}12` }}>
                    <b className="mb-0.5 block" style={{ color: cor }}>📌 Importante saber</b>
                    <p className="whitespace-pre-line">{produto.restricoes}</p>
                  </div>
                )}
                <EscolhaDoProduto produto={produto} slug={slug} cor={cor} foto={fotos[atual]?.url ?? foto} aoAdicionar={() => setAberto(false)} />
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
