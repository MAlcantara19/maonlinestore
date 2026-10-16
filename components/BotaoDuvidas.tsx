// =====================================================================
// BOTÃO "DÚVIDAS?" — balãozinho verde no canto, abre o WhatsApp da loja
// com uma mensagem pronta, sem precisar montar pedido.
// =====================================================================
export default function BotaoDuvidas({ whatsapp, nomeDaLoja }: { whatsapp: string; nomeDaLoja: string }) {
  const numero = whatsapp.replace(/\D/g, "");
  const texto = encodeURIComponent(`Olá! Tenho uma dúvida sobre a ${nomeDaLoja} 😊`);
  return (
    <a href={`https://wa.me/${numero}?text=${texto}`} target="_blank" rel="noopener noreferrer"
      aria-label="Tirar dúvidas pelo WhatsApp" title="Dúvidas? Fale com a gente"
      className="clicavel fixed left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#1FA855] text-xl text-white shadow-lg"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
      💬
    </a>
  );
}
