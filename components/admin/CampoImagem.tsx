"use client";
// =====================================================================
// CAMPO DE IMAGEM DO PAINEL — "Escolher foto" do celular/PC (galeria,
// Google Fotos, câmera), com prévia e botão de remover.
// Também aceita colar um endereço de imagem, se preferir.
// =====================================================================
import { useRef, useState } from "react";
import { enviarArquivo } from "@/lib/upload";

type Props = {
  rotulo: string;
  valor: string | null;
  aoMudar: (url: string | null) => void;
  pasta: string; // pasta no Storage: "logos", "parceiros", "site"...
  redonda?: boolean; // prévia redonda (para logos)
  dica?: string; // tamanho ideal (mostrado embaixo)
  aceitaVideo?: boolean; // deixa escolher vídeo também
};

const ehVideo = (url: string | null) => !!url && /\.(mp4|webm|mov)(\?|$)/i.test(url);

export default function CampoImagem({ rotulo, valor, aoMudar, pasta, redonda, dica, aceitaVideo }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function escolher(arquivos: FileList | null) {
    const arquivo = arquivos?.[0];
    if (!arquivo) return;
    setEnviando(true);
    setErro("");
    try {
      const { url } = await enviarArquivo(arquivo, pasta);
      aoMudar(url);
    } catch (e) {
      setErro((e as Error).message);
    }
    setEnviando(false);
    if (entrada.current) entrada.current.value = "";
  }

  return (
    <div>
      <span className="text-sm font-semibold">{rotulo}</span>
      <div className="mt-1 flex items-center gap-3">
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-stone-200 text-xs opacity-90 ${redonda ? "rounded-full" : "rounded-xl"}`}>
          {valor ? (ehVideo(valor)
            ? <video src={valor} muted loop autoPlay playsInline className="h-full w-full object-cover" />
            : <img src={valor} alt="" className="h-full w-full object-cover" />) : "sem imagem"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => entrada.current?.click()} disabled={enviando}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {enviando ? "Enviando..." : valor ? "Trocar" : aceitaVideo ? "📷 Escolher foto ou vídeo" : "📷 Escolher foto"}
          </button>
          {valor && (
            <button type="button" onClick={() => aoMudar(null)} className="rounded-full border px-4 py-2 text-sm">Remover</button>
          )}
        </div>
        <input ref={entrada} type="file" accept={aceitaVideo ? "image/*,video/*" : "image/*"} className="hidden" onChange={(e) => escolher(e.target.files)} />
      </div>
      {dica && <p className="mt-1 text-xs opacity-60">{dica}</p>}
      {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
      <details className="mt-1 text-xs opacity-70">
        <summary className="cursor-pointer">ou colar o endereço da imagem</summary>
        <input className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm" value={valor ?? ""} onChange={(e) => aoMudar(e.target.value || null)} placeholder="https://..." />
      </details>
    </div>
  );
}
