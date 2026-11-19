"use client";
// =====================================================================
// 🟢/🔴 Selo "Aberta agora" na loja. Fechada: avisa que dá para pedir
// mesmo assim (a resposta vem quando a loja abrir).
// Se a loja não tiver horário cadastrado, não aparece nada.
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { situacao, type Horario } from "@/lib/horario";

export default function LojaAbertaAgora({ lojaId }: { lojaId: string }) {
  const [dados, setDados] = useState<{ horario: Horario | null; pausada: boolean; aviso_fechada: string | null } | null>(null);
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    supabaseNavegador().from("lojas").select("horario, pausada, aviso_fechada").eq("id", lojaId).maybeSingle()
      .then(({ data, error }: { data: typeof dados; error: unknown }) => { if (!error && data) setDados(data); }, () => {});
    setAgora(new Date());
    const t = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(t);
  }, [lojaId]);

  if (!dados || !agora) return null;
  const s = situacao(dados.horario, dados.pausada, agora);
  if (!s) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-sm"
      style={{ background: s.aberta ? "#dcfce7" : "#fee2e2", color: s.aberta ? "#14532d" : "#7f1d1d" }}>
      <span className="relative flex h-2.5 w-2.5">
        {s.aberta && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.aberta ? "bg-green-600" : "bg-red-600"}`} />
      </span>
      <b>{s.texto}</b>
      {!s.aberta && <span className="opacity-80">— {dados.aviso_fechada || "pode deixar seu pedido: respondemos assim que abrirmos 💬"}</span>}
    </div>
  );
}
