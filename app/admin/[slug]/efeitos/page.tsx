"use client";
// =====================================================================
// PAINEL — EFEITOS PERSONALIZADOS (endereço: /admin/vitraforma/efeitos)
// Crie efeitos com as SUAS imagens (ex.: patinhos, moedas, bolinhas):
//   1. Dê um nome e envie 1 ou mais imagens (PNG com fundo transparente
//      fica perfeito)
//   2. Escolha o movimento, a quantidade e o tamanho — a prévia mostra ao vivo
//   3. Use o efeito na loja inteira (Configurações), numa categoria ou
//      coleção (aba Categorias e coleções)
// =====================================================================
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco, Campo, estiloInput } from "@/components/admin/Campos";
import EfeitoFestivo from "@/components/EfeitoFestivo";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { lojaPeloSlug, type LojaResumo } from "@/lib/admin";
import { enviarArquivo } from "@/lib/upload";
import type { EfeitoPersonalizado } from "@/lib/tipos";

const MOVIMENTOS = [
  { valor: "cair", rotulo: "⬇️ Caindo" },
  { valor: "subir", rotulo: "⬆️ Subindo" },
  { valor: "voar", rotulo: "🦋 Voando pela tela" },
  { valor: "piscar", rotulo: "✨ Piscando parados" },
] as const;

const NOVO: EfeitoPersonalizado = { id: "", nome: "", imagens: [], movimento: "cair", quantidade: 14, tamanho: 40 };

export default function PainelEfeitos() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [efeitos, setEfeitos] = useState<EfeitoPersonalizado[]>([]);
  const [editando, setEditando] = useState<EfeitoPersonalizado>(NOVO);
  const [enviando, setEnviando] = useState(0);
  const [aviso, setAviso] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async (l: LojaResumo) => {
    const { data } = await supabaseNavegador().from("efeitos_personalizados").select("id, nome, imagens, movimento, quantidade, tamanho").eq("loja_id", l.id).order("criado_em");
    setEfeitos((data ?? []) as EfeitoPersonalizado[]);
  }, []);
  useEffect(() => { lojaPeloSlug(slug).then((l) => { setLoja(l); if (l) carregar(l); }); }, [slug, carregar]);
  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  async function enviarImagens(arquivos: FileList | null) {
    if (!arquivos || !loja) return;
    const lista = Array.from(arquivos);
    setEnviando((n) => n + lista.length);
    for (const a of lista) {
      try {
        const { url } = await enviarArquivo(a, `${loja.slug}/efeitos`);
        setEditando((e) => ({ ...e, imagens: [...e.imagens, url] }));
      } catch (err) { setAviso((err as Error).message); }
      setEnviando((n) => n - 1);
    }
    if (entrada.current) entrada.current.value = "";
  }

  async function salvar() {
    if (!loja) return;
    if (!editando.nome.trim() || editando.imagens.length === 0) return setAviso("Dê um nome e envie pelo menos uma imagem.");
    const { id, ...campos } = editando;
    const r = id
      ? await supabaseNavegador().from("efeitos_personalizados").update(campos).eq("id", id)
      : await supabaseNavegador().from("efeitos_personalizados").insert({ ...campos, loja_id: loja.id });
    if (r.error) return setAviso(`Erro: ${r.error.message}`);
    setAviso("✓ Efeito salvo! Agora escolha onde usar (Configurações ou Categorias e coleções).");
    setEditando(NOVO);
    carregar(loja);
  }

  async function excluir(e: EfeitoPersonalizado) {
    if (!loja || !confirm(`Excluir o efeito "${e.nome}"? Onde ele estava sendo usado, volta ao normal.`)) return;
    await supabaseNavegador().from("efeitos_personalizados").delete().eq("id", e.id);
    carregar(loja);
  }

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />

      <Bloco titulo={editando.id ? `✏️ Editando: ${editando.nome}` : "➕ Novo efeito"}>
        <Campo rotulo="Nome (ex.: Patinhos, Moedas, Bolas de futebol)">
          <input className={estiloInput} value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
        </Campo>

        <div>
          <span className="text-sm font-semibold">Imagens do efeito (PNG com fundo transparente fica perfeito)</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {editando.imagens.map((url) => (
              <span key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:12px_12px]">
                <img src={url} alt="" className="h-full w-full object-contain" />
                <button type="button" onClick={() => setEditando({ ...editando, imagens: editando.imagens.filter((x) => x !== url) })}
                  className="absolute right-0 top-0 rounded-bl bg-white/90 px-1 text-xs text-red-600" aria-label="Remover imagem">✕</button>
              </span>
            ))}
            <button type="button" onClick={() => entrada.current?.click()} className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-dashed text-xs opacity-70">
              <span className="text-xl">＋</span>{enviando > 0 ? "..." : "Imagem"}
            </button>
          </div>
          <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={(e) => enviarImagens(e.target.files)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Movimento">
            <select className={estiloInput} value={editando.movimento} onChange={(e) => setEditando({ ...editando, movimento: e.target.value as EfeitoPersonalizado["movimento"] })}>
              {MOVIMENTOS.map((m) => <option key={m.valor} value={m.valor}>{m.rotulo}</option>)}
            </select>
          </Campo>
          <Campo rotulo={`Quantidade: ${editando.quantidade}`}>
            <input type="range" min={3} max={40} value={editando.quantidade} onChange={(e) => setEditando({ ...editando, quantidade: Number(e.target.value) })} className="mt-3 w-full" />
          </Campo>
          <Campo rotulo={`Tamanho: ${editando.tamanho}px`}>
            <input type="range" min={12} max={120} value={editando.tamanho} onChange={(e) => setEditando({ ...editando, tamanho: Number(e.target.value) })} className="mt-3 w-full" />
          </Campo>
        </div>

        {/* Prévia ao vivo */}
        <div className="relative h-56 overflow-hidden rounded-xl border bg-gradient-to-b from-stone-50 to-stone-100">
          <span className="absolute left-3 top-2 z-10 text-xs opacity-50">Prévia</span>
          {editando.imagens.length > 0 && <EfeitoFestivo key={JSON.stringify(editando)} cor={cor} personalizado={editando} contido />}
        </div>

        {aviso && <p className="text-sm">{aviso}</p>}
        <div className="flex gap-2">
          {editando.id && <button type="button" onClick={() => setEditando(NOVO)} className="rounded-xl border px-4 text-sm">Cancelar</button>}
          <button type="button" onClick={salvar} className="flex-1 rounded-xl p-3 font-semibold text-white" style={{ background: cor }}>Salvar efeito</button>
        </div>
      </Bloco>

      <Bloco titulo="✨ Efeitos da loja">
        {efeitos.length === 0 ? <p className="text-sm opacity-60">Nenhum efeito personalizado ainda.</p> : efeitos.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-stone-50 p-3">
            <div className="flex -space-x-2">
              {e.imagens.slice(0, 4).map((u) => <img key={u} src={u} alt="" className="h-9 w-9 rounded-full border-2 border-white bg-white object-contain" />)}
            </div>
            <b className="flex-1">{e.nome}</b>
            <span className="text-xs opacity-60">{MOVIMENTOS.find((m) => m.valor === e.movimento)?.rotulo}</span>
            <button type="button" onClick={() => setEditando(e)} className="rounded-lg border px-3 py-1.5 text-sm">Editar</button>
            <button type="button" onClick={() => excluir(e)} className="rounded-lg border px-3 py-1.5 text-sm text-red-600">🗑️</button>
          </div>
        ))}
      </Bloco>
    </>
  );
}
