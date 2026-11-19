"use client";
// =====================================================================
// 🖼️ BANNER DA COLEÇÃO — imagem do topo da página da coleção
// (/loja/colecao/ID). Salva sozinho ao enviar ou remover.
// Também tem os atalhos: abrir a página e montar o catálogo dela.
// =====================================================================
import { useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import CampoImagem from "@/components/admin/CampoImagem";

export default function BannerColecao({ colecaoId, slug }: { colecaoId: string; slug: string }) {
  const [banner, setBanner] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabaseNavegador().from("colecoes").select("banner_url").eq("id", colecaoId).maybeSingle()
      .then(({ data, error }: { data: { banner_url: string | null } | null; error: unknown }) => { if (!error) { setBanner(data?.banner_url ?? null); setPronto(true); } });
  }, [colecaoId]);

  async function mudar(url: string | null) {
    setBanner(url);
    const { error } = await supabaseNavegador().from("colecoes").update({ banner_url: url }).eq("id", colecaoId);
    setMsg(error ? `😕 ${error.message}` : "✓ Banner salvo!");
  }

  return (
    <details className="pl-10 text-sm">
      <summary className="cursor-pointer font-semibold opacity-80">🖼️ Banner e página da coleção</summary>
      <div className="mt-2 space-y-2">
        {pronto ? (
          <CampoImagem rotulo="Banner do topo da página da coleção" valor={banner} aoMudar={mudar} pasta="colecoes"
            dica="📐 Ideal: 1920 × 600 px (deitada) · o texto da coleção fica por cima, do lado esquerdo"
            recorte={{ proporcao: 16 / 5, largura: 1920 }} />
        ) : <p className="text-xs opacity-60">Rode a atualização 32 no Supabase para enviar banner.</p>}
        {msg && <p className="text-xs">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          <a href={`/${slug}/colecao/${colecaoId}`} target="_blank" className="rounded-full border px-3 py-1 text-xs">👁️ Ver página da coleção</a>
          <a href={`/${slug}/catalogo?colecao=${colecaoId}`} target="_blank" className="rounded-full border px-3 py-1 text-xs">🎄 Montar catálogo desta coleção</a>
        </div>
      </div>
    </details>
  );
}
