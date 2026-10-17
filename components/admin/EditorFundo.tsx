"use client";
// =====================================================================
// EDITOR DO FUNDO DA PÁGINA (painel) — escolhe o tipo, envia a foto ou o
// vídeo, ajusta a força e mostra uma prévia.
// =====================================================================
import CampoImagem from "@/components/admin/CampoImagem";
import { TAMANHOS } from "@/lib/tamanhos";
import type { TipoFundo } from "@/lib/tipos";

type Valor = { fundo_tipo: TipoFundo; fundo_url: string | null; fundo_opacidade: number };
const OPCOES: { valor: TipoFundo; rotulo: string }[] = [
  { valor: "nenhum", rotulo: "Nenhum" },
  { valor: "imagem", rotulo: "🖼️ Foto" },
  { valor: "mosaico", rotulo: "🔁 Logo repetida (papel de parede)" },
  { valor: "video", rotulo: "🎬 Vídeo em looping" },
];

export default function EditorFundo({ valor, aoMudar, logo, pasta, cor }: { valor: Valor; aoMudar: (v: Valor) => void; logo: string | null; pasta: string; cor: string }) {
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
            dica={valor.fundo_tipo === "video" ? TAMANHOS.fundoVideo : valor.fundo_tipo === "mosaico" ? TAMANHOS.fundoMosaico : TAMANHOS.fundoImagem} />
          <label className="block text-sm">
            Força do fundo: <b>{valor.fundo_opacidade}%</b> <span className="opacity-60">(10–20% = marca d'água suave, recomendado)</span>
            <input type="range" min={3} max={100} value={valor.fundo_opacidade} onChange={(e) => mudar({ fundo_opacidade: Number(e.target.value) })} className="block w-full" />
          </label>

          {/* Prévia com um "cartão" por cima para ver se continua legível */}
          {fonte && (
            <div className="relative h-48 overflow-hidden rounded-xl border bg-white">
              <div className="absolute inset-0" style={{ opacity: valor.fundo_opacidade / 100 }}>
                {valor.fundo_tipo === "video" && <video src={fonte} autoPlay muted loop playsInline className="h-full w-full object-cover" />}
                {valor.fundo_tipo === "imagem" && <img src={fonte} alt="" className="h-full w-full object-cover" />}
                {valor.fundo_tipo === "mosaico" && <div className="h-full w-full" style={{ backgroundImage: `url(${fonte})`, backgroundSize: "70px 70px" }} />}
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
