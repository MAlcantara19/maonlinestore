"use client";
// =====================================================================
// PAINEL — CRIAR / EDITAR PARCEIRO (endereço: /admin/parceiros/<id>)
// "/admin/parceiros/novo" abre o formulário vazio para cadastrar.
// Tudo do parceiro: textos, contatos, endereço (gera o mapa), fotos,
// cor, efeito animado, selo, destaque e ativo/desativado.
// =====================================================================
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import { Bloco, Campo, Interruptor, BarraSalvar, estiloInput, type Mensagem } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { OPCOES_EFEITO } from "@/lib/opcoes";
import type { Parceiro } from "@/lib/tipos";

// Transforma o nome em endereço: "Judô Clube Denis" -> "judo-clube-denis"
const virarSlug = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const VAZIO: Parceiro = {
  id: "", slug: "", nome: "", categoria: null, descricao: null, horarios: null, endereco: null, whatsapp: null,
  instagram: null, site: null, logo_url: null, foto_url: null, cor: "#1c1917", efeito: "nenhum", destaque: false, selo: null, ativo: true, ordem: 0,
};

export default function PainelParceiro() {
  return <AreaAdmin>{(info) => (info.master ? <Formulario /> : <p>Só o administrador master mexe nos parceiros.</p>)}</AreaAdmin>;
}

function Formulario() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const novo = id === "novo";
  const [p, setP] = useState<Parceiro | null>(novo ? VAZIO : null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  useEffect(() => {
    if (novo) return;
    supabaseNavegador().from("parceiros").select("*").eq("id", id).maybeSingle()
      .then(({ data }: { data: Parceiro | null }) => setP(data ?? VAZIO));
  }, [id, novo]);
  if (!p) return <p className="opacity-60">Carregando...</p>;

  const mudar = <K extends keyof Parceiro>(campo: K, valor: Parceiro[K]) => { setP({ ...p, [campo]: valor }); setMensagem(null); };

  async function salvar() {
    if (!p) return;
    if (!p.nome.trim()) return setMensagem({ tipo: "erro", texto: "Coloque pelo menos o nome." });
    setSalvando(true);
    const supabase = supabaseNavegador();
    const { id: _id, ...campos } = p;
    const dados = { ...campos, slug: p.slug || virarSlug(p.nome) };
    const resposta = novo
      ? await supabase.from("parceiros").insert(dados).select("id").single()
      : await supabase.from("parceiros").update(dados).eq("id", p.id).select("id").single();
    setSalvando(false);
    if (resposta.error) return setMensagem({ tipo: "erro", texto: `Não deu para salvar: ${resposta.error.message}` });
    setMensagem({ tipo: "ok", texto: "✓ Salvo!" });
    if (novo) router.replace(`/admin/parceiros/${resposta.data.id}`); // passa a editar o recém-criado
  }

  async function excluir() {
    if (!p || novo) return;
    if (!confirm(`Excluir "${p.nome}" para sempre? (Para só esconder, use "Ativo".)`)) return;
    const { error } = await supabaseNavegador().from("parceiros").delete().eq("id", p.id);
    if (error) setMensagem({ tipo: "erro", texto: error.message });
    else router.replace("/admin/parceiros");
  }

  const cor = p.cor ?? "#1c1917";
  return (
    <>
      <Link href="/admin/parceiros" className="text-sm opacity-60">← Parceiros</Link>
      <div className="mt-1 mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{novo ? "Novo parceiro" : p.nome}</h1>
        {!novo && <Link href={`/parceiros/${p.slug}`} target="_blank" className="rounded-full border px-3 py-1.5 text-sm">👁️ Ver página</Link>}
      </div>

      {/* Prévia: foto grande + logo no meio */}
      <div className="relative mb-6 flex h-44 items-center justify-center overflow-hidden rounded-2xl shadow" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
        {p.foto_url && <img src={p.foto_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        {p.logo_url
          ? <img src={p.logo_url} alt="" className="relative h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-lg" />
          : !p.foto_url && <span className="text-4xl font-bold text-white">{p.nome.charAt(0) || "?"}</span>}
        {p.selo && <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold">{p.selo}</span>}
      </div>

      <Bloco titulo="📝 Informações">
        <Campo rotulo="Nome"><input className={estiloInput} value={p.nome} onChange={(e) => mudar("nome", e.target.value)} /></Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Categoria (ex.: Judô, Escola, Saúde)"><input className={estiloInput} value={p.categoria ?? ""} onChange={(e) => mudar("categoria", e.target.value || null)} /></Campo>
          <Campo rotulo="Selo (ex.: Patrocinado, 10% de desconto)"><input className={estiloInput} value={p.selo ?? ""} onChange={(e) => mudar("selo", e.target.value || null)} /></Campo>
        </div>
        <Campo rotulo="Endereço da página (deixe vazio para criar a partir do nome)">
          <input className={estiloInput} value={p.slug} onChange={(e) => mudar("slug", virarSlug(e.target.value))} placeholder={virarSlug(p.nome) || "nome-do-parceiro"} />
        </Campo>
        <Campo rotulo="Descrição (pode usar emojis e várias linhas)">
          <textarea rows={4} className={estiloInput} value={p.descricao ?? ""} onChange={(e) => mudar("descricao", e.target.value || null)} />
        </Campo>
        <Campo rotulo="Horários"><textarea rows={2} className={estiloInput} value={p.horarios ?? ""} onChange={(e) => mudar("horarios", e.target.value || null)} placeholder="Seg e Qua · 18h às 20h" /></Campo>
        <Campo rotulo="Endereço completo (gera o mapa sozinho)"><input className={estiloInput} value={p.endereco ?? ""} onChange={(e) => mudar("endereco", e.target.value || null)} placeholder="Rua, número, bairro, cidade - UF" /></Campo>
      </Bloco>

      <Bloco titulo="📞 Contato">
        <Campo rotulo="WhatsApp (55 + DDD + número)"><input className={estiloInput} inputMode="numeric" value={p.whatsapp ?? ""} onChange={(e) => mudar("whatsapp", e.target.value || null)} /></Campo>
        <Campo rotulo="Instagram (@usuario, usuario ou link)"><input className={estiloInput} value={p.instagram ?? ""} onChange={(e) => mudar("instagram", e.target.value || null)} /></Campo>
        <Campo rotulo="Site (link completo)"><input className={estiloInput} value={p.site ?? ""} onChange={(e) => mudar("site", e.target.value || null)} placeholder="https://..." /></Campo>
      </Bloco>

      <Bloco titulo="🖼️ Imagens e aparência">
        <Campo rotulo="Foto grande de fundo (fachada, local, pessoa) — endereço"><input className={estiloInput} value={p.foto_url ?? ""} onChange={(e) => mudar("foto_url", e.target.value || null)} placeholder="https://..." /></Campo>
        <Campo rotulo="Logo (fica redonda, no meio da foto) — endereço"><input className={estiloInput} value={p.logo_url ?? ""} onChange={(e) => mudar("logo_url", e.target.value || null)} placeholder="https://..." /></Campo>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Cor"><input type="color" className="mt-1 h-11 w-full rounded-lg" value={p.cor ?? "#1c1917"} onChange={(e) => mudar("cor", e.target.value)} /></Campo>
          <Campo rotulo="Efeito animado">
            <select className={estiloInput} value={p.efeito ?? "nenhum"} onChange={(e) => mudar("efeito", e.target.value as Parceiro["efeito"])}>
              {OPCOES_EFEITO.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Ordem (menor aparece antes)"><input type="number" className={estiloInput} value={p.ordem ?? 0} onChange={(e) => mudar("ordem", Number(e.target.value) || 0)} /></Campo>
        </div>
      </Bloco>

      <Bloco titulo="👀 Visibilidade">
        <Interruptor rotulo="Ativo" ajuda="Desligado: o parceiro some do site (sem apagar)." ligado={p.ativo !== false} aoMudar={(v) => mudar("ativo", v)} />
        <Interruptor rotulo="⭐ Destaque" ajuda="Aparece primeiro, com borda dourada." ligado={!!p.destaque} aoMudar={(v) => mudar("destaque", v)} />
      </Bloco>

      <BarraSalvar mensagem={mensagem} salvando={salvando} aoSalvar={salvar} cor={cor}
        extra={!novo && <button type="button" onClick={excluir} className="rounded-xl border border-red-300 px-4 text-sm text-red-600">Excluir</button>} />
    </>
  );
}
