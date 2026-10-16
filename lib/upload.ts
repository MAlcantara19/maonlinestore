// =====================================================================
// ENVIO DE FOTOS E VÍDEOS PARA O SUPABASE STORAGE (pasta "produtos")
//   - Fotos: diminuídas no próprio celular/PC antes de enviar
//     (no máximo 1400 px e em formato WebP, bem mais leve).
//   - Vídeos: enviados como estão (prefira vídeos curtos, até ~20 MB).
// Devolve o endereço público do arquivo, pronto para salvar no banco.
// =====================================================================
import { supabaseNavegador } from "@/lib/supabase-navegador";

const BUCKET = "produtos";
export const LIMITE_VIDEO_MB = 20;

// Diminui a foto usando um "canvas" (desenho) do navegador.
async function comprimirImagem(arquivo: File, maximo = 1400, qualidade = 0.82): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, maximo / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, erro) =>
    canvas.toBlob((b) => (b ? ok(b) : erro(new Error("Não deu para converter a foto"))), "image/webp", qualidade)
  );
}

export type ArquivoEnviado = { url: string; tipo: "foto" | "video" };

// pasta: onde guardar dentro do bucket (ex.: "vitraforma", "logos", "parceiros")
export async function enviarArquivo(arquivo: File, pasta: string): Promise<ArquivoEnviado> {
  const ehVideo = arquivo.type.startsWith("video/");
  const ehGif = arquivo.type === "image/gif"; // GIF animado: envia como está

  if (ehVideo && arquivo.size > LIMITE_VIDEO_MB * 1024 * 1024) {
    throw new Error(`O vídeo passa de ${LIMITE_VIDEO_MB} MB. Grave um trecho mais curto.`);
  }

  let conteudo: Blob = arquivo;
  let extensao = arquivo.name.split(".").pop()?.toLowerCase() || (ehVideo ? "mp4" : "jpg");
  let tipoArquivo = arquivo.type;

  if (!ehVideo && !ehGif) {
    try {
      conteudo = await comprimirImagem(arquivo);
      extensao = "webp";
      tipoArquivo = "image/webp";
    } catch {
      // Formato que o navegador não consegue converter (ex.: HEIC do iPhone): envia o original
    }
  }

  const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  const supabase = supabaseNavegador();
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, conteudo, { contentType: tipoArquivo, cacheControl: "31536000" });
  if (error) throw new Error(`Falha no envio: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
  return { url: data.publicUrl, tipo: ehVideo ? "video" : "foto" };
}
