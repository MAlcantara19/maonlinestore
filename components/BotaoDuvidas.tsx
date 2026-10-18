"use client";
// =====================================================================
// BOTÃO "DÚVIDAS?" — bolinha verde com telefone no canto da tela.
// 3 segundos depois que a pessoa entra, aparece um balãozinho
// "digitando..." e depois a mensagem, como no WhatsApp. Ao tocar no
// balão ou no botão, abre o WhatsApp da loja com uma mensagem pronta.
// O balão aparece uma vez por visita (dá para fechar no ✕).
// =====================================================================
import { linkWhatsApp } from "@/lib/whatsapp";
import { registrarEvento } from "@/lib/eventos";
import { useEffect, useState } from "react";
import { IconeTelefone } from "@/components/Icones";

export default function BotaoDuvidas({ whatsapp, nomeDaLoja, slug }: { whatsapp: string; nomeDaLoja: string; slug?: string }) {
  const numero = whatsapp.replace(/\D/g, "");
  const link = linkWhatsApp(numero, `Olá! Tenho uma dúvida sobre a ${nomeDaLoja} 😊`);
  const [fase, setFase] = useState<"nada" | "digitando" | "mensagem">("nada");

  useEffect(() => {
    try { if (sessionStorage.getItem("balao-visto")) return; } catch {}
    const t1 = setTimeout(() => setFase("digitando"), 3000);
    const t2 = setTimeout(() => setFase("mensagem"), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const contar = () => { if (slug) registrarEvento(slug, "whatsapp"); }; // estatísticas
  const fechar = () => {
    setFase("nada");
    try { sessionStorage.setItem("balao-visto", "1"); } catch {}
  };

  return (
    <>
      {/* Balãozinho de conversa */}
      {fase !== "nada" && (
        <div className="balao fixed left-4 z-20 max-w-[16rem] rounded-2xl rounded-bl-sm bg-white p-3 pr-7 text-sm text-stone-900 shadow-xl"
          style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-2 top-1 text-xs opacity-50">✕</button>
          {fase === "digitando" ? (
            <span className="flex gap-1 py-1" aria-label="digitando">
              <span className="ponto-digitando">●</span>
              <span className="ponto-digitando" style={{ animationDelay: ".15s" }}>●</span>
              <span className="ponto-digitando" style={{ animationDelay: ".3s" }}>●</span>
            </span>
          ) : (
            <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => { fechar(); contar(); }}>
              Olá! 👋 Ficou com alguma dúvida? <b>Fale com a gente pelo WhatsApp!</b>
            </a>
          )}
        </div>
      )}

      {/* Botão redondo, pulsando de leve */}
      <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Tirar dúvidas pelo WhatsApp" onClick={contar} title="Dúvidas? Fale com a gente"
        className="botao-vivo pulsar clicavel fixed left-4 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <span className="icone-tremer"><IconeTelefone tamanho={24} /></span>
      </a>
    </>
  );
}
