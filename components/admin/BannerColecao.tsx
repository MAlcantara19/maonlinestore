"use client";
// =====================================================================
// 🖼️ BANNERS, ⏳ CONTAGEM E PÁGINA DA COLEÇÃO (painel → Categorias e
// coleções). Salva sozinho a cada mudança.
//   - Várias imagens no topo da página da coleção (trocam sozinhas)
//   - Contagem "Páscoa até 30/03" (na loja e na página da coleção)
//   - Atalhos: ver a página e montar o catálogo desta coleção
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import CampoImagem from "@/components/admin/CampoImagem";

const paraCampo = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso), p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function BannerColecao({ colecaoId, slug }: { colecaoId: string; slug: string }) {
  const [banners, setBanners] = useState<string[]>([]);
  const [contagem, setContagem] = useState<{ ate: string | null; texto: string }>({ ate: null, texto: "" });
  const [versao, setVersao] = useState<"" | "32" | "33">("");
  const [msg, setMsg] = useState("");
  const [chave, setChave] = useState(0); // limpa o campo "adicionar" depois de enviar

  useEffect(() => {
    const sb = supabaseNavegador();
    sb.from("colecoes").select("banner_url, banners, contagem_ate, contagem_texto").eq("id", colecaoId).maybeSingle()
      .then(({ data, error }: { data: { banner_url: string | null; banners: string[] | null; contagem_ate: string | null; contagem_texto: string | null } | null; error: unknown }) => {
        if (!error) {
          setVersao("33");
          setBanners([...new Set([...(data?.banners ?? []), ...(data?.banner_url ? [data.banner_url] : [])])]);
          setContagem({ ate: data?.contagem_ate ?? null, texto: data?.contagem_texto ?? "" });
          return;
        }
        // Só a 32 rodada: um banner
        sb.from("colecoes").select("banner_url").eq("id", colecaoId).maybeSingle()
          .then(({ data: d, error: e }: { data: { banner_url: string | null } | null; error: unknown }) => { if (!e) { setVersao("32"); setBanners(d?.banner_url ? [d.banner_url] : []); } });
      });
  }, [colecaoId]);

  async function salvar(campos: Record<string, unknown>) {
    const { error } = await supabaseNavegador().from("colecoes").update(campos).eq("id", colecaoId);
    setMsg(error ? `😕 ${error.message}` : "✓ Salvo!");
  }
  function mudarBanners(lista: string[]) {
    setBanners(lista);
    salvar(versao === "33" ? { banners: lista, banner_url: lista[0] ?? null } : { banner_url: lista[0] ?? null });
  }
  const mover = (i: number, d: number) => { const l = [...banners]; [l[i], l[i + d]] = [l[i + d], l[i]]; mudarBanners(l); };

  return (
    <details className="pl-10 text-sm">
      <summary className="cursor-pointer font-semibold opacity-80">🖼️ Banners, ⏳ contagem e página da coleção</summary>
      <div className="mt-2 space-y-3">
        {!versao && <p className="text-xs opacity-60">Rode as atualizações 32 e 33 no Supabase para usar esta parte.</p>}
        {versao && (
          <>
            <div>
              <p className="text-xs font-semibold">Imagens do topo da página da coleção {versao === "33" ? "(várias: trocam sozinhas)" : ""}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {banners.map((b, i) => (
                  <div key={b} className="relative w-40 overflow-hidden rounded-lg border">
                    <img src={b} alt="" className="aspect-[16/5] w-full object-cover" />
                    <div className="flex justify-between bg-white/90 px-1 text-xs">
                      <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} className="disabled:opacity-20">◀</button>
                      <button type="button" onClick={() => mudarBanners(banners.filter((x) => x !== b))} className="text-red-600">Remover</button>
                      <button type="button" disabled={i === banners.length - 1} onClick={() => mover(i, 1)} className="disabled:opacity-20">▶</button>
                    </div>
                  </div>
                ))}
              </div>
              {(versao === "33" || banners.length === 0) && (
                <CampoImagem key={chave} rotulo={banners.length ? "➕ Adicionar outra imagem" : "➕ Adicionar imagem"} valor={null} pasta="colecoes"
                  aoMudar={(url) => { if (url) { mudarBanners([...banners, url]); setChave((c) => c + 1); } }}
                  dica="📐 Ideal: 1920 × 600 px (deitada) · o nome da coleção fica por cima, à esquerda"
                  recorte={{ proporcao: 16 / 5, largura: 1920 }} />
              )}
            </div>
            {versao === "33" && (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input className="rounded-lg border bg-white px-2 py-1.5" placeholder="⏳ Texto (ex.: Encomendas de Páscoa até)" maxLength={40} value={contagem.texto} onChange={(e) => setContagem({ ...contagem, texto: e.target.value })} />
                <input type="datetime-local" className="rounded-lg border bg-white px-2 py-1.5" value={paraCampo(contagem.ate)} onChange={(e) => setContagem({ ...contagem, ate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                <div className="flex gap-1">
                  <button type="button" onClick={() => salvar({ contagem_ate: contagem.ate, contagem_texto: contagem.texto.trim() || null })} className="rounded-lg border px-3 py-1.5 font-semibold">Salvar contagem</button>
                  {contagem.ate && <button type="button" onClick={() => { setContagem({ ate: null, texto: "" }); salvar({ contagem_ate: null, contagem_texto: null }); }} className="rounded-lg border px-2 py-1.5 text-red-600">✕</button>}
                </div>
              </div>
            )}
            {msg && <p className="text-xs">{msg}</p>}
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <a href={`/${slug}/colecao/${colecaoId}`} target="_blank" className="rounded-full border px-3 py-1 text-xs">👁️ Ver página da coleção</a>
          <a href={`/${slug}/catalogo?colecao=${colecaoId}`} target="_blank" className="rounded-full border px-3 py-1 text-xs">🎨 Montar catálogo desta coleção</a>
        </div>
      </div>
    </details>
  );
}
