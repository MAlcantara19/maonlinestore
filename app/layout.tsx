// =====================================================================
// MOLDURA DE TODAS AS PÁGINAS (layout raiz)
//   - Título da aba: "MA Online Store" (e "Produto · Loja · MA Online Store"
//     nas outras páginas)
//   - Aplica o tema claro/escuro salvo ANTES da página aparecer (sem piscar)
// =====================================================================
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MA Online Store", template: "%s" },
  description: "VitraForma, Gallerie, Sonhos de Açúcar, Paixão por Aromas e Paixão por Chocolate num só lugar. Peça pelo WhatsApp!",
  applicationName: "MA Online Store",
};

export const viewport: Viewport = { themeColor: "#3B1260" };

// Lê o tema salvo e marca o <html> na hora (antes de desenhar a página)
const SCRIPT_TEMA = `try{var t=localStorage.getItem("tema");document.documentElement.dataset.tema=t==="escuro"?"escuro":"claro"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-tema="claro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full antialiased" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
