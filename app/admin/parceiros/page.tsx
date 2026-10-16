"use client";
// =====================================================================
// PAINEL — PARCEIROS (endereço: /admin/parceiros) · só master
// Lista todos (ativos e desativados), com botão para adicionar novo.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import type { Parceiro } from "@/lib/tipos";

export default function PainelParceiros() {
  return <AreaAdmin>{(info) => (info.master ? <Lista /> : <p>Só o administrador master mexe nos parceiros.</p>)}</AreaAdmin>;
}

function Lista() {
  const [parceiros, setParceiros] = useState<Parceiro[] | null>(null);

  useEffect(() => {
    supabaseNavegador().from("parceiros").select("id, slug, nome, categoria, logo_url, foto_url, cor, ativo, destaque, selo")
      .order("destaque", { ascending: false }).order("ordem")
      .then(({ data }: { data: Parceiro[] | null }) => setParceiros(data ?? []));
  }, []);

  return (
    <>
      <Link href="/admin" className="text-sm opacity-60">← Painel</Link>
      <div className="mt-1 mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">🤝 Parceiros</h1>
        <Link href="/admin/parceiros/novo" className="clicavel rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white">+ Novo parceiro</Link>
      </div>

      {!parceiros ? <p className="opacity-60">Carregando...</p> : parceiros.length === 0 ? <p>Nenhum parceiro ainda.</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {parceiros.map((p) => (
            <Link key={p.id} href={`/admin/parceiros/${p.id}`} className={`clicavel flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ${p.ativo === false ? "opacity-50" : ""}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-bold text-white" style={{ background: p.cor ?? "#1c1917" }}>
                {p.logo_url || p.foto_url ? <img src={(p.logo_url ?? p.foto_url)!} alt="" className="h-full w-full object-cover" /> : p.nome.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate">{p.nome}</b>
                <span className="text-xs opacity-60">{p.categoria}</span>
              </span>
              {p.ativo === false && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Desativado</span>}
              {p.destaque && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">⭐ Destaque</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
