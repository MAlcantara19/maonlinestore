// =====================================================================
// "MANIFESTO" DO APP — permite INSTALAR o site no celular como se fosse
// um aplicativo (ícone na tela inicial, abre em tela cheia, sem a barra
// do navegador). No Android: menu ⋮ > "Instalar app" / "Adicionar à tela
// inicial". No iPhone: Compartilhar > "Adicionar à Tela de Início".
// Os ícones ficam em public/icones (troque pelos seus quando quiser).
// =====================================================================
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MA Online Store",
    short_name: "MA Online Store",
    description: "VitraForma, Gallerie, Sonhos de Açúcar, Paixão por Aromas e Paixão por Chocolate num só lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3B1260",
    lang: "pt-BR",
    // Atalhos ao segurar o ícone (Android): ir direto para o painel
    shortcuts: [{ name: "Área do lojista", short_name: "Painel", url: "/admin", icons: [{ src: "/icones/icone-192.png", sizes: "192x192" }] }],
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
