"use client";
// =====================================================================
// 🔥 SELO "MAIS VENDIDO" — automático: os produtos campeões dos últimos
// 60 dias (pedidos não cancelados) ganham o selo no cartão.
// Uma consulta só por loja, reaproveitada em todos os cartões.
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

const campeoes = new Map<string, Promise<string[]>>();
function buscar(slug: string) {
  if (!campeoes.has(slug)) {
    campeoes.set(slug, new Promise((ok) => {
      supabaseNavegador().rpc("mais_vendidos", { p_slug: slug, p_limite: 6 })
        .then(({ data, error }: { data: { produto_id: string }[] | null; error: unknown }) => ok(error ? [] : (data ?? []).map((d) => d.produto_id)), () => ok([]));
    }));
  }
  return campeoes.get(slug)!;
}

export default function SeloMaisVendido({ slug, produtoId, abaixo }: { slug: string; produtoId: string; abaixo?: boolean }) {
  const [e, setE] = useState(false);
  useEffect(() => { buscar(slug).then((ids) => setE(ids.includes(produtoId))); }, [slug, produtoId]);
  if (!e) return null;
  return (
    <span className={`absolute left-2 ${abaixo ? "top-9" : "top-2"} rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-2 py-0.5 text-[11px] font-bold text-white shadow`}>
      🔥 Mais vendido
    </span>
  );
}
