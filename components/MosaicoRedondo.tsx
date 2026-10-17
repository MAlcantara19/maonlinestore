// =====================================================================
// MOSAICO DE LOGOS REDONDAS — a logo repetida em bolinhas, cobrindo a
// área toda, andando devagar na diagonal sem "emendas".
//   corFundo = a cor que aparece ENTRE as bolinhas (vazio = transparente)
//   borda    = borda de cada bolinha (a mesma da logo da loja)
// =====================================================================
type Props = { src: string; tamanho?: number; quantidade?: number; corFundo?: string | null; borda?: { cor?: string | null; largura?: number | null } };

export default function MosaicoRedondo({ src, tamanho = 96, quantidade = 600, corFundo, borda }: Props) {
  const b = Math.min(borda?.largura ?? 0, 6);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: corFundo ?? undefined }}>
      {/* A grade é um pouco maior que a tela e anda exatamente 1 bolinha: o loop fica perfeito */}
      <div className="mosaico-grade absolute grid"
        style={{ inset: -tamanho, gridTemplateColumns: `repeat(auto-fill, ${tamanho}px)`, ["--passo" as string]: `${tamanho}px` }}>
        {Array.from({ length: quantidade }, (_, i) => (
          <img key={i} src={src} alt="" className="rounded-full object-cover"
            style={{ width: tamanho - 8, height: tamanho - 8, margin: 4, border: b ? `${b}px solid ${borda?.cor ?? "#fff"}` : undefined }} />
        ))}
      </div>
    </div>
  );
}
