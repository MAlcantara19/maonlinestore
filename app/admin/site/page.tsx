"use client";
// =====================================================================
// PAINEL — PÁGINA INICIAL (endereço: /admin/site) · só master
// Título, subtítulo, cores do topo, imagem de fundo, efeito animado e
// quantos parceiros aparecem na página inicial.
// =====================================================================
import EditorBordaLogo from "@/components/admin/EditorBordaLogo";
import Link from "next/link";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import { Bloco, Campo, BarraSalvar, estiloInput, type Mensagem } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { OPCOES_EFEITO } from "@/lib/opcoes";
import CampoImagem from "@/components/admin/CampoImagem";
import EditorFundo from "@/components/admin/EditorFundo";
import { TAMANHOS } from "@/lib/tamanhos";
import { CONFIG_PADRAO } from "@/lib/site-padrao";
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
        <CampoImagem rotulo="Logo da MA Online Store (aparece no topo, acima do título)" valor={c.logo_url ?? null} aoMudar={(url) => mudar("logo_url", url)} pasta="site" dica={TAMANHOS.logoSite} redonda recorte={{ proporcao: 1, largura: 600, cores: [c.cor, c.cor_secundaria] }} />
        <EditorBordaLogo logo={c.logo_url ?? null} cor={c.logo_borda_cor ?? null} largura={c.logo_borda ?? 3} corDaLoja={cor}
          aoMudar={(v) => setC({ ...c, logo_borda_cor: v.cor, logo_borda: v.largura })} />
        <CampoImagem rotulo="Imagem de fundo do topo (opcional)" valor={c.banner_url} aoMudar={(url) => mudar("banner_url", url)} pasta="site" dica={TAMANHOS.bannerTopo} recorte={{ proporcao: 16 / 5, largura: 1920, cores: [c.cor, c.cor_secundaria] }} />
        <Campo rotulo="Efeito animado">
          <select className={estiloInput} value={c.efeito} onChange={(e) => mudar("efeito", e.target.value as ConfigSite["efeito"])}>
            {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo.replace("Logo da loja", "Logo da MA Online Store")}</option>)}
          </select>
        </Campo>
      </Bloco>

      <Bloco titulo="🌄 Fundo da página inicial inteira">
        <EditorFundo cor={cor} pasta="site" logo={c.logo_url ?? null}
          valor={{ fundo_tipo: c.fundo_tipo ?? "nenhum", fundo_url: c.fundo_url ?? null, fundo_opacidade: c.fundo_opacidade ?? 15, fundo_animacao: c.fundo_animacao ?? "nenhuma", fundo_cor: c.fundo_cor ?? null }}
          borda={{ cor: c.logo_borda_cor, largura: c.logo_borda }} aoMudar={(v) => setC({ ...c, ...v })} />
      </Bloco>

      <Bloco titulo="🎄 Faixa especial na página inicial (Natal, Páscoa...)">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!c.especial_ativo} onChange={(e) => setC({ ...c, especial_ativo: e.target.checked })} /> Mostrar a faixa especial</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Título da faixa"><input className={estiloInput} value={c.especial_titulo ?? ""} onChange={(e) => mudar("especial_titulo", e.target.value || null)} placeholder="🎄 Especial de Natal" /></Campo>
          <Campo rotulo="Palavra no nome das coleções"><input className={estiloInput} value={c.especial_termo ?? ""} onChange={(e) => mudar("especial_termo", e.target.value || null)} placeholder="Natal" /></Campo>
        </div>
        <p className="text-xs opacity-60">Junta os produtos das coleções de TODAS as lojas que têm essa palavra no nome (ex.: “Coleção Natal” da VitraForma + “Natal” da Gallerie), alternando uma loja de cada vez. Em abril, troque para “Páscoa”. 😉</p>
      </Bloco>

      <Bloco titulo="🤝 Página de parceiros">
        <Campo rotulo="Título"><input className={estiloInput} value={c.parceiros_titulo ?? ""} onChange={(e) => mudar("parceiros_titulo", e.target.value || null)} placeholder="🤝 Parceiros" /></Campo>
        <Campo rotulo="Subtítulo"><input className={estiloInput} value={c.parceiros_subtitulo ?? ""} onChange={(e) => mudar("parceiros_subtitulo", e.target.value || null)} /></Campo>
        <Campo rotulo="Efeito animado">
          <select className={estiloInput} value={c.parceiros_efeito ?? "nenhum"} onChange={(e) => mudar("parceiros_efeito", e.target.value as ConfigSite["efeito"])}>
            {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo.replace("Logo da loja", "Logo da MA Online Store")}</option>)}
          </select>
        </Campo>
        <span className="text-sm font-semibold">Fundo da página de parceiros</span>
        <EditorFundo cor={cor} pasta="site/parceiros" logo={c.logo_url ?? null}
          valor={{ fundo_tipo: c.parceiros_fundo_tipo ?? "nenhum", fundo_url: c.parceiros_fundo_url ?? null, fundo_opacidade: c.parceiros_fundo_opacidade ?? 15, fundo_animacao: c.parceiros_fundo_animacao ?? "nenhuma", fundo_cor: c.parceiros_fundo_cor ?? null }}
          borda={{ cor: c.logo_borda_cor, largura: c.logo_borda }}
          aoMudar={(v) => setC({ ...c, parceiros_fundo_tipo: v.fundo_tipo, parceiros_fundo_url: v.fundo_url, parceiros_fundo_opacidade: v.fundo_opacidade, parceiros_fundo_animacao: v.fundo_animacao, parceiros_fundo_cor: v.fundo_cor ?? null })} />
      </Bloco>

      <Bloco titulo="⚙️ Efeito do painel de administração">
        <Campo rotulo="Efeito animado que aparece aqui no painel (para todos os administradores)">
          <select className={estiloInput} value={(c as ConfigSite & { efeito_painel?: string }).efeito_painel ?? "nenhum"}
            onChange={(e) => setC({ ...c, efeito_painel: e.target.value } as ConfigSite)}>
            {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo.replace("Logo da loja", "Logo da MA Online Store")}</option>)}
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
