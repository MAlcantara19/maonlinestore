"use client";
// =====================================================================
// EDITOR DO FUNDO DA PÁGINA (painel) — escolhe o tipo, envia a foto ou o
// vídeo, ajusta a força e mostra uma prévia.
// =====================================================================
import MosaicoRedondo from "@/components/MosaicoRedondo";
import CampoImagem from "@/components/admin/CampoImagem";
import { TAMANHOS } from "@/lib/tamanhos";
import type { AnimacaoFundo, TipoFundo } from "@/lib/tipos";

type Valor = { fundo_tipo: TipoFundo; fundo_url: string | null; fundo_opacidade: number; fundo_animacao?: AnimacaoFundo; fundo_cor?: string | null };
const OPCOES: { valor: TipoFundo; rotulo: string }[] = [
  { valor: "nenhum", rotulo: "Nenhum" },
  { valor: "imagem", rotulo: "🖼️ Foto" },
  { valor: "mosaico", rotulo: "🔁 Logo repetida (papel de parede)" },
  { valor: "video", rotulo: "🎬 Vídeo em looping" },
];

export default function EditorFundo({ valor, aoMudar, logo, pasta, cor, borda }: { valor: Valor; aoMudar: (v: Valor) => void; logo: string | null; pasta: string; cor: string; borda?: { cor?: string | null; largura?: number | null } }) {
  const mudar = (parte: Partial<Valor>) => aoMudar({ ...valor, ...parte });
  const fonte = valor.fundo_tipo === "mosaico" ? valor.fundo_url || logo : valor.fundo_url;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {OPCOES.map((o) => (
          <button key={o.valor} type="button" onClick={() => mudar({ fundo_tipo: o.valor })} className="rounded-full border px-3 py-1.5 text-sm"
            style={valor.fundo_tipo === o.valor ? { background: cor, color: "white", borderColor: cor } : { background: "white" }}>{o.rotulo}</button>
        ))}
      </div>

      {valor.fundo_tipo !== "nenhum" && (
        <>
          <CampoImagem
            rotulo={valor.fundo_tipo === "video" ? "Vídeo do fundo" : valor.fundo_tipo === "mosaico" ? "Imagem do mosaico (vazio = usa a logo)" : "Foto do fundo"}
            valor={valor.fundo_url} aoMudar={(url) => mudar({ fundo_url: url })} pasta={pasta} aceitaVideo={valor.fundo_tipo === "video"}
            dica={valor.fundo_tipo === "video" ? TAMANHOS.fundoVideo : valor.fundo_tipo === "mosaico" ? TAMANHOS.fundoMosaico : TAMANHOS.fundoImagem}
            recorte={valor.fundo_tipo === "imagem" ? { proporcao: 16 / 9, largura: 1920, cores: [cor] } : valor.fundo_tipo === "mosaico" ? { proporcao: 1, largura: 300, cores: [cor] } : undefined}
            redonda={valor.fundo_tipo === "mosaico"} />
          {valor.fundo_tipo !== "video" && (
            <div>
              <span className="text-sm font-semibold">Movimento</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {([["nenhuma", "Parado"], ["respirar", "💓 Respirando (pulsa)"], ["zoom_lento", "🔍 Aproximando devagar"], ["deslizar", "↔️ Passeando para o lado"]] as const).map(([v, r]) => (
                  <button key={v} type="button" onClick={() => mudar({ fundo_animacao: v })} className="rounded-full border px-3 py-1 text-xs"
                    style={(valor.fundo_animacao ?? "nenhuma") === v ? { background: cor, color: "white", borderColor: cor } : { background: "white" }}>{r}</button>
                ))}
              </div>
            </div>
          )}
          {/* Cor que aparece ENTRE as bolinhas do mosaico */}
          {valor.fundo_tipo === "mosaico" && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">Cor entre as logos:</span>
              <button type="button" onClick={() => mudar({ fundo_cor: null })} className="rounded-full border px-2 py-1 text-xs" style={!valor.fundo_cor ? { outline: "2px solid #111" } : {}}>Transparente</button>
              {[cor, "#ffffff", "#000000"].map((c) => (
                <button key={c} type="button" onClick={() => mudar({ fundo_cor: c })} aria-label={`Cor ${c}`} className="h-7 w-7 rounded-full border"
                  style={{ background: c, outline: valor.fundo_cor === c ? "2px solid #111" : "none", outlineOffset: 2 }} />
              ))}
              <input type="color" value={valor.fundo_cor ?? "#ffffff"} onChange={(e) => mudar({ fundo_cor: e.target.value })} className="h-7 w-9 rounded" title="Outra cor" />
            </div>
          )}
          <label className="block text-sm">
            Força do fundo: <b>{valor.fundo_opacidade}%</b> <span className="opacity-60">(10–20% = marca d'água suave, recomendado)</span>
            <input type="range" min={3} max={100} value={valor.fundo_opacidade} onChange={(e) => mudar({ fundo_opacidade: Number(e.target.value) })} className="block w-full" />
          </label>

          {/* Prévia com um "cartão" por cima para ver se continua legível */}
          {fonte && (
            <div className="relative h-48 overflow-hidden rounded-xl border bg-white">
              <div className="absolute inset-0" style={{ opacity: valor.fundo_opacidade / 100 }}>
                {valor.fundo_tipo === "video" && <video src={fonte} autoPlay muted loop playsInline className="h-full w-full object-cover" />}
                {valor.fundo_tipo === "imagem" && <img src={fonte} alt="" className={`h-full w-full object-cover fundo-${valor.fundo_animacao ?? "nenhuma"}`} />}
                {valor.fundo_tipo === "mosaico" && <div className={`absolute inset-0 fundo-${valor.fundo_animacao ?? "nenhuma"}`}><MosaicoRedondo src={fonte} tamanho={56} quantidade={120} corFundo={valor.fundo_cor} borda={borda} /></div>}
              </div>
              <div className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white/80 p-3 text-center text-xs shadow">
                <div className="mb-2 h-14 rounded-lg" style={{ background: `${cor}33` }} />
                <b>Produto de exemplo</b>
              </div>
              <span className="absolute left-2 top-1 text-xs opacity-60">Prévia</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
