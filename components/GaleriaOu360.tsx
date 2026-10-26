"use client";
// =====================================================================
// Página do produto: abas "🔄 360°" e "📷 Fotos" quando o produto tem giro.
// =====================================================================
import { useState } from "react";
import type { Midia } from "@/lib/tipos";
import Galeria from "@/components/Galeria";
import Giro360 from "@/components/Giro360";

export default function GaleriaOu360({ midias, nome, cor, produtoId }: { midias: Midia[]; nome: string; cor: string; produtoId: string }) {
  const [aba, setAba] = useState<"360" | "fotos">("360");
  const fotos = midias.filter((m) => m.tipo === "foto").map((m) => m.url);
  return (
    <div>
      <div className="mb-2 inline-flex rounded-xl border p-1 text-sm">
        {(["360", "fotos"] as const).map((a) => (
          <button key={a} type="button" onClick={() => setAba(a)} className="rounded-lg px-4 py-1.5 font-semibold" style={aba === a ? { background: cor, color: "white" } : {}}>
            {a === "360" ? "🔄 360°" : "📷 Fotos"}
          </button>
        ))}
      </div>
      {aba === "360" ? <Giro360 fotos={fotos} nome={nome} cor={cor} /> : <Galeria midias={midias} nome={nome} cor={cor} produtoId={produtoId} />}
    </div>
  );
}
