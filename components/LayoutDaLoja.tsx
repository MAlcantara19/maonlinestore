// =====================================================================
// LAYOUT DA LOJA — a mesma "moldura" na loja, no produto e no carrinho:
//
//   computador grande:  [ menu lateral ] [ conteúdo ] [ painel direito ]
//   computador menor:   [ menu lateral ] [ conteúdo ]
//   celular:            barra de atalhos + gaveta ☰ e o conteúdo
//
// Painel direito: "Como funciona o pedido" e "Fale com a gente".
// Em telas menores, o "Como funciona o pedido" vira uma caixinha que
// abre e fecha acima do conteúdo (para não roubar espaço dos produtos).
// =====================================================================
import type { ReactNode } from "react";
import type { Loja } from "@/lib/tipos";
import type { ItemMenu } from "@/lib/menu";
import { usuarioInstagram } from "@/lib/formato";
import TemaDaLoja from "@/components/TemaDaLoja";
import CabecalhoDaLoja from "@/components/CabecalhoDaLoja";
import MenuLateral from "@/components/MenuLateral";
import IconeInstagram from "@/components/IconeInstagram";

export default function LayoutDaLoja({ loja, menu, children }: { loja: Loja; menu: ItemMenu[]; children: ReactNode }) {
  const cor = loja.cor ?? "#333";
  const fundoSuave = loja.cor_secundaria ? `${loja.cor_secundaria}55` : `${cor}14`;
  const insta = usuarioInstagram(loja.instagram);

  return (
    // TemaDaLoja aplica as cores, o fundo e a fonte desta loja (vêm do banco)
    <TemaDaLoja loja={loja}>
      <CabecalhoDaLoja loja={loja} menu={menu} />

      <div className="mx-auto w-full max-w-[90rem] lg:flex lg:items-start lg:gap-6 lg:px-4">
        <MenuLateral slug={loja.slug} cor={cor} corSecundaria={loja.cor_secundaria ?? null} menu={menu} whatsapp={loja.whatsapp ?? null} />

        <main className="min-w-0 flex-1 px-4 pt-4 pb-10 lg:px-0">
          {/* Telas menores: "Como funciona o pedido" recolhível */}
          {loja.aviso_pedido && (
            <details className="mt-2 rounded-xl border p-3 text-sm xl:hidden" style={{ borderColor: `${cor}55`, background: fundoSuave }}>
              <summary className="cursor-pointer font-semibold">📦 Como funciona o pedido</summary>
              <p className="mt-2 whitespace-pre-line">{loja.aviso_pedido}</p>
            </details>
          )}
          {children}
        </main>

        {/* Computador grande: painel direito, preso ao rolar */}
        <aside className="sticky top-20 mt-4 hidden w-72 shrink-0 space-y-4 xl:block">
          {loja.aviso_pedido && (
            <section className="rounded-2xl border p-4 text-sm shadow-sm" style={{ borderColor: `${cor}55`, background: fundoSuave }}>
              <b className="mb-2 block text-base" style={{ color: cor }}>📦 Como funciona o pedido</b>
              <p className="whitespace-pre-line">{loja.aviso_pedido}</p>
            </section>
          )}
          {(loja.whatsapp || insta) && (
            <section className="rounded-2xl border bg-white/70 p-4 text-sm shadow-sm" style={{ borderColor: `${cor}33` }}>
              <b className="mb-2 block text-base" style={{ color: cor }}>💬 Fale com a gente</b>
              <p className="mb-3 opacity-80">Dúvidas sobre tamanho, cor ou prazo? Chama a gente!</p>
              <div className="flex flex-col gap-2">
                {loja.whatsapp && (
                  <a target="_blank" rel="noopener noreferrer" className="clicavel rounded-full bg-[#1FA855] px-4 py-2 text-center font-semibold text-white"
                    href={`https://wa.me/${loja.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho uma dúvida sobre a ${loja.nome} 😊`)}`}>
                    💬 WhatsApp
                  </a>
                )}
                {insta && (
                  <a target="_blank" rel="noopener noreferrer" href={`https://instagram.com/${insta}`}
                    className="clicavel inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2" style={{ borderColor: cor, color: cor }}>
                    <IconeInstagram /> @{insta}
                  </a>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </TemaDaLoja>
  );
}
