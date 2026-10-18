// =====================================================================
// CABEÇALHOS DE SEGURANÇA — o navegador recebe regras extras em toda
// página (Next.js 16: este arquivo se chama "proxy", antes "middleware").
//   - ninguém pode colocar o site dentro de outro site (golpe de "clique falso")
//   - o navegador não "adivinha" o tipo dos arquivos
//   - os outros sites recebem só o endereço básico de onde o cliente veio
//   - câmera e microfone ficam bloqueados (o site não usa)
// =====================================================================
import { NextResponse, type NextRequest } from "next/server";

export function proxy(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), payment=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  return res;
}

// Vale para as páginas (não precisa rodar nos arquivos estáticos)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icones/).*)"],
};
