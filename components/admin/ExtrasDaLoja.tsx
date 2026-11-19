"use client";
// =====================================================================
// PEDAÇOS DAS CONFIGURAÇÕES QUE SALVAM SOZINHOS (atualização 32)
//   ⏳ Contagem regressiva  ("Pedidos de Natal até 15/12")
//   🔎 Sinônimos da busca + ⚠️ aviso de estoque baixo
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { Bloco } from "@/components/admin/Campos";

const input = "mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal";

function useCampos<T extends Record<string, unknown>>(lojaId: string, colunas: string) {
  const [dados, setDados] = useState<T | null>(null);
  const [faltaSql, setFaltaSql] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    supabaseNavegador().from("lojas").select(colunas).eq("id", lojaId).maybeSingle()
      .then(({ data, error }: { data: T | null; error: unknown }) => (error ? setFaltaSql(true) : setDados(data)));
  }, [lojaId, colunas]);
  async function salvar(campos: Partial<T>) {
    const { error } = await supabaseNavegador().from("lojas").update(campos).eq("id", lojaId);
    setMsg(error ? `😕 ${error.message}` : "✓ Salvo!");
  }
  return { dados, setDados: (d: T) => { setDados(d); setMsg(""); }, faltaSql, msg, salvar };
}

// "2026-12-15T23:59" (campo de data e hora) <-> data do banco
const paraCampo = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function EditorContagem({ lojaId, cor }: { lojaId: string; cor: string }) {
  const { dados, setDados, faltaSql, msg, salvar } = useCampos<{ contagem_ate: string | null; contagem_texto: string | null }>(lojaId, "contagem_ate, contagem_texto");
  if (faltaSql) return <Bloco titulo="⏳ Contagem regressiva"><p className="text-sm opacity-70">Rode a atualização 32 no Supabase para usar esta parte.</p></Bloco>;
  if (!dados) return null;
  return (
    <Bloco titulo="⏳ Contagem regressiva (ex.: “Pedidos de Natal até 15/12”)">
      <p className="text-xs opacity-60">Aparece no topo da loja com o relógio correndo e vira selo no catálogo. Some sozinha quando a data passa.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Texto
          <input className={input} value={dados.contagem_texto ?? ""} placeholder="🎄 Pedidos de Natal até" maxLength={40} onChange={(e) => setDados({ ...dados, contagem_texto: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold">Termina em
          <input type="datetime-local" className={input} value={paraCampo(dados.contagem_ate)} onChange={(e) => setDados({ ...dados, contagem_ate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => salvar({ contagem_ate: dados.contagem_ate, contagem_texto: dados.contagem_texto?.trim() || null })} className="rounded-xl px-4 py-2 font-semibold text-white" style={{ background: cor }}>Salvar contagem</button>
        <button type="button" onClick={() => { const ano = new Date().getFullYear(); setDados({ contagem_texto: "🎄 Pedidos de Natal até", contagem_ate: new Date(`${ano}-12-15T23:59:00-03:00`).toISOString() }); }} className="rounded-xl border px-3 py-2 text-sm">🎄 Natal (15/12)</button>
        {dados.contagem_ate && <button type="button" onClick={() => { setDados({ contagem_ate: null, contagem_texto: null }); salvar({ contagem_ate: null, contagem_texto: null }); }} className="rounded-xl border px-3 py-2 text-sm text-red-600">Desligar</button>}
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </Bloco>
  );
}

export function EditorSinonimosAvisos({ lojaId, cor }: { lojaId: string; cor: string }) {
  const { dados, setDados, faltaSql, msg, salvar } = useCampos<{ sinonimos: string | null; estoque_alerta: number }>(lojaId, "sinonimos, estoque_alerta");
  if (faltaSql || !dados) return null;
  return (
    <Bloco titulo="🔎 Busca da loja e ⚠️ avisos de estoque">
      <label className="block text-sm font-semibold">Sinônimos da busca (um grupo por linha)
        <textarea rows={4} className={input} value={dados.sinonimos ?? ""} onChange={(e) => setDados({ ...dados, sinonimos: e.target.value })}
          placeholder={"caneca = xícara, copo\nchaveiro = chaveirinho, pingente\nmini = miniatura, pequeno"} />
      </label>
      <p className="text-xs opacity-60">Quem buscar qualquer palavra da linha acha os produtos com as outras. Erros de digitação e acentos o site já entende sozinho.</p>
      <label className="block text-sm font-semibold">⚠️ Avisar (push) quando o estoque de um produto chegar a
        <input className={input} inputMode="numeric" value={dados.estoque_alerta ?? 2} onChange={(e) => setDados({ ...dados, estoque_alerta: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
      </label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => salvar({ sinonimos: dados.sinonimos?.trim() || null, estoque_alerta: dados.estoque_alerta })} className="rounded-xl px-4 py-2 font-semibold text-white" style={{ background: cor }}>Salvar</button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </Bloco>
  );
}
