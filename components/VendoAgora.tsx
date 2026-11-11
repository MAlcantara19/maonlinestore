"use client";
// =====================================================================
// 👀 "X pessoas vendo agora" — aparelhos diferentes que abriram este
// produto nos últimos 5 minutos (de verdade, pelas estatísticas).
// Só aparece a partir de 2 pessoas (você + mais alguém).
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

export default function VendoAgora({ produtoId }: { produtoId: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ver = () => supabaseNavegador().rpc("vendo_agora", { p_produto: produtoId }).then(({ data }: { data: number | null }) => setN(Number(data ?? 0)), () => {});
    const primeira = setTimeout(ver, 2500); // espera a própria visita ser contada
    const t = setInterval(ver, 30000);
    return () => { clearTimeout(primeira); clearInterval(t); };
  }, [produtoId]);
  if (n < 2) return null;
  return (
    <p className="surgir mt-2 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-sm">
      <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" /></span>
      <b>{n}</b> pessoas vendo agora
    </p>
  );
}
