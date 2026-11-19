"use client";
// =====================================================================
// 🟢 HORÁRIO DE ATENDIMENTO (Configurações da loja) — salva sozinho.
// Desligado = loja "sempre aberta" (não aparece selo nenhum).
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { DIAS, situacao, type Horario } from "@/lib/horario";
import { Bloco, Interruptor } from "@/components/admin/Campos";

const PADRAO: Horario = { "0": null, "1": ["09:00", "18:00"], "2": ["09:00", "18:00"], "3": ["09:00", "18:00"], "4": ["09:00", "18:00"], "5": ["09:00", "18:00"], "6": ["09:00", "13:00"] };

export default function EditorHorario({ lojaId, cor }: { lojaId: string; cor: string }) {
  const [horario, setHorario] = useState<Horario | null>(null);
  const [pausada, setPausada] = useState(false);
  const [aviso, setAviso] = useState("");
  const [faltaSql, setFaltaSql] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabaseNavegador().from("lojas").select("horario, pausada, aviso_fechada").eq("id", lojaId).maybeSingle()
      .then(({ data, error }: { data: { horario: Horario | null; pausada: boolean; aviso_fechada: string | null } | null; error: unknown }) => {
        if (error) return setFaltaSql(true);
        setHorario(data?.horario ?? null); setPausada(!!data?.pausada); setAviso(data?.aviso_fechada ?? "");
      });
  }, [lojaId]);

  async function salvar() {
    const { error } = await supabaseNavegador().from("lojas").update({ horario, pausada, aviso_fechada: aviso.trim() || null }).eq("id", lojaId);
    setMsg(error ? `😕 ${error.message}` : "✓ Horário salvo!");
  }

  if (faltaSql) return <Bloco titulo="🟢 Horário de atendimento"><p className="text-sm opacity-70">Rode a atualização 31 no Supabase para usar esta parte.</p></Bloco>;
  const s = situacao(horario, pausada);
  const mudarDia = (d: number, v: [string, string] | null) => { setHorario({ ...(horario ?? PADRAO), [String(d)]: v }); setMsg(""); };

  return (
    <Bloco titulo="🟢 Horário de atendimento (“Aberta agora”)">
      <Interruptor rotulo="Mostrar horário na loja" ajuda="Desligado = loja sempre aberta (não aparece selo)." ligado={!!horario} aoMudar={(v) => { setHorario(v ? PADRAO : null); setMsg(""); }} />
      {horario && (
        <div className="space-y-1.5">
          {DIAS.map((nome, d) => {
            const h = horario[String(d)];
            return (
              <div key={d} className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex w-28 items-center gap-1.5"><input type="checkbox" checked={!!h} onChange={(e) => mudarDia(d, e.target.checked ? ["09:00", "18:00"] : null)} /> {nome}</label>
                {h ? (
                  <>
                    <input type="time" value={h[0]} onChange={(e) => mudarDia(d, [e.target.value, h[1]])} className="rounded-lg border bg-white px-2 py-1" />
                    <span>às</span>
                    <input type="time" value={h[1]} onChange={(e) => mudarDia(d, [h[0], e.target.value])} className="rounded-lg border bg-white px-2 py-1" />
                  </>
                ) : <span className="opacity-50">fechado</span>}
              </div>
            );
          })}
        </div>
      )}
      <Interruptor rotulo="⏸️ Pausar a loja (férias, sem produção)" ajuda="A loja continua no ar, mas mostra que está fechada." ligado={pausada} aoMudar={(v) => { setPausada(v); setMsg(""); }} />
      <label className="block text-sm font-semibold">Aviso quando estiver fechada (opcional)
        <input className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal" value={aviso} onChange={(e) => { setAviso(e.target.value); setMsg(""); }} placeholder="Ex.: Voltamos dia 05/01! Pedidos de Natal encerrados 🎄" />
      </label>
      {s && <p className="text-sm">Agora a loja aparece como: <b>{s.aberta ? "🟢" : "🔴"} {s.texto}</b></p>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={salvar} className="rounded-xl px-4 py-2 font-semibold text-white" style={{ background: cor }}>Salvar horário</button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </Bloco>
  );
}
