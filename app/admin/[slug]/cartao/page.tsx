"use client";
// =====================================================================
// PAINEL — CARTÃO DIGITAL COM QR CODE (endereço: /admin/vitraforma/cartao)
// Gera uma imagem bonita (formato post do Instagram) com a logo, o nome,
// as cores da loja e um QR Code que leva direto para o catálogo.
// Baixe e use no Instagram, no WhatsApp ou imprima para a embalagem.
// (Precisa da biblioteca "qrcode": npm install qrcode)
// =====================================================================
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import AreaAdmin from "@/components/admin/AreaAdmin";
import AbasLoja from "@/components/admin/AbasLoja";
import { Bloco, Campo, estiloInput } from "@/components/admin/Campos";
import { supabaseNavegador } from "@/lib/supabase-navegador";
import { usuarioInstagram } from "@/lib/formato";

type LojaCartao = { id: string; slug: string; nome: string; descricao: string | null; cor: string | null; cor_secundaria: string | null; logo_url: string | null; instagram: string | null };

export default function PainelCartao() {
  return <AreaAdmin>{() => <Conteudo />}</AreaAdmin>;
}

// Carrega uma imagem para desenhar no canvas (null se não der)
const carregarImagem = (src: string) =>
  new Promise<HTMLImageElement | null>((ok) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });

function Conteudo() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaCartao | null>(null);
  const [frase, setFrase] = useState("Aponte a câmera e veja nosso catálogo!");
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabaseNavegador().from("lojas").select("id, slug, nome, descricao, cor, cor_secundaria, logo_url, instagram").eq("slug", slug).maybeSingle()
      .then(({ data }: { data: LojaCartao | null }) => setLoja(data));
  }, [slug]);

  // Desenha o cartão sempre que algo muda
  useEffect(() => {
    if (!loja || !tela.current) return;
    (async () => {
      const c = tela.current!;
      const ctx = c.getContext("2d")!;
      const L = 1080, A = 1350;
      c.width = L; c.height = A;
      const cor = loja.cor ?? "#3B1260";
      const cor2 = loja.cor_secundaria ?? cor;

      // Fundo em degradê + bolhas
      const g = ctx.createLinearGradient(0, 0, L, A);
      g.addColorStop(0, cor); g.addColorStop(1, cor2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, L, A);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      [[120, 160, 140], [960, 240, 200], [780, 1250, 260]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });

      // Cartão de "vidro" no centro
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(90, 160, L - 180, A - 320, 48); ctx.fill(); ctx.stroke();

      // Logo redonda
      ctx.save();
      ctx.beginPath(); ctx.arc(L / 2, 330, 120, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.clip();
      const logo = loja.logo_url ? await carregarImagem(loja.logo_url) : null;
      if (logo) ctx.drawImage(logo, L / 2 - 120, 210, 240, 240);
      else { ctx.fillStyle = cor; ctx.font = "bold 140px system-ui"; ctx.textAlign = "center"; ctx.fillText(loja.nome.charAt(0), L / 2, 380); }
      ctx.restore();

      // Nome e descrição
      ctx.fillStyle = "#fff"; ctx.textAlign = "center";
      ctx.font = "bold 76px system-ui"; ctx.fillText(loja.nome, L / 2, 540);
      ctx.font = "36px system-ui"; ctx.globalAlpha = 0.9; ctx.fillText(loja.descricao ?? "", L / 2, 595); ctx.globalAlpha = 1;

      // QR Code numa moldura branca
      const url = `${window.location.origin}/${loja.slug}`;
      const qr = await carregarImagem(await QRCode.toDataURL(url, { margin: 1, width: 420, color: { dark: "#111111", light: "#ffffff" } }));
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(L / 2 - 240, 650, 480, 480, 32); ctx.fill();
      if (qr) ctx.drawImage(qr, L / 2 - 210, 680, 420, 420);

      // Frase e contatos
      ctx.fillStyle = "#fff"; ctx.font = "bold 40px system-ui"; ctx.fillText(frase, L / 2, 1175, L - 220);
      const insta = usuarioInstagram(loja.instagram);
      ctx.font = "32px system-ui"; ctx.globalAlpha = 0.9;
      ctx.fillText(url.replace(/^https?:\/\//, ""), L / 2, 1290);
      if (insta) ctx.fillText(`@${insta}`, L / 2, 1240);
      ctx.globalAlpha = 1;
    })();
  }, [loja, frase]);

  if (!loja) return <p className="opacity-60">Carregando...</p>;
  const cor = loja.cor ?? "#333";

  function baixar() {
    const link = document.createElement("a");
    link.download = `cartao-${loja!.slug}.png`;
    link.href = tela.current!.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <AbasLoja slug={slug} nome={loja.nome} cor={cor} />
      <Bloco titulo="📇 Cartão digital com QR Code">
        <Campo rotulo="Frase do cartão"><input className={estiloInput} value={frase} onChange={(e) => setFrase(e.target.value)} /></Campo>
        <canvas ref={tela} className="mx-auto w-full max-w-sm rounded-2xl shadow-xl" />
        <p className="text-center text-xs opacity-60">Formato 1080 × 1350 (post do Instagram). O QR Code abre o catálogo da loja.</p>
        <button type="button" onClick={baixar} className="w-full rounded-xl p-3 font-semibold text-white" style={{ background: cor }}>⬇️ Baixar imagem</button>
      </Bloco>
    </>
  );
}
