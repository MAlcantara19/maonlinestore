"use client";
// =====================================================================
// AVALIAR O PEDIDO — aparece no acompanhamento quando o pedido foi
// ENTREGUE. A avaliação chega oculta: a loja confere e publica.
// =====================================================================
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

export default function AvaliarPedido({ codigo, cor, nome }: { codigo: string; cor: string; nome?: string | null }) {
  const [estrelas, setEstrelas] = useState(5);
  const [texto, setTexto] = useState("");
  const [quem, setQuem] = useState(nome ?? "");
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "erro">("");

  async function enviar() {
    if (texto.trim().length < 3) return;
    setEstado("enviando");
    const { data } = await supabaseNavegador().rpc("avaliar_pedido", { p_codigo: codigo, p_estrelas: estrelas, p_texto: texto, p_nome: quem || null });
    setEstado(data ? "ok" : "erro");
  }

  if (estado === "ok") return <p className="mt-4 rounded-xl bg-green-50 p-4 text-center text-green-800">💜 Obrigado pela avaliação! Ela ajuda muito a loja.</p>;
  return (
    <section className="mt-4 rounded-2xl border-2 p-4 text-sm" style={{ borderColor: cor }}>
      <b className="text-base">⭐ Como foi sua experiência?</b>
      <div className="mt-2 flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setEstrelas(n)} aria-label={`${n} estrelas`}>{n <= estrelas ? "⭐" : "☆"}</button>)}
      </div>
      <textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Conta pra gente o que achou do produto 😊" className="mt-2 w-full rounded-lg border bg-white/70 p-2" />
      <input value={quem} onChange={(e) => setQuem(e.target.value)} placeholder="Seu nome (como quer aparecer)" className="mt-2 w-full rounded-lg border bg-white/70 p-2" />
      {estado === "erro" && <p className="mt-1 text-red-600">Não deu para enviar (talvez já tenha avaliado).</p>}
      <button type="button" onClick={enviar} disabled={estado === "enviando" || texto.trim().length < 3} className="mt-2 w-full rounded-xl p-3 font-semibold text-white disabled:opacity-50" style={{ background: cor }}>
        {estado === "enviando" ? "Enviando..." : "Enviar avaliação"}
      </button>
    </section>
  );
}
