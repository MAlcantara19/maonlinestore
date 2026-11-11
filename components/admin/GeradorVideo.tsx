"use client";
// =====================================================================
// 🎬 VÍDEO PARA REELS / STATUS — junta até 4 fotos do produto num vídeo
// vertical (1080×1920) de ~8 segundos: zoom suave em cada foto, troca com
// esmaecer, nome e preço entrando e o @ da loja no final.
// Feito no próprio navegador (sem programa nenhum).
// =====================================================================
import { useRef, useState } from "react";
import { formatarPreco } from "@/lib/formato";

const carregar = (src: string) => new Promise<HTMLImageElement | null>((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

export default function GeradorVideo({ fotos, nome, preco, loja, cor, instagram }: { fotos: string[]; nome: string; preco: number | null; loja: string; cor: string; instagram?: string | null }) {
  const tela = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<"" | "gravando" | "pronto">("");
  const [video, setVideo] = useState<{ url: string; tipo: string } | null>(null);
  const [frase, setFrase] = useState("Feito com carinho 💜");

  async function gerar() {
    const imgs = (await Promise.all(fotos.slice(0, 4).map(carregar))).filter(Boolean) as HTMLImageElement[];
    if (!imgs.length) return alert("Suba pelo menos uma foto do produto.");
    const c = tela.current!; const L = 1080, A = 1920; c.width = L; c.height = A;
    const ctx = c.getContext("2d")!;
    const tipo = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
    const gravador = new MediaRecorder(c.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 6_000_000 });
    const partes: Blob[] = [];
    gravador.ondataavailable = (e) => e.data.size && partes.push(e.data);
    const fim = new Promise<void>((ok) => (gravador.onstop = () => ok()));
    setEstado("gravando"); gravador.start();

    const duracao = 8000, porFoto = (duracao - 1500) / imgs.length, inicio = performance.now();
    const desenharFoto = (img: HTMLImageElement, zoom: number, alpha: number) => {
      const e = Math.max(L / img.width, A / img.height) * zoom;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (L - img.width * e) / 2, (A - img.height * e) / 2, img.width * e, img.height * e);
      ctx.globalAlpha = 1;
    };
    await new Promise<void>((ok) => {
      const quadro = (agora: number) => {
        const t = agora - inicio;
        ctx.fillStyle = cor; ctx.fillRect(0, 0, L, A);
        if (t < duracao - 1500) {
          const i = Math.min(imgs.length - 1, Math.floor(t / porFoto)), dentro = (t - i * porFoto) / porFoto;
          desenharFoto(imgs[i], 1 + dentro * 0.12, 1);
          if (dentro > 0.85 && imgs[i + 1]) desenharFoto(imgs[i + 1], 1, (dentro - 0.85) / 0.15); // esmaece para a próxima
          // faixa de baixo com nome e preço
          const g = ctx.createLinearGradient(0, A - 700, 0, A); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.75)");
          ctx.fillStyle = g; ctx.fillRect(0, A - 700, L, 700);
          const entrada = Math.min(1, t / 700);
          ctx.globalAlpha = entrada; ctx.fillStyle = "#fff"; ctx.textAlign = "left";
          ctx.font = "bold 78px system-ui"; ctx.fillText(nome.length > 24 ? `${nome.slice(0, 23)}…` : nome, 70 - (1 - entrada) * 80, A - 300);
          if (preco != null) { ctx.font = "bold 96px system-ui"; ctx.fillText(formatarPreco(preco), 70 - (1 - entrada) * 80, A - 180); }
          ctx.font = "42px system-ui"; ctx.fillText(frase, 70, A - 100); ctx.globalAlpha = 1;
        } else {
          // tela final: nome da loja e @
          const f = Math.min(1, (t - (duracao - 1500)) / 500);
          ctx.globalAlpha = f; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
          ctx.font = "bold 96px system-ui"; ctx.fillText(loja, L / 2, A / 2 - 40);
          ctx.font = "54px system-ui"; ctx.fillText(instagram ? `@${instagram.replace(/^@/, "")}` : "Peça pelo WhatsApp 💬", L / 2, A / 2 + 60);
          ctx.globalAlpha = 1; ctx.textAlign = "left";
        }
        if (t < duracao) requestAnimationFrame(quadro); else ok();
      };
      requestAnimationFrame(quadro);
    });
    gravador.stop(); await fim;
    const blob = new Blob(partes, { type: tipo.split(";")[0] });
    setVideo({ url: URL.createObjectURL(blob), tipo: tipo.split(";")[0] });
    setEstado("pronto");
  }

  async function compartilhar() {
    if (!video) return;
    const ext = video.tipo.includes("mp4") ? "mp4" : "webm";
    const arquivo = new File([await (await fetch(video.url)).blob()], `video-${nome.slice(0, 20)}.${ext}`, { type: video.tipo });
    if (navigator.canShare?.({ files: [arquivo] })) await navigator.share({ files: [arquivo] }).catch(() => {});
    else { const a = document.createElement("a"); a.href = video.url; a.download = arquivo.name; a.click(); }
  }

  return (
    <div className="space-y-2">
      <input className="w-full rounded-lg border bg-white px-3 py-2 text-sm" value={frase} onChange={(e) => setFrase(e.target.value)} placeholder="Frase do vídeo" />
      <button type="button" onClick={gerar} disabled={estado === "gravando" || !fotos.length} className="w-full rounded-xl p-2 font-semibold text-white disabled:opacity-50" style={{ background: cor }}>
        {estado === "gravando" ? "🎬 Gravando... (8 segundos, deixe esta aba aberta)" : `🎬 Gerar vídeo (${Math.min(4, fotos.length)} foto${fotos.length === 1 ? "" : "s"})`}
      </button>
      <canvas ref={tela} className={estado === "gravando" ? "mx-auto block w-40 rounded-lg" : "hidden"} />
      {video && estado === "pronto" && (
        <>
          <video src={video.url} controls autoPlay loop muted playsInline className="mx-auto w-full max-w-[220px] rounded-xl shadow-lg" />
          <button type="button" onClick={compartilhar} className="w-full rounded-xl bg-green-600 p-2 font-semibold text-white">📲 Compartilhar / baixar vídeo</button>
          {!video.tipo.includes("mp4") && <p className="text-xs opacity-60">Este navegador gerou o vídeo em .webm. Para postar no Instagram, gere pelo Chrome atualizado no computador ou no Android (sai em .mp4).</p>}
        </>
      )}
    </div>
  );
}
