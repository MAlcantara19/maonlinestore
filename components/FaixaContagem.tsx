"use client";
// =====================================================================
// ⏳ FAIXA DE CONTAGEM REGRESSIVA na loja: "🎄 Pedidos de Natal até
// 15/12 — faltam 3d 04h 12m". Some sozinha quando a data passa.
// Configure em: painel → Configurações → "Contagem regressiva".
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";

export default function FaixaContagem({ lojaId, cor }: { lojaId: string; cor: string }) {
  const [dados, setDados] = useState<{ ate: string; texto: string } | null>(null);
  useEffect(() => {
    supabaseNavegador().from("lojas").select("contagem_ate, contagem_texto").eq("id", lojaId).maybeSingle()
      .then(({ data, error }: { data: { contagem_ate: string | null; contagem_texto: string | null } | null; error: unknown }) => {
        if (!error && data?.contagem_ate) setDados({ ate: data.contagem_ate, texto: data.contagem_texto?.trim() || "Pedidos até" });
      }, () => {});
  }, [lojaId]);
  return dados ? <Contagem ate={dados.ate} texto={dados.texto} cor={cor} /> : null;
}

// Contagem de uma COLEÇÃO ("Páscoa até 30/03") — atualização 33
export function ContagemDaColecao({ colecaoId, cor, pequena }: { colecaoId: string; cor: string; pequena?: boolean }) {
  const [dados, setDados] = useState<{ ate: string; texto: string } | null>(null);
  useEffect(() => {
    supabaseNavegador().from("colecoes").select("contagem_ate, contagem_texto").eq("id", colecaoId).maybeSingle()
      .then(({ data, error }: { data: { contagem_ate: string | null; contagem_texto: string | null } | null; error: unknown }) => {
        if (!error && data?.contagem_ate) setDados({ ate: data.contagem_ate, texto: data.contagem_texto?.trim() || "Pedidos até" });
      }, () => {});
  }, [colecaoId]);
  return dados ? <Contagem ate={dados.ate} texto={dados.texto} cor={cor} pequena={pequena} /> : null;
}

// O relógio em si (some quando a data passa)
export function Contagem({ ate, texto, cor, pequena }: { ate: string; texto: string; cor: string; pequena?: boolean }) {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (agora == null) return null;
  const falta = new Date(ate).getTime() - agora;
  if (falta <= 0) return null;
  const s = Math.floor(falta / 1000);
  const partes: [number, string][] = [[Math.floor(s / 86400), "d"], [Math.floor((s % 86400) / 3600), "h"], [Math.floor((s % 3600) / 60), "m"], [s % 60, "s"]];
  const data = new Date(ate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
  const urgente = falta < 3 * 86400_000;
  const fundo = urgente ? "linear-gradient(90deg,#b91c1c,#ea580c)" : `linear-gradient(90deg, ${cor}, ${cor}cc)`;

  if (pequena) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow" style={{ background: fundo }}>
        ⏳ {texto} {data} · <span className="font-mono">{partes.slice(0, 3).map(([n, u]) => `${n}${u}`).join(" ")}</span>
      </span>
    );
  }
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl px-4 py-2.5 text-center text-sm font-semibold text-white shadow" style={{ background: fundo }}>
      <span>⏳ {texto} <b>{data}</b>{urgente ? " — últimos dias!" : ""}</span>
      <span className="inline-flex gap-1 font-mono text-xs" aria-label="Tempo restante">
        {partes.map(([n, u]) => <span key={u} className="rounded bg-black/30 px-1.5 py-0.5">{String(n).padStart(2, "0")}{u}</span>)}
      </span>
    </div>
  );
}
