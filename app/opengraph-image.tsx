// =====================================================================
// IMAGEM DE PRÉVIA PADRÃO — aparece quando alguém compartilha o link do
// site (WhatsApp, Instagram...) e a página não tem foto própria.
// =====================================================================
import { ImageResponse } from "next/og";

export const alt = "MA Online Store";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagem() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #3B1260, #7C3AC4)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2 }}>MA Online Store</div>
        <div style={{ fontSize: 40, opacity: 0.9, marginTop: 20 }}>VitraForma · Gallerie · Sonhos de Açúcar · Aromas · Chocolate</div>
        <div style={{ fontSize: 34, marginTop: 40, padding: "12px 32px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}>Peça pelo WhatsApp</div>
      </div>
    ),
    size
  );
}
