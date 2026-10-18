"use client";
// =====================================================================
// PAINEL — INÍCIO (endereço: /admin)
// Mostra as lojas que a pessoa pode administrar:
//   master → todas · administrador de loja → só as dele.
// =====================================================================
import ImagemLogo from "@/components/ImagemLogo";
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
      let consulta = supabase.from("lojas").select("id, slug, nome, cor, logo_url, logo_ajuste, logo_zoom, logo_fundo, descricao, ativa, em_breve, documento, termos_aceitos_em").order("ordem");
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
      {/* Atalhos que só o master vê */}
      {info.master && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/site" className="clicavel rounded-2xl bg-white p-4 shadow-sm">
            <b className="block">🏠 Página inicial</b>
            <span className="text-xs opacity-60">Título, cores, imagem do topo, efeito e quantos parceiros mostrar</span>
          </Link>
          <Link href="/admin/parceiros" className="clicavel rounded-2xl bg-white p-4 shadow-sm">
            <b className="block">🤝 Parceiros</b>
            <span className="text-xs opacity-60">Adicionar, editar, destacar e desativar parceiros</span>
          </Link>
          <BotaoBackup />
          <Link href="/admin/administradores" className="clicavel rounded-2xl bg-white p-4 shadow-sm">
            <b className="block">👥 Administradores</b>
            <span className="text-xs opacity-60">Dar acesso aos usuários, escolher as lojas de cada um e trocar senhas</span>
          </Link>
        </div>
      )}

      <h1 className="text-2xl font-bold">Suas lojas</h1>
      <p className="mb-4 text-sm opacity-60">Escolha uma loja para configurar.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {lojas.map((loja) => (
          <Link key={loja.id} href={`/admin/${loja.slug}`}
            className="clicavel flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white text-xl font-bold"
              style={{ borderColor: loja.cor ?? "#999", color: loja.cor ?? "#333" }}>
              {loja.logo_url ? <ImagemLogo src={loja.logo_url} ajuste={loja.logo_ajuste} zoom={loja.logo_zoom} fundo={loja.logo_fundo} /> : loja.nome.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate">{loja.nome}</b>
              <span className="block truncate text-xs opacity-60">{loja.descricao}</span>
            </span>
            {loja.ativa === false && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Inativa</span>}
            {loja.ativa !== false && loja.em_breve && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Em breve</span>}
            {(!loja.documento || !loja.termos_aceitos_em) && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700" title="Falta CNPJ/CPF ou o termo de responsabilidade">📄 Falta dado legal</span>}
          </Link>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------
// 💾 Baixar backup: um arquivo com todos os dados do site (só master)
// ---------------------------------------------------------------------
function BotaoBackup() {
  const [estado, setEstado] = useState<"" | "baixando" | "erro">("");
  async function baixar() {
    setEstado("baixando");
    const { data } = await supabaseNavegador().auth.getSession();
    const r = await fetch("/api/admin/backup", { headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
    if (!r.ok) return setEstado("erro");
    const arquivo = await r.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(arquivo);
    link.download = `backup-maonlinestore-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setEstado("");
  }
  return (
    <button type="button" onClick={baixar} className="clicavel rounded-2xl bg-white p-4 text-left shadow-sm">
      <b className="block">💾 Baixar backup</b>
      <span className="text-xs opacity-60">
        {estado === "baixando" ? "Gerando o arquivo..." : estado === "erro" ? "Não deu (confira a SUPABASE_SECRET_KEY)" : "Todos os dados do site num arquivo. Faça toda semana e guarde no Drive."}
      </span>
    </button>
  );
}
