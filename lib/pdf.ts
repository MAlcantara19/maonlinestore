// =====================================================================
// 📄 PDF DE VERDADE (sem imprimir pela janela do navegador)
// Junta as páginas do catálogo (imagens JPG) num arquivo .pdf limpinho:
// sem data, sem endereço do site, sem margem — exatamente as páginas.
// Feito à mão (sem biblioteca), funciona em qualquer navegador.
// =====================================================================

export type PaginaJpg = { dados: Uint8Array; largura: number; altura: number };

const texto = (s: string) => new TextEncoder().encode(s);

// "data:image/jpeg;base64,..." → bytes + tamanho
export async function jpgDaUrl(url: string): Promise<PaginaJpg> {
  const bin = atob(url.split(",")[1]);
  const dados = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const img = await new Promise<HTMLImageElement>((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
  return { dados, largura: img.naturalWidth, altura: img.naturalHeight };
}

// tamanhoPt = tamanho da folha em pontos (1 px da página = 0,75 pt)
export function pdfDeImagens(paginas: PaginaJpg[], tamanhoPt: { w: number; h: number }): Blob {
  const partes: Uint8Array[] = [];
  const posicoes: number[] = [];
  let tamanho = 0;
  const add = (b: Uint8Array) => { partes.push(b); tamanho += b.length; };
  const objeto = (n: number, corpo: (Uint8Array | string)[]) => {
    posicoes[n] = tamanho;
    add(texto(`${n} 0 obj\n`));
    corpo.forEach((c) => add(typeof c === "string" ? texto(c) : c));
    add(texto("\nendobj\n"));
  };

  add(texto("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  // 1 = catálogo, 2 = lista de páginas; cada página usa 3 objetos (página, imagem, desenho)
  const idsPaginas = paginas.map((_, i) => 3 + i * 3);
  objeto(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  objeto(2, [`<< /Type /Pages /Kids [${idsPaginas.map((id) => `${id} 0 R`).join(" ")}] /Count ${paginas.length} >>`]);
  const { w, h } = tamanhoPt;
  paginas.forEach((p, i) => {
    const pag = 3 + i * 3, img = pag + 1, cont = pag + 2;
    objeto(pag, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${img} 0 R >> >> /Contents ${cont} 0 R >>`]);
    objeto(img, [`<< /Type /XObject /Subtype /Image /Width ${p.largura} /Height ${p.altura} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.dados.length} >>\nstream\n`, p.dados, "\nendstream"]);
    const desenho = `q ${w} 0 0 ${h} 0 0 cm /Im${i} Do Q`;
    objeto(cont, [`<< /Length ${desenho.length} >>\nstream\n${desenho}\nendstream`]);
  });

  const total = 3 + paginas.length * 3;
  const inicioXref = tamanho;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) xref += `${String(posicoes[n]).padStart(10, "0")} 00000 n \n`;
  add(texto(`${xref}trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`));
  return new Blob(partes as BlobPart[], { type: "application/pdf" });
}
