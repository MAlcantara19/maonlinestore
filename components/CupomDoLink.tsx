"use client";
// =====================================================================
// CUPOM PELO LINK — quem entra por /vitraforma?cupom=NATAL10 ganha uma
// faixa festiva com confete, e o cupom já fica guardado para o carrinho.
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { explodirConfete } from "@/lib/efeitos";

export default function CupomDoLink({ lojaId, slug, cor }: { lojaId: string; slug: string; cor: string }) {
  const [cupom, setCupom] = useState<{ codigo: string; texto: string } | null>(null);

  useEffect(() => {
    const codigo = new URLSearchParams(window.location.search).get("cupom");
    if (!codigo) return;
    supabaseNavegador().rpc("validar_cupom", { p_loja: lojaId, p_codigo: codigo }).then(({ data }: { data: { codigo: string; tipo: string; valor: number }[] | null }) => {
      const c = data?.[0];
      if (!c) return;
      try { localStorage.setItem(`cupom:${slug}`, c.codigo); } catch {}
      setCupom({ codigo: c.codigo, texto: c.tipo === "porcentagem" ? `${Number(c.valor)}% de desconto` : `R$ ${Number(c.valor).toFixed(2).replace(".", ",")} de desconto` });
      setTimeout(() => explodirConfete(new DOMRect(window.innerWidth / 2 - 50, 80, 100, 40), [cor, "#f5c542", "#ef5350", "#42a5f5", "#66bb6a"]), 300);
    });
  }, [lojaId, slug, cor]);

  if (!cupom) return null;
  return (
    <div className="balao fixed inset-x-0 top-3 z-40 mx-auto w-fit max-w-[92vw] rounded-2xl px-5 py-3 text-center text-sm text-white shadow-2xl"
      style={{ background: cor, marginTop: "env(safe-area-inset-top)" }}>
      🎉 Você ganhou <b>{cupom.texto}</b> com o cupom <b className="font-mono">{cupom.codigo}</b>! Ele já vai aplicado no carrinho.
      <button type="button" onClick={() => setCupom(null)} className="ml-3 opacity-70" aria-label="Fechar">✕</button>
    </div>
  );
}
