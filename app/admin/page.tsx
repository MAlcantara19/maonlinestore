"use client";
// =====================================================================
// PAINEL — INÍCIO (endereço: /admin)
// Mostra as lojas que a pessoa pode administrar:
//   master → todas · administrador de loja → só as dele.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import AreaAdmin, { type InfoAdmin } from "@/components/admin/AreaAdmin";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Loja } from "@/lib/tipos";

export default function PainelInicio() {
  return <AreaAdmin>{(info) => <ListaDeLojas info={info} />}</AreaAdmin>;
}

function ListaDeLojas({ info }: { info: InfoAdmin }) {
  const [lojas, setLojas] = useState<Loja[] | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = supabaseNavegador();
      let consulta = supabase.from("lojas").select("id, slug, nome, cor, logo_url, descricao, ativa, em_breve").order("ordem");
      if (!info.master) {
        // Administrador de loja: só as lojas ligadas a ele em "loja_admins"
        const { data: minhas } = await supabase.from("loja_admins").select("loja_id").eq("user_id", info.userId);
        consulta = consulta.in("id", (minhas ?? []).map((m: { loja_id: string }) => m.loja_id));
      }
      const { data } = await consulta;
      setLojas((data ?? []) as Loja[]);
    })();
  }, [info]);

  if (!lojas) return <p className="opacity-60">Carregando lojas...</p>;
  if (lojas.length === 0) return <p>Sua conta ainda não administra nenhuma loja. Peça ao administrador master para liberar.</p>;

  return (
    <>
      <h1 className="text-2xl font-bold">Suas lojas</h1>
      <p className="mb-4 text-sm opacity-60">Escolha uma loja para configurar.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {lojas.map((loja) => (
          <Link key={loja.id} href={`/admin/${loja.slug}`}
            className="clicavel flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white text-xl font-bold"
              style={{ borderColor: loja.cor ?? "#999", color: loja.cor ?? "#333" }}>
              {loja.logo_url ? <img src={loja.logo_url} alt="" className="h-full w-full object-cover" /> : loja.nome.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate">{loja.nome}</b>
              <span className="block truncate text-xs opacity-60">{loja.descricao}</span>
            </span>
            {loja.ativa === false && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Inativa</span>}
            {loja.ativa !== false && loja.em_breve && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Em breve</span>}
          </Link>
        ))}
      </div>
    </>
  );
}
