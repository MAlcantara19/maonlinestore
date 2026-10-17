"use client";
// =====================================================================
// AJUSTAR A IMAGEM ANTES DE ENVIAR (recorte) — aparece um quadro no
// formato certo (quadrado, banner deitado...). Você:
//   - ARRASTA a imagem para posicionar
//   - usa o ZOOM para aproximar ou afastar (afastar mostra a imagem toda)
//   - escolhe a COR DO FUNDO que preenche as sobras (cores da loja,
//     branco, preto ou transparente)
// No fim, a imagem sai no tamanho ideal, sem distorcer.
// =====================================================================
import { useEffect, useRef, useState } from "react";

type Props = {
  arquivo: File | string; // arquivo novo ou endereço da imagem atual
  proporcao: number; // largura ÷ altura (1 = quadrado, 16/5 = banner)
  largura: number; // largura final em pixels
  cores?: (string | null | undefined)[]; // cores da loja para o fundo
  redonda?: boolean; // mostra a guia redonda (logos)
  aoConfirmar: (arquivo: File) => void;
  aoCancelar: () => void;
};

export default function EditorRecorte({ arquivo, proporcao, largura, cores = [], redonda, aoConfirmar, aoCancelar }: Props) {
  const tela = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // deslocamento (em % da área)
  const [fundo, setFundo] = useState<string>("transparente");
  const arraste = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const altura = Math.round(largura / proporcao);

  // Carrega a imagem
  useEffect(() => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => {
      setImg(i);
      // começa mostrando a imagem INTEIRA (cabe no quadro)
      const cabe = Math.min(largura / i.width, altura / i.height) / Math.max(largura / i.width, altura / i.height);
      setZoom(Math.max(0.2, +cabe.toFixed(2)));
    };
    i.src = typeof arquivo === "string" ? arquivo : URL.createObjectURL(arquivo);
  }, [arquivo, largura, altura]);

  // Desenha (prévia e resultado final usam o mesmo desenho)
  const desenhar = (c: HTMLCanvasElement) => {
    if (!img) return;
    c.width = largura; c.height = altura;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, largura, altura);
    if (fundo !== "transparente") { ctx.fillStyle = fundo; ctx.fillRect(0, 0, largura, altura); }
    // zoom 1 = a imagem COBRE o quadro; menor que 1 = afasta e sobra fundo
    const cobre = Math.max(largura / img.width, altura / img.height) * zoom;
    const w = img.width * cobre, h = img.height * cobre;
    ctx.drawImage(img, (largura - w) / 2 + (pos.x / 100) * largura, (altura - h) / 2 + (pos.y / 100) * altura, w, h);
  };
  useEffect(() => { if (tela.current) desenhar(tela.current); });

  function confirmar() {
    const c = document.createElement("canvas");
    desenhar(c);
    c.toBlob((b) => b && aoConfirmar(new File([b], "imagem.png", { type: "image/png" })), "image/png");
  }

  const paleta = [...new Set([...cores.filter(Boolean) as string[], "#ffffff", "#000000"])];

  return (
    <div className="surgir fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={aoCancelar}>
      <div onClick={(e) => e.stopPropagation()} className="subir w-full max-w-xl rounded-2xl bg-white p-4 text-stone-900 shadow-2xl">
        <b className="text-lg">✂️ Ajustar imagem</b>
        <p className="mb-3 text-xs opacity-60">Arraste para posicionar · zoom para aproximar/afastar · escolha a cor das sobras. Sai em {largura} × {altura} px.</p>

        {/* Área de recorte (fundo quadriculado = transparente) */}
        <div className="relative mx-auto overflow-hidden rounded-xl bg-[repeating-conic-gradient(#e7e5e4_0_25%,#fff_0_50%)] bg-[length:16px_16px]"
          style={{ aspectRatio: `${proporcao}`, maxHeight: "50vh", touchAction: "none", cursor: "grab" }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); arraste.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY }; }}
          onPointerMove={(e) => {
            if (!arraste.current) return;
            const r = e.currentTarget.getBoundingClientRect();
            setPos({ x: arraste.current.x + ((e.clientX - arraste.current.px) / r.width) * 100, y: arraste.current.y + ((e.clientY - arraste.current.py) / r.height) * 100 });
          }}
          onPointerUp={() => (arraste.current = null)}>
          <canvas ref={tela} className="h-full w-full" />
          {redonda && <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />}
        </div>

        <label className="mt-3 block text-sm">Zoom: <b>{Math.round(zoom * 100)}%</b>
          <input type="range" min={0.2} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="block w-full" />
        </label>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          Fundo:
          <button type="button" onClick={() => setFundo("transparente")} className="rounded-full border px-2 py-1 text-xs" style={fundo === "transparente" ? { outline: "2px solid #111" } : {}}>Transparente</button>
          {paleta.map((c) => (
            <button key={c} type="button" onClick={() => setFundo(c)} aria-label={`Fundo ${c}`} className="h-7 w-7 rounded-full border"
              style={{ background: c, outline: fundo === c ? "2px solid #111" : "none", outlineOffset: 2 }} />
          ))}
          <input type="color" value={fundo.startsWith("#") ? fundo : "#ffffff"} onChange={(e) => setFundo(e.target.value)} className="h-7 w-9 rounded" title="Outra cor" />
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => { setPos({ x: 0, y: 0 }); setZoom(1); }} className="rounded-xl border px-3 text-sm">↺</button>
          <button type="button" onClick={aoCancelar} className="rounded-xl border px-4 text-sm">Cancelar</button>
          <button type="button" onClick={confirmar} disabled={!img} className="flex-1 rounded-xl bg-stone-900 p-3 font-semibold text-white disabled:opacity-40">✓ Usar esta imagem</button>
        </div>
      </div>
    </div>
  );
}
