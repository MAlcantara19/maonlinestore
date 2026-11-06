"use client";
// =====================================================================
// PAINEL RÁPIDO NO ACOMPANHAMENTO — quando VOCÊ (administrador da loja,
// logado no painel neste aparelho) abre o link de um pedido, aparece
// este quadro só para você: muda a etapa ali mesmo, avisa o cliente no
// WhatsApp e tem o atalho para abrir o pedido no painel.
// Para o cliente (não logado) ele não aparece.
// =====================================================================
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { ETAPAS_PEDIDO, mensagemDeAndamento } from "@/lib/statusPedido";
import { linkWhatsApp } from "@/lib/whatsapp";

type PedidoAdmin = { id: string; codigo: string; status: string; cliente_nome: string | null; cliente_whatsapp: string | null; nota_loja: string | null; lojas: { slug: string; nome: string } };

export default function PainelRapidoPedido({ codigo }: { codigo: string }) {
  const router = useRouter();
  const [p, setP] = useState<PedidoAdmin | null>(null);
  const [aviso, setAviso] = useState("");

  // Só encontra o pedido quem administra a loja (o banco garante isso)
  useEffect(() => {
    try { if (sessionStorage.getItem("ver-como-cliente")) return; } catch {}
    supabaseNavegador().from("pedidos").select("id, codigo, status, cliente_nome, cliente_whatsapp, nota_loja, lojas(slug, nome)").eq("codigo", codigo).maybeSingle()
      .then(({ data }: { data: PedidoAdmin | null }) => setP(data), () => {});
  }, [codigo]);
  if (!p) return null;

  async function mudar(status: string) {
    if (!p) return;
    if (p.cliente_whatsapp) {
      const numero = p.cliente_whatsapp.length <= 11 ? `55${p.cliente_whatsapp}` : p.cliente_whatsapp;
      window.open(linkWhatsApp(numero, mensagemDeAndamento({ ...p, status }, window.location.origin, p.lojas.nome)), "_blank");
    }
    const { error } = await supabaseNavegador().from("pedidos").update({ status, atualizado_em: new Date().toISOString() }).eq("id", p.id);
    if (error) return setAviso(`Erro: ${error.message}`);
    setP({ ...p, status });
    setAviso(p.cliente_whatsapp ? "✓ Atualizado! Toque em enviar no WhatsApp." : "✓ Atualizado! (O cliente não deixou o WhatsApp.)");
    router.refresh(); // atualiza a linha do tempo abaixo
  }

  return (
    <section className="mt-4 rounded-2xl border-2 border-dashed border-stone-400 p-4 text-sm shadow-sm" style={{ background: "#ffffff", color: "#1c1917" }}>
      <b>⚙️ Painel da loja</b> <span className="opacity-60">(só você vê, porque está logado como administrador)</span>
      <div className="mt-3 flex flex-wrap gap-2">
        {ETAPAS_PEDIDO.map((e) => (
          <button key={e.valor} type="button" onClick={() => mudar(e.valor)} disabled={e.valor === p.status}
            className="rounded-full border px-3 py-1.5 font-semibold disabled:opacity-100"
            style={e.valor === p.status ? { background: e.cor, color: "white", borderColor: e.cor } : { background: "#f5f5f4", color: "#1c1917", borderColor: "#d6d3d1" }}>
            {e.icone} {e.rotulo}
          </button>
        ))}
      </div>
      {aviso && <p className="mt-2">{aviso}</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={`/admin/${p.lojas.slug}/pedidos?codigo=${p.codigo}`} className="font-semibold underline" style={{ color: "#1c1917" }}>Abrir este pedido no painel →</a>
        <button type="button" onClick={() => { try { sessionStorage.setItem("ver-como-cliente", "1"); } catch {} setP(null); }} className="underline opacity-70">👁️ Ver como o cliente vê</button>
      </div>
    </section>
  );
}
