"use client";
// =====================================================================
// 📸 POST PARA O INSTAGRAM — gera uma imagem 1080×1350 do produto:
// foto grande, nome, preço, a loja e um QR Code que abre o produto.
// No celular, "Compartilhar" já manda para o Instagram/WhatsApp.
// =====================================================================
import { useState } from "react";
import QRCode from "qrcode";
import { formatarPreco } from "@/lib/formato";

const carregar = (src: string) => new Promise<HTMLImageElement | null>((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

export default function GeradorPost({ foto, nome, preco, loja, cor, url }: { foto: string | null; nome: string; preco: number | null; loja: string; cor: string; url: string }) {
  const [imagem, setImagem] = useState<string | null>(null);
  const [frase, setFrase] = useState("Peça já o seu! 💜");

  async function gerar() {
    const c = document.createElement("canvas"); const L = 1080, A = 1350; c.width = L; c.height = A;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = cor; ctx.fillRect(0, 0, L, A);
    const img = foto ? await carregar(foto) : null;
    if (img) { // foto cobrindo a parte de cima, sem distorcer
      const area = { w: L, h: 1000 };
      const e = Math.max(area.w / img.width, area.h / img.height);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, area.w, area.h); ctx.clip();
      ctx.drawImage(img, (area.w - img.width * e) / 2, (area.h - img.height * e) / 2, img.width * e, img.height * e);
      ctx.restore();
    }
    const g = ctx.createLinearGradient(0, 760, 0, 1000); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, cor);
    ctx.fillStyle = g; ctx.fillRect(0, 760, L, 240);
    ctx.fillStyle = "#fff"; ctx.font = "bold 64px system-ui";
    const palavras = nome.split(" "); let linha = "", y = 1080; const linhas: string[] = [];
    palavras.forEach((p) => { if (ctx.measureText(`${linha} ${p}`).width > 700) { linhas.push(linha); linha = p; } else linha = linha ? `${linha} ${p}` : p; });
    linhas.push(linha);
    linhas.slice(0, 2).forEach((l) => { ctx.fillText(l, 60, y); y += 74; });
    if (preco != null) { ctx.font = "bold 72px system-ui"; ctx.fillText(formatarPreco(preco), 60, y + 20); }
    ctx.font = "34px system-ui"; ctx.globalAlpha = 0.9; ctx.fillText(frase, 60, A - 60); ctx.fillText(loja, 60, A - 110); ctx.globalAlpha = 1;
    const qr = await carregar(await QRCode.toDataURL(url, { margin: 1, width: 240 }));
    if (qr) { ctx.fillStyle = "#fff"; ctx.fillRect(L - 300, A - 320, 260, 260); ctx.drawImage(qr, L - 290, A - 310, 240, 240); }
    setImagem(c.toDataURL("image/png"));
  }

  async function compartilhar() {
    if (!imagem) return;
    const blob = await (await fetch(imagem)).blob();
    const arquivo = new File([blob], `post-${nome.slice(0, 20)}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [arquivo] })) await navigator.share({ files: [arquivo] }).catch(() => {});
    else { const a = document.createElement("a"); a.href = imagem; a.download = arquivo.name; a.click(); }
  }

  return (
    <div className="space-y-2">
      <input className="w-full rounded-lg border bg-white px-3 py-2 text-sm" value={frase} onChange={(e) => setFrase(e.target.value)} placeholder="Frase do post" />
      <button type="button" onClick={gerar} className="w-full rounded-xl p-2 font-semibold text-white" style={{ background: cor }}>📸 Gerar post</button>
      {imagem && (
        <>
          <img src={imagem} alt="Prévia do post" className="mx-auto w-full max-w-xs rounded-xl shadow-lg" />
          <button type="button" onClick={compartilhar} className="w-full rounded-xl bg-green-600 p-2 font-semibold text-white">📲 Compartilhar / baixar</button>
        </>
      )}
    </div>
  );
}
