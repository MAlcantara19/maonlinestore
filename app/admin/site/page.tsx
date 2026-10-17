"use client";
// =====================================================================
// PAINEL — PÁGINA INICIAL (endereço: /admin/site) · só master
// Título, subtítulo, cores do topo, imagem de fundo, efeito animado e
// quantos parceiros aparecem na página inicial.
// =====================================================================
import Link from "next/link";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import { Bloco, Campo, BarraSalvar, estiloInput, type Mensagem } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { OPCOES_EFEITO } from "@/lib/opcoes";
import CampoImagem from "@/components/admin/CampoImagem";
import { CONFIG_PADRAO } from "@/lib/site";
import type { ConfigSite } from "@/lib/tipos";

export default function PainelSite() {
  return <AreaAdmin>{(info) => (info.master ? <Formulario /> : <p>Só o administrador master mexe na página inicial.</p>)}</AreaAdmin>;
}

function Formulario() {
  const [c, setC] = useState<ConfigSite | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  useEffect(() => {
    supabaseNavegador().from("site_config").select("*").eq("id", 1).maybeSingle()
      .then(({ data }: { data: ConfigSite | null }) => setC({ ...CONFIG_PADRAO, ...(data ?? {}) }));
  }, []);
  if (!c) return <p className="opacity-60">Carregando...</p>;

  const mudar = <K extends keyof ConfigSite>(campo: K, valor: ConfigSite[K]) => { setC({ ...c, [campo]: valor }); setMensagem(null); };

  async function salvar() {
    if (!c) return;
    setSalvando(true);
    const { error } = await supabaseNavegador().from("site_config").update(c).eq("id", 1);
    setMensagem(error ? { tipo: "erro", texto: `Não deu para salvar: ${error.message}` } : { tipo: "ok", texto: "✓ Salvo! Atualize a página inicial para ver." });
    setSalvando(false);
  }

  const cor = c.cor ?? "#3B1260";
  return (
    <>
      <Link href="/admin" className="text-sm opacity-60">← Painel</Link>
      <div className="mt-1 mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏠 Página inicial</h1>
        <Link href="/" target="_blank" className="rounded-full border px-3 py-1.5 text-sm">👁️ Ver site</Link>
      </div>

      {/* Prévia do topo */}
      <div className="relative mb-6 overflow-hidden rounded-2xl p-8 text-center text-white shadow" style={{ background: `linear-gradient(135deg, ${cor}, ${c.cor_secundaria ?? cor})` }}>
        {c.banner_url && <img src={c.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
        <b className="relative block text-3xl">{c.titulo}</b>
        <span className="relative opacity-90">{c.subtitulo}</span>
      </div>

      <Bloco titulo="📝 Textos">
        <Campo rotulo="Título"><input className={estiloInput} value={c.titulo} onChange={(e) => mudar("titulo", e.target.value)} /></Campo>
        <Campo rotulo="Subtítulo"><input className={estiloInput} value={c.subtitulo ?? ""} onChange={(e) => mudar("subtitulo", e.target.value || null)} /></Campo>
      </Bloco>

      <Bloco titulo="🎨 Aparência do topo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Cor 1 (início do degradê)"><input type="color" className="mt-1 h-11 w-full rounded-lg" value={c.cor ?? "#3B1260"} onChange={(e) => mudar("cor", e.target.value)} /></Campo>
          <Campo rotulo="Cor 2 (fim do degradê)"><input type="color" className="mt-1 h-11 w-full rounded-lg" value={c.cor_secundaria ?? "#C9B3EE"} onChange={(e) => mudar("cor_secundaria", e.target.value)} /></Campo>
        </div>
        <CampoImagem rotulo="Imagem de fundo do topo (opcional)" valor={c.banner_url} aoMudar={(url) => mudar("banner_url", url)} pasta="site" />
        <Campo rotulo="Efeito animado">
          <select className={estiloInput} value={c.efeito} onChange={(e) => mudar("efeito", e.target.value as ConfigSite["efeito"])}>
            {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>
        </Campo>
      </Bloco>

      <Bloco titulo="⚙️ Efeito do painel de administração">
        <Campo rotulo="Efeito animado que aparece aqui no painel (para todos os administradores)">
          <select className={estiloInput} value={(c as ConfigSite & { efeito_painel?: string }).efeito_painel ?? "nenhum"}
            onChange={(e) => setC({ ...c, efeito_painel: e.target.value } as ConfigSite)}>
            {OPCOES_EFEITO.filter((o) => !o.valor.startsWith("logo")).map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>
        </Campo>
      </Bloco>

      <Bloco titulo="🤝 Parceiros na página inicial">
        <Campo rotulo="Quantos parceiros mostrar (0 = todos)">
          <input type="number" min={0} className={estiloInput} value={c.parceiros_na_home} onChange={(e) => mudar("parceiros_na_home", Math.max(0, Number(e.target.value) || 0))} />
        </Campo>
      </Bloco>

      <BarraSalvar mensagem={mensagem} salvando={salvando} aoSalvar={salvar} cor={cor} />
    </>
  );
}
