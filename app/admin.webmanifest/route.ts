// =====================================================================
// APP DO PAINEL ("MA Painel") — um segundo aplicativo instalável, só
// para administradores. Abra /admin no Chrome do celular → ⋮ → "Instalar
// app": ele fica separado do app das lojas e continua logado.
// =====================================================================

export function GET() {
  return Response.json({
    id: "/admin",
    name: "MA Painel",
    short_name: "MA Painel",
    description: "Painel das lojas da MA Online Store",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#1c1917",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
