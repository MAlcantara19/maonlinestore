// =====================================================================
// LINK DO WHATSAPP — um lugar só para montar todos os links.
// Usa api.whatsapp.com/send (e não wa.me): o redirecionamento do wa.me
// estraga emojis em algumas versões do WhatsApp (aparecem como "�").
// =====================================================================
export function linkWhatsApp(numero: string | null | undefined, texto?: string): string {
  const digitos = (numero ?? "").replace(/\D/g, "");
  return `https://api.whatsapp.com/send?phone=${digitos}${texto ? `&text=${encodeURIComponent(texto)}` : ""}`;
}
