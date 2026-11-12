// =====================================================================
// CABEÇALHOS DE SEGURANÇA — o navegador recebe regras extras em toda
// página (Next.js 16: este arquivo se chama "proxy", antes "middleware").
//   - ninguém pode colocar o site dentro de outro site (golpe de "clique falso")
//   - o navegador não "adivinha" o tipo dos arquivos
//   - os outros sites recebem só o endereço básico de onde o cliente veio
//   - câmera e microfone ficam bloqueados (o site não usa)
//   - CSP (Content-Security-Policy): a "lista de convidados" — o navegador
//     só carrega scripts, fontes, imagens e conexões dos lugares abaixo.
//     Se um dia entrar um serviço novo (ex.: outro mapa, um chat), ele
//     precisa ser acrescentado aqui, senão o navegador bloqueia.
// =====================================================================
import { NextResponse, type NextRequest } from "next/server";

const desenvolvimento = process.env.NODE_ENV !== "production";

// Endereço do Supabase deste projeto (banco, fotos e login)
const supabase = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin; } catch { return "https://*.supabase.co"; }
})();

const CSP = [
  "default-src 'self'",
  // Scripts: só do próprio site (o Next precisa de 'unsafe-inline'; em desenvolvimento também de 'unsafe-eval')
  `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ""} https://vercel.live`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Imagens: fotos do Supabase, QR Codes (data:), vídeos/imagens gerados (blob:) e mapas
  "img-src 'self' data: blob: https:",
  `media-src 'self' blob: ${supabase}`,
  // Conexões: banco/login/fotos (Supabase), CEP (ViaCEP) e os geradores (data:/blob:)
  `connect-src 'self' data: blob: ${supabase} ${supabase.replace("https://", "wss://")} https://viacep.com.br https://vercel.live wss://ws-us3.pusher.com`,
  // Mapa dos parceiros (Google Maps) e a barrinha de comentários das prévias da Vercel
  "frame-src https://www.google.com https://maps.google.com https://vercel.live",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export function proxy(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), payment=(), usb=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // Isola a janela do site das janelas que ele abre (WhatsApp, Instagram...)
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  // Arquivos do site só podem ser "embutidos" por ele mesmo
  res.headers.set("Cross-Origin-Resource-Policy", "same-site");
  return res;
}

// Vale para as páginas (não precisa rodar nos arquivos estáticos)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icones/).*)"],
};
