// =====================================================================
// MOSAICO DE LOGOS REDONDAS — a logo repetida em bolinhas, cobrindo a
// área toda, andando devagar na diagonal sem "emendas".
// (Feito com imagens de verdade para cada logo ficar REDONDA.)
// =====================================================================
export default function MosaicoRedondo({ src, tamanho = 96, quantidade = 600 }: { src: string; tamanho?: number; quantidade?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* A grade é um pouco maior que a tela e anda exatamente 1 bolinha: o loop fica perfeito */}
      <div className="mosaico-grade absolute grid"
        style={{ inset: -tamanho, gridTemplateColumns: `repeat(auto-fill, ${tamanho}px)`, ["--passo" as string]: `${tamanho}px` }}>
        {Array.from({ length: quantidade }, (_, i) => (
          <img key={i} src={src} alt="" className="rounded-full object-cover"
            style={{ width: tamanho - 8, height: tamanho - 8, margin: 4 }} />
        ))}
      </div>
    </div>
  );
}
