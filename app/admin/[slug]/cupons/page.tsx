"use client";
// =====================================================================
// PAINEL — CUPONS DE DESCONTO (endereço: /admin/vitraforma/cupons)
// O cliente digita o cupom no carrinho e já vê o valor com desconto.
// O desconto também vai escrito na mensagem do WhatsApp.
// =====================================================================
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, paraNumero, type LojaResumo } from "@/lib/admin";
import { formatarPreco } from "@/lib/formato";

type Cupom = { id: string; codigo: string; tipo: "porcentagem" | "valor"; valor: number; minimo: number | null; validade: string | null; ativo: boolean };

export default function PainelCupons() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [novo, setNovo] = useState({ codigo: "", tipo: "porcentagem" as Cupom["tipo"], valor: "", minimo: "", validade: "" });
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async (l: LojaResumo) => {
    const { data } = await supabaseNavegador().from("cupons").select("*").eq("loja_id", l.id).order("criado_em", { ascending: false });
    setCupons((data ?? []) as Cupom[]);
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); }); }, [slug, carregar]);
  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  async function criar() {
    if (!loja) return;
    const valor = paraNumero(novo.valor);
    if (!novo.codigo.trim() || !valor) return setAviso("Preencha o código e o valor.");
    const { error } = await supabaseNavegador().from("cupons").insert({
      loja_id: loja.id, codigo: novo.codigo.trim().toUpperCase(), tipo: novo.tipo, valor,
      minimo: paraNumero(novo.minimo), validade: novo.validade || null,
    });
    if (error) return setAviso(error.message.includes("duplicate") ? "Já existe um cupom com esse código." : error.message);
    setNovo({ codigo: "", tipo: "porcentagem", valor: "", minimo: "", validade: "" });
    setAviso("✓ Cupom criado!");
    carregar(loja);
  }
  async function alternar(c: Cupom) {
    await supabaseNavegador().from("cupons").update({ ativo: !c.ativo }).eq("id", c.id);
    if (loja) carregar(loja);
  }
  async function excluir(c: Cupom) {
    if (!confirm(`Excluir o cupom ${c.codigo}?`)) return;
    await supabaseNavegador().from("cupons").delete().eq("id", c.id);
    if (loja) carregar(loja);
  }

  const campo = "rounded-lg border bg-white px-3 py-2 text-sm";
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <Bloco titulo="➕ Novo cupom">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={campo} placeholder="Código (ex.: NATAL10)" value={novo.codigo} onChange={(e) => setNovo({ ...novo, codigo: e.target.value.toUpperCase() })} />
          <div className="flex gap-2">
            <select className={campo} value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value as Cupom["tipo"] })}>
              <option value="porcentagem">% de desconto</option>
              <option value="valor">R$ de desconto</option>
            </select>
            <input className={`${campo} min-w-0 flex-1`} inputMode="decimal" placeholder={novo.tipo === "porcentagem" ? "10" : "15,00"} value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />
          </div>
          <input className={campo} inputMode="decimal" placeholder="Compra mínima (opcional)" value={novo.minimo} onChange={(e) => setNovo({ ...novo, minimo: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">Vale até: <input type="date" className={`${campo} flex-1`} value={novo.validade} onChange={(e) => setNovo({ ...novo, validade: e.target.value })} /></label>
        </div>
        {aviso && <p className="text-sm">{aviso}</p>}
        <button type="button" onClick={criar} className="w-full rounded-xl p-3 font-semibold text-white" style={{ background: cor }}>Criar cupom</button>
      </Bloco>

      <Bloco titulo="🏷️ Cupons da loja">
        {cupons.length === 0 ? <p className="text-sm opacity-60">Nenhum cupom ainda.</p> : cupons.map((c) => {
          const vencido = c.validade && c.validade < hoje;
          return (
            <div key={c.id} className={`flex flex-wrap items-center gap-2 rounded-xl bg-stone-50 p-3 ${c.ativo && !vencido ? "" : "opacity-50"}`}>
              <b className="rounded-lg border-2 border-dashed px-2 py-1 font-mono" style={{ borderColor: cor, color: cor }}>{c.codigo}</b>
              <span className="text-sm">
                {c.tipo === "porcentagem" ? `${Number(c.valor)}% off` : `${formatarPreco(Number(c.valor))} off`}
                {c.minimo ? ` · mínimo ${formatarPreco(Number(c.minimo))}` : ""}
                {c.validade ? ` · até ${c.validade.split("-").reverse().join("/")}` : ""}
                {vencido ? " · vencido" : ""}
              </span>
              <span className="flex-1" />
              <button type="button" onClick={() => alternar(c)} className="rounded-lg border px-3 py-1.5 text-sm">{c.ativo ? "Pausar" : "Ativar"}</button>
              <button type="button" onClick={() => excluir(c)} className="rounded-lg border px-3 py-1.5 text-sm text-red-600">🗑️</button>
            </div>
          );
        })}
      </Bloco>
    </>
  );
}
