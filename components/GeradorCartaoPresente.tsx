"use client";
// =====================================================================
// 💌 CARTÃO DE PRESENTE DIGITAL — o cliente escolhe o tema (Natal,
// aniversário, mães...), escreve "Para", "De" e a mensagem, e o site
// desenha um cartão bonito (1080×1350) para mandar no WhatsApp junto
// com o presente. Usa os mesmos fundos do catálogo temático.
// =====================================================================
import { useEffect, useRef, useState } from "react";
import { TEMAS, desenharFundo, fotoCobrindo, quebrarTexto, retanguloRedondo } from "@/lib/catalogo";

const OCASIOES = [
  { tema: "natal", titulo: "Feliz Natal", frases: ["Que o seu Natal seja tão especial quanto você é para mim. Com todo carinho! 🎄", "Um presente pequeno para um carinho enorme. Feliz Natal e um ano novo cheio de alegrias! ✨"] },
  { tema: "natal-dourado", titulo: "Boas Festas", frases: ["Que a magia do Natal ilumine a sua casa e o seu coração. Boas festas!", "Obrigado(a) por fazer parte do meu ano. Que venham dias ainda melhores! ✨"] },
  { tema: "crianca", titulo: "Parabéns!", frases: ["Feliz aniversário! Que o seu dia seja cheio de risadas, bolo e muita diversão! 🎈", "Um presentinho para comemorar você! Parabéns e muitas felicidades! 🎉"] },
  { tema: "maes", titulo: "Com amor", frases: ["Para a pessoa que mais me inspira. Te amo! 💗", "Obrigado(a) por todo cuidado e carinho. Você merece o mundo! 💐"] },
  { tema: "casamento", titulo: "Felicidades", frases: ["Que a vida a dois seja repleta de amor, parceria e muitas alegrias! 💍", "Desejo a vocês um amor que cresça a cada dia. Felicidades!"] },
  { tema: "pascoa", titulo: "Feliz Páscoa", frases: ["Que a Páscoa traga renovação, paz e muito chocolate! 🐰", "Uma doce Páscoa para você e toda a família! 🍫"] },
  { tema: "pais", titulo: "Feliz Dia dos Pais", frases: ["Para o meu herói de todos os dias. Te amo, pai! 💙", "Obrigado por cada conselho, abraço e exemplo. Feliz Dia dos Pais!"] },
  { tema: "ano-novo", titulo: "Feliz Ano Novo", frases: ["Que o novo ano traga saúde, paz e muitas conquistas! 🥂", "Brindando a mais um ano ao seu lado. Feliz Ano Novo! ✨"] },
];

const carregar = (src: string | null) => new Promise<HTMLImageElement | null>((ok) => { if (!src) return ok(null); const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

export default function GeradorCartaoPresente({ loja }: { loja: { nome: string; slug: string; cor: string; logo_url: string | null } }) {
  const [ocasiao, setOcasiao] = useState(0);
  const [para, setPara] = useState("");
  const [de, setDe] = useState("");
  const [mensagem, setMensagem] = useState(OCASIOES[0].frases[0]);
  const [titulo, setTitulo] = useState(OCASIOES[0].titulo);
  const [imagem, setImagem] = useState<string | null>(null);
  const vez = useRef(0);

  function trocarOcasiao(i: number) {
    if (OCASIOES[ocasiao].frases.includes(mensagem) || !mensagem.trim()) setMensagem(OCASIOES[i].frases[0]);
    if (titulo === OCASIOES[ocasiao].titulo) setTitulo(OCASIOES[i].titulo);
    setOcasiao(i);
  }

  useEffect(() => {
    const minha = ++vez.current;
    const t = setTimeout(async () => {
      const tema = TEMAS.find((x) => x.id === OCASIOES[ocasiao].tema) ?? TEMAS[0];
      const L = 1080, A = 1350, E = 1.5;
      const c = document.createElement("canvas"); c.width = L * E; c.height = A * E;
      const ctx = c.getContext("2d")!; ctx.scale(E, E);
      try { await document.fonts.load(`700 90px ${tema.fonteTitulo}`); } catch {}
      desenharFundo(ctx, tema, L, A, 777 + ocasiao);
      // título
      const tam = /Great Vibes/.test(tema.fonteTitulo) ? 150 : /Dancing/.test(tema.fonteTitulo) ? 125 : 104;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 12; ctx.textAlign = "center";
      ctx.fillStyle = tema.id === "natal-dourado" ? tema.destaque : tema.texto; ctx.font = `700 ${tam}px ${tema.fonteTitulo}`;
      ctx.fillText(titulo || " ", L / 2, 300, L - 120); ctx.restore();
      // cartão branco com a mensagem
      const x = 100, y = 380, w = L - 200, h = 700;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
      ctx.fillStyle = "rgba(255,255,255,0.96)"; retanguloRedondo(ctx, x, y, w, h, 36); ctx.fill(); ctx.restore();
      ctx.strokeStyle = tema.destaque; ctx.lineWidth = 3; retanguloRedondo(ctx, x + 18, y + 18, w - 36, h - 36, 26); ctx.stroke();
      ctx.fillStyle = "#3a3a3a"; ctx.textAlign = "left";
      ctx.font = "600 38px Georgia, serif";
      if (para.trim()) ctx.fillText(`Para: ${para.trim()}`, x + 70, y + 110, w - 140);
      ctx.font = "italic 40px Georgia, serif";
      const linhas = quebrarTexto(ctx, mensagem.trim() || " ", w - 140, 8);
      const alturaTexto = linhas.length * 58;
      let ty = y + h / 2 - alturaTexto / 2 + 40;
      ctx.textAlign = "center";
      linhas.forEach((l) => { ctx.fillText(l, L / 2, ty); ty += 58; });
      ctx.textAlign = "right"; ctx.font = "600 38px Georgia, serif";
      if (de.trim()) ctx.fillText(`Com carinho, ${de.trim()}`, x + w - 70, y + h - 80, w - 140);
      ctx.textAlign = "left";
      // assinatura discreta da loja
      const logo = await carregar(loja.logo_url);
      if (logo) { ctx.save(); ctx.beginPath(); ctx.arc(L / 2 - 150, A - 120, 34, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.clip(); fotoCobrindo(ctx, logo, L / 2 - 184, A - 154, 68, 68); ctx.restore(); }
      ctx.fillStyle = tema.texto; ctx.globalAlpha = 0.85; ctx.font = "500 24px system-ui, sans-serif";
      ctx.fillText(`Presente da ${loja.nome}`, L / 2 - (logo ? 100 : 120), A - 112); ctx.globalAlpha = 1;
      if (minha === vez.current) setImagem(c.toDataURL("image/jpeg", 0.92));
    }, 350);
    return () => clearTimeout(t);
  }, [ocasiao, para, de, mensagem, titulo, loja.logo_url, loja.nome]);

  async function compartilhar() {
    if (!imagem) return;
    const arquivo = new File([await (await fetch(imagem)).blob()], `cartao-${para.trim() || "presente"}.jpg`, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [arquivo] })) await navigator.share({ files: [arquivo] }).catch(() => {});
    else { const a = document.createElement("a"); a.href = imagem; a.download = arquivo.name; a.click(); }
  }

  const caixa = "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-stone-900";
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {OCASIOES.map((o, i) => {
            const t = TEMAS.find((x) => x.id === o.tema)!;
            return (
              <button key={o.tema} type="button" onClick={() => trocarOcasiao(i)} className="rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm"
                style={{ background: `linear-gradient(${t.fundo[0]}, ${t.fundo[1]})`, color: t.texto, outline: i === ocasiao ? `3px solid ${loja.cor}` : "none", outlineOffset: 2 }}>
                {t.emoji} {o.titulo}
              </button>
            );
          })}
        </div>
        <label className="block text-sm font-semibold">Título<input className={caixa} value={titulo} maxLength={24} onChange={(e) => setTitulo(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">Para<input className={caixa} value={para} maxLength={30} placeholder="Ex.: Vó Maria" onChange={(e) => setPara(e.target.value)} /></label>
          <label className="block text-sm font-semibold">De<input className={caixa} value={de} maxLength={30} placeholder="Seu nome" onChange={(e) => setDe(e.target.value)} /></label>
        </div>
        <label className="block text-sm font-semibold">Mensagem<textarea rows={4} className={caixa} value={mensagem} maxLength={280} onChange={(e) => setMensagem(e.target.value)} /></label>
        <div className="flex flex-wrap gap-1.5">
          {OCASIOES[ocasiao].frases.map((f) => <button key={f} type="button" onClick={() => setMensagem(f)} className="rounded-full bg-black/5 px-3 py-1 text-left text-xs">💡 {f.slice(0, 48)}…</button>)}
        </div>
        <button type="button" onClick={compartilhar} disabled={!imagem} className="w-full rounded-xl bg-[#25D366] p-3 font-semibold text-white disabled:opacity-50">📲 Enviar / baixar o cartão</button>
      </div>
      <div>{imagem ? <img src={imagem} alt="Prévia do cartão" className="w-full rounded-2xl shadow-xl" /> : <div className="aspect-[4/5] animate-pulse rounded-2xl bg-black/10" />}</div>
    </div>
  );
}
