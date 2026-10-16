"use client";
// =====================================================================
// ADICIONAR RÁPIDO — botão "+" no cartão do produto. Abre um popup com
// tamanho, cor, quantidade e observação, sem sair da página da loja.
// No celular o popup sobe de baixo; no computador aparece no centro.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Produto } from "@/lib/tipos";
import EscolhaDoProduto from "@/components/EscolhaDoProduto";

export default function AdicionarRapido({ produto, slug, cor, foto }: { produto: Produto; slug: string; cor: string; foto?: string }) {
  const [aberto, setAberto] = useState(false);

  // Popup aberto: a página de trás não rola, e a tecla Esc fecha.
  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", aoTeclar); };
  }, [aberto]);

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} aria-label={`Adicionar ${produto.nome} rapidamente`}
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-white shadow-lg"
        style={{ background: cor }}>
        +
      </button>

      {aberto && (
        // Fundo escuro: clicar nele fecha
        <div className="surgir fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setAberto(false)}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={produto.nome}
            className="subir max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 text-stone-900 shadow-2xl sm:rounded-2xl"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <div className="flex items-start gap-3">
              {foto && <img src={foto} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <b className="block text-lg leading-tight">{produto.nome}</b>
                <Link href={`/${slug}/p/${produto.id}`} className="text-sm underline" style={{ color: cor }}>Ver detalhes →</Link>
              </div>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="rounded-full px-2 text-xl">✕</button>
            </div>
            <EscolhaDoProduto produto={produto} slug={slug} cor={cor} foto={foto} aoAdicionar={() => setAberto(false)} />
          </div>
        </div>
      )}
    </>
  );
}
