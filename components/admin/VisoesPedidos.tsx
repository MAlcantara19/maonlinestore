"use client";
// =====================================================================
// OUTRAS FORMAS DE VER OS PEDIDOS (painel)
//   🗂️ Quadro (kanban): uma coluna por etapa, ◀ ▶ para mover
//   📅 Agenda: calendário do mês pela previsão de entrega
//   🏭 Produção: fila de tudo que falta fazer, por data
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { useEffect, useState } from "react";
import { ETAPAS_PEDIDO } from "@/lib/statusPedido";
import { formatarPreco } from "@/lib/formato";

type Item = { nome: string; quantidade: number; foto?: string | null; observacao?: string; opcao?: string | null; tamanho?: string | null; cor?: string | null; produto_id?: string | null; personalizacao?: string | null };
type P = { id: string; codigo: string; cliente_nome: string | null; total: number | null; status: string; itens: Item[]; previsao_entrega?: string | null; data_desejada: string | null; urgente: boolean; tipo: string; criado_em: string };

const fotos = (p: P) => p.itens.filter((i) => i.foto).slice(0, 3);

export function Quadro({ pedidos, cor, mover, abrir }: { pedidos: P[]; cor: string; mover: (p: P, status: string) => void; abrir: (codigo: string) => void }) {
  const etapas = ETAPAS_PEDIDO.filter((e) => e.valor !== "cancelado");
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {etapas.map((e, n) => {
        const daqui = pedidos.filter((p) => p.status === e.valor && p.tipo === "pedido");
        return (
          <div key={e.valor} className="w-64 shrink-0 rounded-2xl bg-stone-100 p-2">
            <p className="mb-2 flex items-center justify-between px-1 text-sm font-bold" style={{ color: e.cor }}>{e.icone} {e.rotulo} <span className="rounded-full bg-white px-2 text-xs">{daqui.length}</span></p>
            <div className="space-y-2">
              {daqui.map((p) => (
                <div key={p.id} className="rounded-xl bg-white p-2 text-xs shadow-sm" style={p.urgente ? { outline: "2px solid #dc2626" } : {}}>
                  <button type="button" onClick={() => abrir(p.codigo)} className="block w-full text-left">
                    <b>#{p.codigo}</b> {p.urgente && "⚡"} <span className="opacity-70">{p.cliente_nome ?? ""}</span>
                    <span className="mt-1 flex gap-1">{fotos(p).map((i, k) => <img key={k} src={i.foto!} alt="" className="h-9 w-9 rounded object-cover" />)}</span>
                    <span className="mt-1 block opacity-70">{p.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(", ")}</span>
                    {p.previsao_entrega && <span className="mt-1 block font-semibold">📅 {p.previsao_entrega.split("-").reverse().slice(0, 2).join("/")}</span>}
                  </button>
                  <div className="mt-1 flex justify-between">
                    <button type="button" disabled={n === 0} onClick={() => mover(p, etapas[n - 1].valor)} className="rounded px-2 py-0.5 disabled:opacity-20">◀</button>
                    <b style={{ color: cor }}>{formatarPreco(Number(p.total ?? 0))}</b>
                    <button type="button" disabled={n === etapas.length - 1} onClick={() => mover(p, etapas[n + 1].valor)} className="rounded px-2 py-0.5 disabled:opacity-20">▶</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Agenda({ pedidos, cor, abrir }: { pedidos: P[]; cor: string; abrir: (codigo: string) => void }) {
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const inicio = mes.getDay(); // 0 = domingo
  const hoje = new Date().toLocaleDateString("sv-SE");
  const doDia = (d: number) => {
    const data = new Date(mes.getFullYear(), mes.getMonth(), d).toLocaleDateString("sv-SE");
    return pedidos.filter((p) => p.status !== "cancelado" && p.status !== "entregue" && (p.previsao_entrega ?? p.data_desejada) === data);
  };
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="rounded-full border px-3">◀</button>
        <b className="capitalize">{mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b>
        <button type="button" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="rounded-full border px-3">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <b key={i} className="opacity-50">{d}</b>)}
        {Array.from({ length: inicio }, (_, i) => <span key={`v${i}`} />)}
        {Array.from({ length: dias }, (_, i) => {
          const d = i + 1, lista = doDia(d);
          const data = new Date(mes.getFullYear(), mes.getMonth(), d).toLocaleDateString("sv-SE");
          return (
            <div key={d} className="min-h-16 rounded-lg border p-1 text-left" style={data === hoje ? { borderColor: cor, borderWidth: 2 } : {}}>
              <span className="text-[10px] opacity-60">{d}</span>
              {lista.map((p) => (
                <button key={p.id} type="button" onClick={() => abrir(p.codigo)} className="mt-0.5 block w-full truncate rounded px-1 text-left text-[10px] text-white"
                  style={{ background: ETAPAS_PEDIDO.find((e) => e.valor === p.status)?.cor ?? cor }}>{p.urgente ? "⚡" : ""}#{p.codigo}</button>
              ))}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs opacity-60">Usa a 📅 previsão de entrega (ou a data que o cliente pediu). A cor é a etapa do pedido.</p>
    </div>
  );
}

export function Producao({ pedidos, slug }: { pedidos: P[]; slug: string }) {
  const [feitos, setFeitos] = useState<string[]>([]);
  useEffect(() => { try { setFeitos(JSON.parse(localStorage.getItem(`producao:${slug}`) ?? "[]")); } catch {} }, [slug]);
  // ⏱️ Tempo de impressão de cada produto (cadastrado no produto / pela calculadora)
  const [tempos, setTempos] = useState<Record<string, number>>({});
  useEffect(() => {
    const ids = [...new Set(pedidos.flatMap((p) => p.itens.map((i) => i.produto_id)).filter(Boolean))] as string[];
    if (!ids.length) return;
    supabaseNavegador().from("produtos").select("id, tempo_min").in("id", ids).not("tempo_min", "is", null)
      .then(({ data }: { data: { id: string; tempo_min: number }[] | null }) => setTempos(Object.fromEntries((data ?? []).map((x) => [x.id, Number(x.tempo_min)]))), () => {});
  }, [pedidos]);
  const horas = (min: number) => `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, "0")}`;
  const marcar = (k: string) => { const n = feitos.includes(k) ? feitos.filter((x) => x !== k) : [...feitos, k]; setFeitos(n); try { localStorage.setItem(`producao:${slug}`, JSON.stringify(n)); } catch {} };
  const fila = pedidos
    .filter((p) => ["aceito", "em_producao"].includes(p.status))
    .sort((a, b) => Number(b.urgente) - Number(a.urgente) || (a.previsao_entrega ?? a.data_desejada ?? "9999").localeCompare(b.previsao_entrega ?? b.data_desejada ?? "9999"))
    .flatMap((p) => p.itens.map((i, n) => ({ p, i, k: `${p.id}:${n}` })));
  if (!fila.length) return <p className="opacity-60">Nada na fila de produção (pedidos “Aceito” ou “Em produção”). 🎉</p>;
  const minutosFaltando = fila.filter(({ k }) => !feitos.includes(k)).reduce((s, { i }) => s + (i.produto_id && tempos[i.produto_id] ? tempos[i.produto_id] * i.quantidade : 0), 0);
  return (
    <>
    {minutosFaltando > 0 && (
      <p className="mb-3 rounded-xl bg-white p-3 text-sm shadow-sm">⏱️ Impressão que falta na fila: <b>{horas(minutosFaltando)}</b>
        <span className="opacity-60"> (≈ {Math.ceil(minutosFaltando / 60 / 10)} dia(s) de 10h de impressora)</span></p>
    )}
    <ul className="space-y-2">
      {fila.map(({ p, i, k }) => (
        <li key={k} className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ${feitos.includes(k) ? "opacity-40" : ""}`}>
          <input type="checkbox" className="h-6 w-6" checked={feitos.includes(k)} onChange={() => marcar(k)} aria-label="Feito" />
          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-stone-100">{i.foto && <img src={i.foto} alt="" className="h-full w-full object-cover" />}</span>
          <span className="min-w-0 flex-1 text-sm">
            <b className={feitos.includes(k) ? "line-through" : ""}>{i.quantidade}x {i.nome}</b> {[i.opcao, i.tamanho, i.cor, i.personalizacao && `✍️ "${i.personalizacao}"`].filter(Boolean).join(" · ")}
            {i.produto_id && tempos[i.produto_id] ? <span className="ml-1 rounded-full bg-stone-100 px-2 text-xs">⏱️ {horas(tempos[i.produto_id] * i.quantidade)}</span> : null}
            {i.observacao && <span className="block text-xs text-amber-700">✏️ {i.observacao}</span>}
            <span className="block text-xs opacity-60">#{p.codigo} · {p.cliente_nome ?? ""}{p.previsao_entrega ? ` · 📅 ${p.previsao_entrega.split("-").reverse().slice(0, 2).join("/")}` : ""} {p.urgente ? "· ⚡ urgente" : ""}</span>
          </span>
        </li>
      ))}
    </ul>
    </>
  );
}
